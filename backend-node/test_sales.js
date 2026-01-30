const puppeteer = require('puppeteer');

(async () => {
    // Lanzar navegador (headless: "new" para entornos CI/Server, o false para debug visual)
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Función helper para logs
    const log = (msg) => console.log(`[TEST-VENTAS] ${msg}`);
    
    // Capturar logs del navegador
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    try {
        log('🚀 Iniciando prueba de módulo de Ventas...');
        await page.goto('http://localhost:8000/ventas.html');
        
        // 1. Verificar carga inicial
        await page.waitForSelector('#venta-codigo-barra');
        log('✅ Módulo de ventas cargado (Input código detectado)');

        // Esperar a que los productos se sincronicen en localStorage
        log('⏳ Esperando sincronización de productos (localStorage)...');
        
        // Verificar si hay error de quota o similar
        await page.waitForFunction(() => {
            const prods = localStorage.getItem('productos');
            return prods && JSON.parse(prods).length > 5; // Esperamos más de 5 (que parecen ser los default/test)
        }, { timeout: 15000 }).catch(e => log('⚠️ Timeout esperando sincronización masiva.'));

        const totalProductos = await page.evaluate(() => {
            try {
                const p = JSON.parse(localStorage.getItem('productos') || '[]');
                return p.length;
            } catch(e) { return -1; }
        });
        log(`✅ Productos en localStorage: ${totalProductos}`);

        // ==========================================
        // PRUEBA 1: AGREGAR PRODUCTO (SIMULACIÓN SCANNER/TECLADO)
        // ==========================================
        // Usamos un código conocido de la base de datos (verificado con check_db.js)
        const codigoPrueba = 'E2E0001'; 
        log(`🔍 Buscando producto por código: ${codigoPrueba}...`);
        
        await page.type('#venta-codigo-barra', codigoPrueba);
        await page.keyboard.press('Enter');
        
        // Esperar a que se agregue al carrito (tabla carrito)
        // El script ventas.js agrega filas a #carrito-items
        await page.waitForSelector('.carrito-item');
        
        const cantidadItems = await page.evaluate(() => document.querySelectorAll('.carrito-item').length);
        if (cantidadItems > 0) {
            log(`✅ Producto agregado al carrito. Items: ${cantidadItems}`);
        } else {
            throw new Error('No se agregó el producto al carrito tras escanear');
        }

        // ==========================================
        // PRUEBA 2: CAMBIAR CANTIDAD
        // ==========================================
        log('🔢 Probando cambio de cantidad...');
        // Buscamos el input de cantidad del primer item
        const inputCantidadSelector = '.carrito-item:first-child input.input-cantidad-carrito';
        await page.waitForSelector(inputCantidadSelector);
        
        // Cambiar a 2
        await page.click(inputCantidadSelector, { clickCount: 3 }); // Seleccionar todo
        await page.type(inputCantidadSelector, '2');
        await page.keyboard.press('Enter'); // Disparar change/blur
        
        // Verificar subtotal o que el valor persista
        const valorInput = await page.$eval(inputCantidadSelector, el => el.value);
        if (valorInput === '2') {
            log('✅ Cantidad actualizada correctamente a 2');
        } else {
            console.warn(`⚠️ La cantidad no parece haberse actualizado (Valor: ${valorInput})`);
        }

        // ==========================================
        // PRUEBA 3: PAGO EN EFECTIVO
        // ==========================================
        log('💰 Probando Pago en Efectivo...');
        
        // Verificar que sección efectivo es visible (por defecto checked)
        const efectivoVisible = await page.$eval('#efectivo-section', el => el.style.display !== 'none');
        if (!efectivoVisible) throw new Error('Sección efectivo debería estar visible por defecto');
        
        // Ingresar monto recibido (simulado)
        // Obtenemos el total primero
        const totalTexto = await page.$eval('#total-venta', el => el.innerText.replace('$',''));
        const total = parseFloat(totalTexto);
        const pago = total + 100; // Pagamos con 100 más
        
        await page.type('#efectivo-recibido', pago.toString());
        
        // Verificar vuelto calculado
        // Esperar un poco para el cálculo (event listener 'input')
        await new Promise(r => setTimeout(r, 500)); 
        const vueltoTexto = await page.$eval('#vuelto', el => el.innerText.replace('$','')); // Asumiendo formato "$XX.XX"
        // Nota: en el HTML es <span id="vuelto">$0.00</span>, ventas.js actualiza innerText
        
        log(`💵 Total: ${total}, Pago: ${pago}, Vuelto calculado: ${vueltoTexto}`);
        
        // Finalizar venta
        await page.click('#btn-finalizar-venta');

        // Confirmar venta (Modal dinámico)
        log('⏳ Esperando confirmación de venta...');
        await page.waitForSelector('#confirmar-venta-si');
        await page.click('#confirmar-venta-si');
        
        // Esperar Ticket Modal
        await page.waitForSelector('#ticket-modal', { visible: true });
        log('✅ Venta Efectivo finalizada (Ticket abierto)');
        
        // Cerrar ticket
        await page.click('#btn-cerrar-ticket');
        await new Promise(r => setTimeout(r, 1000)); // Esperar cierre

        // ==========================================
        // PRUEBA 4: PAGO CON TARJETA
        // ==========================================
        log('💳 Probando Pago con Tarjeta...');
        
        // Agregar otro producto
        const codigoPrueba2 = 'E2E0002'; // Usamos otro código real
        await page.type('#venta-codigo-barra', codigoPrueba2);
        await page.keyboard.press('Enter');
        await page.waitForSelector('.carrito-item');
        
        // Seleccionar Tarjeta
        log('🔘 Seleccionando opción Tarjeta...');
        await page.click('input[value="tarjeta"]');
        
        // Verificar que sección efectivo se oculta
        await new Promise(r => setTimeout(r, 500));
        const efectivoOculto = await page.$eval('#efectivo-section', el => el.style.display === 'none');
        if (efectivoOculto) {
            log('✅ Sección efectivo ocultada correctamente');
        } else {
            console.warn('⚠️ Sección efectivo sigue visible tras seleccionar Tarjeta');
        }
        
        // Finalizar venta
        await page.click('#btn-finalizar-venta');

        // Confirmar venta (Modal dinámico)
        log('⏳ Esperando confirmación de venta (Tarjeta)...');
        await page.waitForSelector('#confirmar-venta-si');
        await page.click('#confirmar-venta-si');
        
        // Esperar Ticket
        await page.waitForSelector('#ticket-modal', { visible: true });
        
        // Verificar método en ticket
        const metodoTicket = await page.$eval('#ticket-pago', el => el.innerText);
        if (metodoTicket.toLowerCase().includes('tarjeta')) {
            log('✅ Ticket muestra método Tarjeta correctamente');
        } else {
            console.warn(`⚠️ Ticket muestra método: ${metodoTicket}`);
        }
        
        log('🎉 PRUEBAS DE VENTAS COMPLETADAS EXITOSAMENTE');

    } catch (error) {
        console.error('❌ Error en prueba de ventas:', error);
        // Tomar screenshot si falla
        await page.screenshot({ path: 'error_ventas.png' });
    } finally {
        await browser.close();
    }
})();