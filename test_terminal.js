const fs = require('fs');
const path = require('path');

// Colores para la terminal
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    bold: "\x1b[1m"
};

const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
};

function log(message, type = 'info') {
    const color = colors[type === 'success' ? 'green' : type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'];
    console.log(`${color}${icons[type]} ${message}${colors.reset}`);
}

function header(text) {
    console.log(`\n${colors.cyan}${colors.bold}=== ${text} ===${colors.reset}`);
}

async function testBackend() {
    try {
        const response = await fetch('http://localhost:8000/api/health');
        if (response.ok) {
            log('Backend conectado correctamente', 'success');
            return true;
        } else {
            log(`Backend error: ${response.status}`, 'error');
            return false;
        }
    } catch (error) {
        log(`No se puede conectar al backend: ${error.message}`, 'error');
        // Sugerencia de solución
        console.log(`${colors.yellow}  -> Solución: Ejecuta el archivo 'start_backend.bat' o abre una nueva terminal y corre:${colors.reset}`);
        console.log(`${colors.cyan}     start_backend.bat${colors.reset}`);
        return false;
    }
}

async function testProductos() {
    try {
        const response = await fetch('http://localhost:8000/api/products/');
        if (response.ok) {
            const productos = await response.json();
            log(`${productos.length} productos encontrados en API`, 'success');
            return productos;
        } else {
            log('Error obteniendo productos', 'error');
            return [];
        }
    } catch (error) {
        log(`Error productos: ${error.message}`, 'error');
        return [];
    }
}

async function testArchivos() {
    const baseDir = __dirname;
    const archivos = [
        'public/index.html',
        'public/productos.html',
        'public/css/estilos.css',
        'public/js/main.js',
        'public/js/productos.js',
        'public/data/productos.json'
    ];
    
    let ok = 0;
    
    for (const archivo of archivos) {
        const fullPath = path.join(baseDir, archivo);
        if (fs.existsSync(fullPath)) {
            log(`${archivo}: OK`, 'success');
            ok++;
        } else {
            log(`${archivo}: No encontrado`, 'error');
        }
    }
    
    return { total: archivos.length, ok };
}

async function testCORS() {
    try {
        const response = await fetch('http://localhost:8000/api/health', {
            headers: { 'Origin': 'http://localhost:5500' }
        });
        const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
        if (allowOrigin) {
            log('CORS: Configurado correctamente', 'success');
            return true;
        } else {
            log('CORS: Header Access-Control-Allow-Origin faltante', 'warning');
            return false;
        }
    } catch (error) {
        log(`CORS Error: ${error.message}`, 'error');
        return false;
    }
}

async function testScraping() {
    try {
        const response = await fetch('http://localhost:8000/api/products/update-scraping', {
            method: 'POST'
        });
        if (response.ok) {
            log('Scraping Trigger: Endpoint disponible', 'success');
            return true;
        } else {
            log(`Scraping Trigger: Error ${response.status}`, 'warning');
            return false;
        }
    } catch (error) {
        log(`Scraping Error: ${error.message}`, 'warning');
        return false;
    }
}

async function ejecutarTestRapido() {
    header('EJECUTANDO TEST RÁPIDO (TERMINAL)');
    
    console.log('1. Verificando Backend...');
    const backendOk = await testBackend();
    
    if (backendOk) {
        await testCORS();
        await testScraping();
    }
    
    console.log('\n2. Verificando Datos...');
    await testProductos();
    
    console.log('\n3. Verificando Archivos del Proyecto...');
    const archivos = await testArchivos();
    
    header('RESUMEN');
    if (backendOk && archivos.ok === archivos.total) {
        console.log(`${colors.green}${colors.bold}✅ TODOS LOS SISTEMAS FUNCIONANDO CORRECTAMENTE${colors.reset}`);
    } else {
        console.log(`${colors.red}${colors.bold}❌ SE DETECTARON PROBLEMAS${colors.reset}`);
    }
}

ejecutarTestRapido();
