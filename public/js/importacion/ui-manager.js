// UI-MANAGER.JS - Gestión de la interfaz de usuario

class UIManager {
    static inicializarTabs() {
        const tabs = document.querySelectorAll('.import-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                this.classList.add('active');
                const tabId = this.dataset.tab;
                document.getElementById(`tab-${tabId}`).classList.add('active');
                
                PreviewManager.limpiarPrevisualizacion();
            });
        });
    }
    
    static inicializarSubidaArchivos() {
        document.getElementById('browse-csv').addEventListener('click', () => {
            document.getElementById('file-csv').click();
        });
        
        document.getElementById('file-csv').addEventListener('change', async function(e) {
            const archivo = e.target.files[0];
            if (archivo) {
                await CSVProcessor.manejarArchivoCSV(archivo);
                PreviewManager.actualizarPrevisualizacion();
            }
        });
        
        document.getElementById('browse-pdf').addEventListener('click', () => {
            document.getElementById('file-pdf').click();
        });
        
        document.getElementById('file-pdf').addEventListener('change', async function(e) {
            const archivo = e.target.files[0];
            if (archivo) {
                await PDFProcessor.manejarArchivoPDF(archivo);
                PreviewManager.actualizarPrevisualizacion();
            }
        });
        
        document.getElementById('browse-ocr').addEventListener('click', () => {
            document.getElementById('file-ocr').click();
        });
        
        document.getElementById('file-ocr').addEventListener('change', async function(e) {
            const archivos = Array.from(e.target.files);
            if (archivos.length > 0) {
                await OCRProcessor.manejarArchivoOCR(archivos);
                PreviewManager.actualizarPrevisualizacion();
            }
        });

        // Evento para botón API
        const btnApi = document.getElementById('btn-test-api');
        if (btnApi) {
            btnApi.addEventListener('click', async () => {
                await ApiProcessor.manejarImportacionAPI();
                PreviewManager.actualizarPrevisualizacion();
            });
        }
        
        this.configurarDragAndDrop();
    }
    
    static inicializarDropzone() {
        const areas = ['csv', 'pdf', 'ocr'];
        
        areas.forEach(tipo => {
            const area = document.getElementById(`dropzone-${tipo}`);
            
            area.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('drag-over');
            });
            
            area.addEventListener('dragleave', function() {
                this.classList.remove('drag-over');
            });
            
            area.addEventListener('drop', async function(e) {
                e.preventDefault();
                this.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    switch(tipo) {
                        case 'csv':
                            await CSVProcessor.manejarArchivoCSV(files[0]);
                            break;
                        case 'pdf':
                            await PDFProcessor.manejarArchivoPDF(files[0]);
                            break;
                        case 'ocr':
                            await OCRProcessor.manejarArchivoOCR(Array.from(files));
                            break;
                    }
                    PreviewManager.actualizarPrevisualizacion();
                }
            });
        });
    }
    
    static configurarDragAndDrop() {
        document.addEventListener('dragenter', function(e) {
            e.preventDefault();
        });
        
        document.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        
        document.addEventListener('drop', function(e) {
            e.preventDefault();
        });
    }
    
    static inicializarEventos() {
        document.getElementById('descargar-plantilla')?.addEventListener('click', this.descargarPlantilla);
        document.getElementById('btn-import')?.addEventListener('click', () => ImportManager.ejecutarImportacion());
        document.getElementById('btn-clear')?.addEventListener('click', this.limpiarTodo);
        document.getElementById('btn-test')?.addEventListener('click', this.testImportacion);
        document.getElementById('btn-refresh-preview')?.addEventListener('click', () => {
            if (ImportacionCore.productosImportar.length > 0) {
                PreviewManager.actualizarPrevisualizacion();
            }
        });
        
        document.getElementById('btn-cancel-import')?.addEventListener('click', () => {
            ImportacionCore.importacionActiva = false;
            document.getElementById('progress-modal').style.display = 'none';
        });
        
        document.getElementById('btn-view-products')?.addEventListener('click', () => {
            window.location.href = 'productos.html';
        });
        
        document.getElementById('btn-close-results')?.addEventListener('click', () => {
            document.getElementById('results-modal').style.display = 'none';
        });
        
        document.addEventListener('click', function(e) {
            if (e.target.closest('.btn-accion.editar')) {
                const boton = e.target.closest('.btn-accion.editar');
                const index = parseInt(boton.dataset.index);
                PreviewManager.editarProductoPrevisualizacion(index);
            }
            
            if (e.target.closest('.btn-accion.eliminar')) {
                const boton = e.target.closest('.btn-accion.eliminar');
                const index = parseInt(boton.dataset.index);
                PreviewManager.eliminarProductoPrevisualizacion(index);
            }
        });
        
        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }
    
    static descargarPlantilla(e) {
        e.preventDefault();
        
        const plantilla = `codigo,nombre,categoria,precio,stock,stock_minimo
779001,Zapatillas Nike Air Max,Calzado,89990.00,15,5
779002,Remera Adidas Original,Ropa,12500.00,30,10
779003,Gorra Puma Negra,Accesorios,8900.00,25,8
779004,Short Nike Dri-Fit,Ropa,15900.00,20,6
779005,Medias Adidas 3 Pares,Ropa,4500.00,40,15

Instrucciones:
1. Mantén los encabezados en la primera fila
2. El código debe ser único (si existe, actualizará el producto)
3. Usa números decimales con punto (.)
4. Stock y stock_minimo deben ser números enteros`;
        
        const blob = new Blob([plantilla], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'plantilla_importacion_lolashop.csv');
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        SistemaBazar.mostrarMensaje('exito', 'Plantilla descargada');
    }
    
    static limpiarTodo() {
        if (ImportacionCore.productosImportar.length === 0) return;
        
        const confirmar = confirm('¿Limpiar todos los productos cargados?');
        if (confirmar) {
            ImportacionCore.productosImportar = [];
            PreviewManager.limpiarPrevisualizacion();
            
            ['csv', 'pdf', 'ocr'].forEach(tipo => {
                document.getElementById(`file-${tipo}`).value = '';
                document.getElementById(`file-info-${tipo}`).textContent = 'No hay archivo seleccionado';
                document.getElementById(`file-info-${tipo}`).style.color = '';
            });
            
            SistemaBazar.mostrarMensaje('exito', 'Todo ha sido limpiado');
        }
    }
    
    static testImportacion() {
        ImportacionCore.productosImportar = [
            {
                codigo: 'TEST001',
                nombre: 'Producto de Prueba 1',
                categoria: 'Test',
                precio: 1000.00,
                stock: 10,
                stockMinimo: 2
            },
            {
                codigo: 'TEST002',
                nombre: 'Producto de Prueba 2',
                categoria: 'Test',
                precio: 2000.00,
                stock: 5,
                stockMinimo: 1
            }
        ];
        
        PreviewManager.actualizarPrevisualizacion();
        SistemaBazar.mostrarMensaje('info', 'Datos de prueba cargados. Revisa la previsualización.');
    }
}

window.UIManager = UIManager;