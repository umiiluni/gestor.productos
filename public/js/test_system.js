// ============ INTERFAZ GRÁFICA DE TESTING DESDE CONSOLA ============

// Crear interfaz visual directamente en la página
function crearInterfazTesting() {
    // Eliminar si ya existe
    const existente = document.getElementById('testing-interface');
    if (existente) existente.remove();

    // Crear contenedor principal
    const container = document.createElement('div');
    container.id = 'testing-interface';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        background: #1a1a2e;
        color: white;
        border: 2px solid #00b4db;
        border-radius: 10px;
        z-index: 9999;
        font-family: Arial, sans-serif;
        box-shadow: 0 0 20px rgba(0, 180, 219, 0.5);
        overflow: hidden;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
        background: linear-gradient(90deg, #00b4db, #0083b0);
        padding: 15px;
        font-weight: bold;
        font-size: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = `
        <span>🔧 TESTING SISTEMA</span>
        <button id="close-testing" style="background: #ff4757; border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">X</button>
    `;

    // Panel de resultados
    const resultsPanel = document.createElement('div');
    resultsPanel.id = 'test-results';
    resultsPanel.style.cssText = `
        max-height: 300px;
        overflow-y: auto;
        padding: 10px;
        background: #16213e;
    `;

    // Controles
    const controls = document.createElement('div');
    controls.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        padding: 15px;
        background: #0f3460;
    `;

    // Botones
    const botones = [
        { id: 'btn-quick', text: '🚀 Test Rápido', color: '#2ecc71' },
        { id: 'btn-full', text: '📋 Test Completo', color: '#3498db' },
        { id: 'btn-download', text: '📥 Descargar Reporte', color: '#9b59b6' },
        { id: 'btn-clear', text: '🗑️ Limpiar', color: '#e74c3c' }
    ];

    botones.forEach(btn => {
        const button = document.createElement('button');
        button.id = btn.id;
        button.textContent = btn.text;
        button.style.cssText = `
            padding: 10px;
            background: ${btn.color};
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
        `;
        controls.appendChild(button);
    });

    // Panel de problemas
    const problemsPanel = document.createElement('div');
    problemsPanel.id = 'test-problems';
    problemsPanel.style.cssText = `
        display: none;
        padding: 15px;
        background: #2c3e50;
        border-top: 1px solid #34495e;
    `;

    // Ensamblar
    container.appendChild(header);
    container.appendChild(resultsPanel);
    container.appendChild(controls);
    container.appendChild(problemsPanel);

    // Agregar a la página
    document.body.appendChild(container);

    // Eventos
    document.getElementById('close-testing').onclick = () => container.remove();
    document.getElementById('btn-quick').onclick = ejecutarTestRapido;
    document.getElementById('btn-full').onclick = ejecutarTestCompleto;
    document.getElementById('btn-download').onclick = descargarReporteCompleto;
    document.getElementById('btn-clear').onclick = limpiarResultados;

    // Mostrar mensaje inicial
    agregarResultado('✅ Interfaz de testing cargada', 'success');
}

// ============ FUNCIONES DE RESULTADOS VISUALES ============

function agregarResultado(mensaje, tipo = 'info') {
    const panel = document.getElementById('test-results');
    const resultado = document.createElement('div');

    const colores = {
        success: '#2ecc71',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };

    resultado.style.cssText = `
        padding: 8px 10px;
        margin: 5px 0;
        background: rgba(255,255,255,0.05);
        border-left: 4px solid ${colores[tipo]};
        border-radius: 3px;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    const iconos = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };

    resultado.innerHTML = `
        <span style="color: ${colores[tipo]}; font-weight: bold;">${iconos[tipo]}</span>
        <span>${mensaje}</span>
    `;

    panel.appendChild(resultado);
    panel.scrollTop = panel.scrollHeight;
}

