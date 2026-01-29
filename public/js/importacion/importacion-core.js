// IMPORTACION-CORE.JS - Núcleo del sistema de importación

let archivosProcesados = [];
let productosImportar = [];
let importacionActiva = false;

// Variables globales del sistema
window.ImportacionCore = {
    archivosProcesados,
    productosImportar,
    importacionActiva,
    
    // Funciones compartidas
    generarCodigoAutomatico: function() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `INT-${timestamp}${random}`;
    },
    
    obtenerNuevoIdProducto: function() {
        const contador = parseInt(localStorage.getItem('contador_productos') || '0');
        const nuevoId = contador + 1;
        localStorage.setItem('contador_productos', nuevoId.toString());
        return nuevoId;
    },
    
    actualizarInfoArchivo: function(tipo, nombre) {
        const elemento = document.getElementById(`file-info-${tipo}`);
        if (elemento) {
            elemento.textContent = nombre;
            elemento.style.color = '#2ecc71';
        }
    },
    
    mostrarProgreso: function(mensaje, porcentaje) {
        const modal = document.getElementById('progress-modal');
        if (modal.style.display !== 'flex') {
            modal.style.display = 'flex';
        }
        
        document.getElementById('progress-message').textContent = mensaje;
        document.getElementById('progress-bar').style.width = `${porcentaje}%`;
    },
    
    actualizarProgreso: function(mensaje, porcentaje, totalProductos) {
        document.getElementById('progress-message').textContent = mensaje;
        document.getElementById('progress-bar').style.width = `${porcentaje}%`;
        document.getElementById('progress-current').textContent = Math.floor((porcentaje / 100) * totalProductos);
        document.getElementById('progress-total').textContent = totalProductos;
    },
    
    ocultarProgreso: function() {
        setTimeout(() => {
            document.getElementById('progress-modal').style.display = 'none';
        }, 500);
    },
    
    mostrarResultados: function(nuevos, actualizados, errores) {
        document.getElementById('result-new').textContent = nuevos;
        document.getElementById('result-updated').textContent = actualizados;
        document.getElementById('result-errors').textContent = errores;
        document.getElementById('results-modal').style.display = 'flex';
    }
};