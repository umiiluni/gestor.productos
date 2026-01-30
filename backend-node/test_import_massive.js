const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🚀 Iniciando prueba masiva de importación (12,000 productos)...');
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Logs de consola para debug
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // 1. Ir a importación
    console.log('📂 Navegando a importacion.html...');
    await page.goto('http://localhost:8000/importacion.html');

    // 2. Subir archivo
    const filePath = path.join(__dirname, '../public/productos_masivos_test.xlsx');
    console.log(`📄 Seleccionando archivo: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        throw new Error(`El archivo no existe: ${filePath}`);
    }

    const inputUpload = await page.$('#file-csv');
    await inputUpload.uploadFile(filePath);
    
    // Disparar evento change si es necesario
    await page.evaluate(() => {
        const event = new Event('change', { bubbles: true });
        document.getElementById('file-csv').dispatchEvent(event);
    });

    console.log('⏳ Esperando previsualización...');
    // Esperar a que la tabla de preview tenga filas (puede tardar un poco con 12k)
    try {
        await page.waitForFunction(() => {
            const filas = document.querySelectorAll('#preview-table tbody tr');
            const fileInfo = document.getElementById('file-info-csv');
            // Esperar filas o al menos confirmación visual de que se procesó
            // A veces con 12k filas el DOM tarda, podríamos verificar ImportacionCore.productosImportar
            const productosCargados = window.ImportacionCore && window.ImportacionCore.productosImportar.length > 0;
            return productosCargados || filas.length > 0;
        }, { timeout: 120000 }); // 120 segundos timeout para procesar Excel
    } catch (e) {
        console.error('❌ Timeout esperando previsualización.');
        // Tomar screenshot si falla
        await page.screenshot({ path: 'debug_preview_fail.png' });
        throw e;
    }

    const countPreview = await page.evaluate(() => {
        return document.querySelectorAll('#preview-table tbody tr').length;
    });
    console.log(`👀 Previsualización cargada: ${countPreview} filas visibles (aprox).`);

    // 3. Ejecutar Importación
    console.log('▶️ Ejecutando importación...');
    
    // Clic en botón inicial
    await page.click('#btn-import');

    // Esperar al modal de confirmación dinámico (creado por ImportManager)
    // El modal tiene id="confirm-import" en el botón, pero el modal en sí no tiene ID, solo class="modal"
    // Buscamos el botón confirmar dentro del modal
    console.log('⏳ Esperando modal de confirmación...');
    await page.waitForSelector('#confirm-import', { visible: true });
    
    // Clic en confirmar del modal
    console.log('✅ Confirmando en modal...');
    await page.click('#confirm-import');

    // Ahora sí esperar a que aparezca el modal de progreso
    await page.waitForSelector('#progress-modal', { visible: true });
    console.log('🔄 Modal de progreso visible.');

    // Esperar a que termine (el modal desaparece o cambia mensaje)
    // Asumimos que al terminar muestra un mensaje de éxito o cierra el modal
    // Vamos a esperar un tiempo prudencial y chequear logs o alertas
    
    // Monitorear progreso
    let lastLog = Date.now();
    await new Promise(resolve => {
        const interval = setInterval(async () => {
            const modalVisible = await page.evaluate(() => {
                const modal = document.getElementById('progress-modal');
                return modal && modal.style.display !== 'none';
            });
            
            if (!modalVisible) {
                clearInterval(interval);
                resolve();
            }
            
            // Timeout de seguridad de 5 minutos
            if (Date.now() - lastLog > 300000) {
                clearInterval(interval);
                resolve();
            }
        }, 1000);
    });

    console.log('✅ Proceso de importación finalizado (modal cerrado).');
    
    console.log('🔍 Verificando cantidad de productos en inventario (vía API)...');
    
    // Verificación directa vía API sin depender del renderizado UI que puede ser lento
    try {
        const totalReal = await page.evaluate(async () => {
            try {
                const res = await fetch('/api/products');
                if (!res.ok) return -1;
                const prods = await res.json();
                return prods.length;
            } catch (e) {
                return -2;
            }
        });

        console.log(`📊 Total productos en DB: ${totalReal}`);

        if (totalReal >= 12000) {
            console.log('✅ ¡PRUEBA EXITOSA! Se importaron los 12,000+ productos.');
        } else {
            console.error(`❌ PRUEBA FALLIDA: Solo se encontraron ${totalReal} productos.`);
        }
    } catch (error) {
        console.error('❌ Error verificando API:', error);
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await browser.close();
  }
})();
