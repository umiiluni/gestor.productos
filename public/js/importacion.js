// IMPORTACION.JS - Cargador principal de módulos

document.addEventListener('DOMContentLoaded', function() {
    inicializarModuloImportacion();
});

function inicializarModuloImportacion() {
    console.log('Módulo de importación inicializado');
    
    // Cargar componentes
    UIManager.inicializarTabs();
    UIManager.inicializarSubidaArchivos();
    UIManager.inicializarEventos();
    UIManager.inicializarDropzone();
    HistoryManager.cargarHistorial();
    
    // Exportar API global
    window.ImportacionAPI = {
        ejecutarImportacion: ImportManager.ejecutarImportacion,
        limpiarTodo: UIManager.limpiarTodo,
        testImportacion: UIManager.testImportacion,
        generarCodigoAutomatico: ImportacionCore.generarCodigoAutomatico
    };
    
    console.log('Todos los módulos de importación cargados correctamente');
}