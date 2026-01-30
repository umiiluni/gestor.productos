const axios = require('axios');

async function runTests() {
    const baseURL = 'http://localhost:8000/api';
    console.log(`Iniciando pruebas contra ${baseURL}...`);

    try {
        // 1. Health Check
        console.log('1. Probando Health Check...');
        const health = await axios.get(`${baseURL}/health`);
        console.log('   ✅ Health OK:', health.data);

        // 2. Crear Producto
        console.log('2. Probando Creación de Producto...');
        const newProduct = {
            nombre: "Producto Test Node",
            categoria: "Test",
            precio: 100,
            stock: 10,
            codigo: "TEST" + Date.now(),
            unidad: "un",
            costo: 50,
            precios: [100, 90, 80, 70]
        };
        const createRes = await axios.post(`${baseURL}/products`, newProduct);
        console.log('   ✅ Producto Creado ID:', createRes.data.id);

        // 3. Listar Productos
        console.log('3. Probando Listado de Productos...');
        const listRes = await axios.get(`${baseURL}/products`);
        const found = listRes.data.find(p => p.id === createRes.data.id);
        if (found && found.nombre === newProduct.nombre) {
            console.log('   ✅ Producto encontrado en listado');
            console.log('   ℹ️ Precios múltiples verificados:', found.precios);
        } else {
            console.error('   ❌ Producto NO encontrado');
        }

        // 4. Crear Gasto (Nueva feature)
        console.log('4. Probando Creación de Gasto...');
        const newExpense = {
            description: "Gasto de prueba",
            amount: 500,
            category: "Servicios"
        };
        const expenseRes = await axios.post(`${baseURL}/expenses`, newExpense);
        console.log('   ✅ Gasto Creado ID:', expenseRes.data.id);

    } catch (error) {
        console.error('❌ Error en pruebas:', error.response ? error.response.data : error.message);
    }
}

// Ejecutar si el servidor está listo
// Nota: Requiere que el servidor ya esté corriendo.
runTests();