function mostrarProblemas(problemas) {
    const panel = document.getElementById('test-problems');
    panel.style.display = 'block';
    panel.innerHTML = `<div style="color: #e74c3c; font-weight: bold; margin-bottom: 10px;">⚠ PROBLEMAS DETECTADOS:</div>`;

    problemas.forEach((p, i) => {
        const problema = document.createElement('div');
        problema.style.cssText = `
            background: rgba(231, 76, 60, 0.1);
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            border-left: 3px solid #e74c3c;
        `;
        problema.innerHTML = `
            <div style="color: #ff5b6b; font-weight: bold;">${i+1}. ${p.problema}</div>
            <div style="color: #a9b7c6; margin: 5px 0;">Solución: ${p.solucion}</div>
        `;
        panel.appendChild(problema);
    });
}

function limpiarResultados() {
    document.getElementById('test-results').innerHTML = '';
    document.getElementById('test-problems').style.display = 'none';
    agregarResultado('Resultados limpiados', 'info');
}

// ============ TESTS REALES ============

async function testBackend() {
    try {
        // Usar puerto 8000 para compatibilidad con el entorno actual
        const baseUrl = typeof API_CONFIG !== 'undefined' ? API_CONFIG.BASE_URL : 'http://localhost:8000';
        const response = await fetch(`${baseUrl}/api/health`);
        if (response.ok) {
            agregarResultado('Backend conectado correctamente', 'success');
            return true;
        } else {
            agregarResultado(`Backend error: ${response.status}`, 'error');
            return false;
        }
    } catch (error) {
        agregarResultado(`No se puede conectar al backend: ${error.message}`, 'error');
        return false;
    }
}

async function testProductos() {
    try {
        const baseUrl = typeof API_CONFIG !== 'undefined' ? API_CONFIG.BASE_URL : 'http://localhost:8000';
        const response = await fetch(`${baseUrl}/api/products/`);
        if (response.ok) {
            const productos = await response.json();
            agregarResultado(`${productos.length} productos encontrados`, 'success');
            return productos;
        } else {
            agregarResultado('Error obteniendo productos', 'error');
            return [];
        }
    } catch (error) {
        agregarResultado(`Error productos: ${error.message}`, 'error');
        return [];
    }
}

async function testFrontendPaginas() {
    const paginas = ['index.html', 'productos.html', 'inventario.html', 'importacion.html', 'ventas.html', 'reportes.html'];
    let ok = 0;

    for (const pagina of paginas) {
        try {
            // Check simple fetch relative to current location
            const response = await fetch(pagina);
            if (response.status === 200 || response.status === 0) { // 0 for local files sometimes
                agregarResultado(`${pagina}: OK`, 'success');
                ok++;
            } else {
                agregarResultado(`${pagina}: Error ${response.status}`, 'error');
            }
        } catch {
            agregarResultado(`${pagina}: No accesible`, 'error');
        }
    }

    return { total: paginas.length, ok };
}

async function testArchivos() {
    const archivos = ['css/estilos.css', 'js/main.js', 'js/productos.js', 'data/productos.json'];
    let ok = 0;

    for (const archivo of archivos) {
        try {
            const response = await fetch(archivo);
            if (response.status === 200 || response.status === 0) ok++;
            agregarResultado(`${archivo}: ${response.status === 200 || response.status === 0 ? 'OK' : 'No encontrado'}`, 
                           response.status === 200 || response.status === 0 ? 'success' : 'warning');
        } catch {
            agregarResultado(`${archivo}: Error`, 'error');
        }
    }

    return { total: archivos.length, ok };
}

// ============ TESTS COMPLETOS ============

async function ejecutarTestRapido() {
    agregarResultado('🚀 EJECUTANDO TEST RÁPIDO...', 'info');

    const resultados = {
        backend: await testBackend(),
        productos: await testProductos(),
        frontend: await testFrontendPaginas(),
        archivos: await testArchivos()
    };

    // Analizar problemas
    const problemas = [];

    if (!resultados.backend) {
        problemas.push({
            problema: "Backend no responde",
            solucion: "Ejecutar: python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"
        });
    }

    if (resultados.frontend.ok < resultados.frontend.total) {
        problemas.push({
            problema: "Páginas del frontend no cargan",
            solucion: "Verificar que los archivos .html existan en la carpeta public"
        });
    }

    if (resultados.archivos.ok < resultados.archivos.total) {
        problemas.push({
            problema: "Archivos estáticos faltantes",
            solucion: "Verificar que existan los archivos en public"
        });
    }

    if (problemas.length > 0) {
        mostrarProblemas(problemas);
    }

    agregarResultado('✅ Test rápido completado', 'success');
}

async function ejecutarTestCompleto() {
    agregarResultado('📋 EJECUTANDO TEST COMPLETO...', 'info');

    // Todos los tests
    await testBackend();
    await testProductos();
    await testFrontendPaginas();
    await testArchivos();

    // Tests adicionales
    try {
        // Test scraping endpoint trigger
        const baseUrl = typeof API_CONFIG !== 'undefined' ? API_CONFIG.BASE_URL : 'http://localhost:8000';
        const scraping = await fetch(`${baseUrl}/api/products/update-scraping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        agregarResultado(`Scraping Trigger: ${scraping.status === 200 ? 'Disponible' : 'Error'}`, 
                       scraping.status === 200 ? 'success' : 'warning');
    } catch {
        agregarResultado('Scraping: No disponible', 'warning');
    }

    try {
        // Test CORS check (simulated via health)
        const baseUrl = typeof API_CONFIG !== 'undefined' ? API_CONFIG.BASE_URL : 'http://localhost:8000';
        const cors = await fetch(`${baseUrl}/api/health`);
        // If we can read this, CORS is likely fine for GET
        agregarResultado('CORS (GET): Funcional', 'success');
    } catch {
        agregarResultado('CORS: Error verificando', 'error');
    }

    agregarResultado('✅ Test completo finalizado', 'success');
}

// ============ REPORTE DESCARGABLE ============

function descargarReporteCompleto() {
    const resultados = document.getElementById('test-results');
    const problemas = document.getElementById('test-problems');

    let reporte = `REPORTE DE TESTING - Sistema Gestor de Productos
Fecha: ${new Date().toLocaleString()}
=============================================\n\n`;

    // Resultados
    reporte += "RESULTADOS:\n";
    reporte += "=============\n";
    resultados.querySelectorAll('div').forEach(div => {
        const texto = div.textContent || div.innerText;
        reporte += `${texto}\n`;
    });

    reporte += "\nPROBLEMAS DETECTADOS:\n";
    reporte += "=====================\n";
    if (problemas.style.display !== 'none') {
        problemas.querySelectorAll('div').forEach(div => {
            const texto = div.textContent || div.innerText;
            reporte += `${texto}\n`;
        });
    } else {
        reporte += "No se detectaron problemas\n";
    }

    reporte += "\nSOLUCIONES RECOMENDADAS:\n";
    reporte += "========================\n";
    reporte += "1. Si backend no responde:\n";
    reporte += "   cd backend\n";
    reporte += "   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000\n\n";

    // Descargar
    const blob = new Blob([reporte], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `testing_reporte_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    agregarResultado('📄 Reporte descargado', 'success');
}

// ============ INICIAR ============

// Crear interfaz automáticamente
crearInterfazTesting();

// También crear comandos de consola
window.ejecutarTestRapido = ejecutarTestRapido;
window.ejecutarTestCompleto = ejecutarTestCompleto;
window.descargarReporteCompleto = descargarReporteCompleto;

console.log('%c✅ Interfaz gráfica de testing cargada!', 'color: #00ff00; font-weight: bold;');
console.log('%cUsá los botones en la ventana flotante o ejecutá desde consola:', 'color: #00ffff;');
console.log('• ejecutarTestRapido()');
console.log('• ejecutarTestCompleto()');
console.log('• descargarReporteCompleto()');
