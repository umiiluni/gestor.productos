// IMPORTACION.JS - Módulo de importación masiva

document.addEventListener('DOMContentLoaded', function() {
    inicializarModuloImportacion();
});

let archivosProcesados = [];
let productosImportar = [];
let importacionActiva = false;

function inicializarModuloImportacion() {
    console.log('Módulo de importación inicializado');
    
    // Inicializar componentes
    inicializarTabs();
    inicializarSubidaArchivos();
    inicializarEventos();
    cargarHistorial();
    
    // Configurar Dropzone para CSV
    inicializarDropzone();
}

// ==================== TABS ====================
function inicializarTabs() {
    const tabs = document.querySelectorAll('.import-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Desactivar todas las tabs
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Activar tab clickeada
            this.classList.add('active');
            const tabId = this.dataset.tab;
            document.getElementById(`tab-${tabId}`).classList.add('active');
            
            // Limpiar previsualización
            limpiarPrevisualizacion();
        });
    });
}

// ==================== SUBIDA DE ARCHIVOS ====================
function inicializarSubidaArchivos() {
    // CSV/Excel
    document.getElementById('browse-csv').addEventListener('click', () => {
        document.getElementById('file-csv').click();
    });
    
    document.getElementById('file-csv').addEventListener('change', function(e) {
        manejarArchivoCSV(e.target.files[0]);
    });
    
    // PDF
    document.getElementById('browse-pdf').addEventListener('click', () => {
        document.getElementById('file-pdf').click();
    });
    
    document.getElementById('file-pdf').addEventListener('change', function(e) {
        manejarArchivoPDF(e.target.files[0]);
    });
    
    // OCR
    document.getElementById('browse-ocr').addEventListener('click', () => {
        document.getElementById('file-ocr').click();
    });
    
    document.getElementById('file-ocr').addEventListener('change', function(e) {
        manejarArchivoOCR(Array.from(e.target.files));
    });
    
    // Drag and drop
    configurarDragAndDrop();
}

function inicializarDropzone() {
    // Configurar áreas de drop
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
        
        area.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                switch(tipo) {
                    case 'csv':
                        manejarArchivoCSV(files[0]);
                        break;
                    case 'pdf':
                        manejarArchivoPDF(files[0]);
                        break;
                    case 'ocr':
                        manejarArchivoOCR(Array.from(files));
                        break;
                }
            }
        });
    });
}

function configurarDragAndDrop() {
    // Configuración adicional para mejor UX
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

// ==================== MANEJO DE ARCHIVOS ====================
async function manejarArchivoCSV(archivo) {
    if (!archivo) return;
    
    mostrarProgreso('Leyendo archivo CSV...', 10);
    
    try {
        const extension = archivo.name.split('.').pop().toLowerCase();
        
        if (extension === 'csv') {
            await procesarCSV(archivo);
        } else if (['xlsx', 'xls'].includes(extension)) {
            await procesarExcel(archivo);
        } else {
            throw new Error('Formato no soportado');
        }
        
        actualizarInfoArchivo('csv', archivo.name);
    } catch (error) {
        SistemaBazar.mostrarMensaje('error', `Error procesando CSV: ${error.message}`);
    } finally {
        ocultarProgreso();
    }
}

async function manejarArchivoPDF(archivo) {
    if (!archivo || archivo.type !== 'application/pdf') {
        SistemaBazar.mostrarMensaje('error', 'Solo se permiten archivos PDF');
        return;
    }
    
    mostrarProgreso('Extrayendo texto del PDF...', 20);
    
    try {
        await procesarPDF(archivo);
        actualizarInfoArchivo('pdf', archivo.name);
    } catch (error) {
        SistemaBazar.mostrarMensaje('error', `Error procesando PDF: ${error.message}`);
    } finally {
        ocultarProgreso();
    }
}

async function manejarArchivoOCR(archivos) {
    if (!archivos || archivos.length === 0) return;
    
    mostrarProgreso('Iniciando reconocimiento OCR...', 5);
    
    try {
        await procesarOCR(archivos);
        actualizarInfoArchivo('ocr', `${archivos.length} archivo(s)`);
    } catch (error) {
        SistemaBazar.mostrarMensaje('error', `Error en OCR: ${error.message}`);
    } finally {
        ocultarProgreso();
    }
}

function actualizarInfoArchivo(tipo, nombre) {
    const elemento = document.getElementById(`file-info-${tipo}`);
    if (elemento) {
        elemento.textContent = nombre;
        elemento.style.color = '#2ecc71';
    }
}

// ==================== PROCESAMIENTO CSV/EXCEL ====================
async function procesarCSV(archivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const contenido = e.target.result;
                const separador = document.getElementById('csv-separator').value;
                const tieneEncabezados = document.getElementById('csv-headers').checked;
                
                // Parsear CSV
                const lineas = contenido.split('\n');
                let datos = [];
                
                const inicio = tieneEncabezados ? 1 : 0;
                for (let i = inicio; i < lineas.length; i++) {
                    if (lineas[i].trim() === '') continue;
                    
                    const columnas = lineas[i].split(separador).map(col => col.trim().replace(/"/g, ''));
                    
                    if (columnas.length >= 3) { // Mínimo: código, nombre, precio
                        datos.push({
                            codigo: columnas[0] || generarCodigoAutomatico(),
                            nombre: columnas[1] || 'Sin nombre',
                            categoria: columnas[2] || 'General',
                            precio: parseFloat(columnas[3]) || 0,
                            stock: parseInt(columnas[4]) || 0,
                            stockMinimo: parseInt(columnas[5]) || 5
                        });
                    }
                }
                
                productosImportar = datos;
                actualizarPrevisualizacion();
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = reject;
        reader.readAsText(archivo);
    });
}

async function procesarExcel(archivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Tomar la primera hoja
                const primeraHoja = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[primeraHoja];
                
                // Convertir a JSON
                const datos = XLSX.utils.sheet_to_json(worksheet);
                
                productosImportar = datos.map(item => ({
                    codigo: item.codigo || item.CODIGO || item.Código || generarCodigoAutomatico(),
                    nombre: item.nombre || item.NOMBRE || item.Nombre || item.descripcion || 'Sin nombre',
                    categoria: item.categoria || item.CATEGORIA || item.Categoría || 'General',
                    precio: parseFloat(item.precio || item.PRECIO || item.Precio || 0),
                    stock: parseInt(item.stock || item.STOCK || item.Stock || 0),
                    stockMinimo: parseInt(item.stockMinimo || item['STOCK_MIN'] || 5)
                }));
                
                actualizarPrevisualizacion();
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = reject;
        reader.readAsArrayBuffer(archivo);
    });
}

// ==================== PROCESAMIENTO PDF ====================
async function procesarPDF(archivo) {
    return new Promise(async (resolve, reject) => {
        try {
            const arrayBuffer = await archivo.arrayBuffer();
            
            // Cargar PDF con pdf.js
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            let textoCompleto = '';
            
            // Extraer texto de cada página
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                textoCompleto += pageText + '\n';
            }
            
            // Procesar texto para encontrar productos
            productosImportar = extraerProductosDeTexto(textoCompleto);
            actualizarPrevisualizacion();
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

function extraerProductosDeTexto(texto) {
    const productos = [];
    const lineas = texto.split('\n');
    
    // Buscar patrones comunes en listas de precios
    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        
        // Patrón: código, nombre, precio
        const patronCodigo = /(\d{8,14})/g;
        const patronPrecio = /(\d+[\.,]\d{2})/g;
        
        const codigoMatch = linea.match(patronCodigo);
        const precioMatch = linea.match(patronPrecio);
        
        if (codigoMatch && precioMatch && linea.length > 10) {
            const codigo = codigoMatch[0];
            const precio = parseFloat(precioMatch[0].replace(',', '.'));
            
            // Extraer nombre (entre código y precio)
            const inicioNombre = linea.indexOf(codigo) + codigo.length;
            const finNombre = linea.indexOf(precioMatch[0]);
            let nombre = linea.substring(inicioNombre, finNombre).trim();
            
            if (nombre.length > 100) nombre = nombre.substring(0, 100) + '...';
            
            productos.push({
                codigo: codigo,
                nombre: nombre || 'Producto sin nombre',
                categoria: 'Importado',
                precio: precio,
                stock: 0,
                stockMinimo: 1
            });
        }
    }
    
    return productos;
}

// ==================== PROCESAMIENTO OCR ====================
async function procesarOCR(archivos) {
    mostrarProgreso('Procesando OCR...', 0);
    
    try {
        const tesseract = Tesseract.create({
            workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@4.0.2/dist/worker.min.js',
            langPath: 'https://tessdata.projectnaptha.com/4.0.0',
            corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@4.0.2/tesseract-core.wasm.js',
        });
        
        let textoCompleto = '';
        
        for (let i = 0; i < archivos.length; i++) {
            const archivo = archivos[i];
            
            actualizarProgreso(`Procesando archivo ${i + 1}/${archivos.length}...`, 
                Math.floor((i / archivos.length) * 100));
            
            const resultado = await tesseract.recognize(archivo, 'spa', {
                logger: m => console.log(m)
            });
            
            textoCompleto += resultado.data.text + '\n';
        }
        
        productosImportar = extraerProductosDeTexto(textoCompleto);
        actualizarPrevisualizacion();
    } catch (error) {
        throw error;
    }
}

// ==================== PREVISUALIZACIÓN ====================
function actualizarPrevisualizacion() {
    const tabla = document.getElementById('preview-table');
    if (!tabla) return;
    
    const tbody = tabla.querySelector('tbody');
    tbody.innerHTML = '';
    
    // Obtener productos existentes para comparar
    const productosExistentes = JSON.parse(localStorage.getItem('productos') || '[]');
    
    let nuevos = 0;
    let actualizaciones = 0;
    
    productosImportar.forEach((producto, index) => {
        // Verificar si ya existe
        const existe = productosExistentes.find(p => p.codigo === producto.codigo);
        const estado = existe ? 'update' : 'new';
        
        if (estado === 'new') nuevos++;
        else actualizaciones++;
        
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>
                <span class="status-badge status-${estado}">
                    ${estado === 'new' ? 'Nuevo' : 'Actualizar'}
                </span>
            </td>
            <td><strong>${producto.codigo || 'SIN CÓDIGO'}</strong></td>
            <td>${producto.nombre}</td>
            <td>${producto.categoria}</td>
            <td>$${producto.precio.toFixed(2)}</td>
            <td>${producto.stock}</td>
            <td>
                <button class="btn-accion editar" data-index="${index}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-accion eliminar" data-index="${index}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(fila);
    });
    
    // Actualizar contadores
    document.getElementById('preview-count').textContent = `${productosImportar.length} productos detectados`;
    document.getElementById('preview-new').textContent = `${nuevos} nuevos`;
    document.getElementById('preview-update').textContent = `${actualizaciones} actualizaciones`;
}

function limpiarPrevisualizacion() {
    productosImportar = [];
    const tbody = document.querySelector('#preview-table tbody');
    if (tbody) tbody.innerHTML = '';
    
    document.getElementById('preview-count').textContent = '0 productos detectados';
    document.getElementById('preview-new').textContent = '0 nuevos';
    document.getElementById('preview-update').textContent = '0 actualizaciones';
}

// ==================== IMPORTACIÓN ====================
async function ejecutarImportacion() {
    if (productosImportar.length === 0) {
        SistemaBazar.mostrarMensaje('error', 'No hay productos para importar');
        return;
    }
    
    const confirmar = await mostrarConfirmacionImportacion();
    if (!confirmar) return;
    
    importacionActiva = true;
    mostrarModalProgreso();
    
    try {
        const productosExistentes = JSON.parse(localStorage.getItem('productos') || '[]');
        const actualizarExistentes = document.getElementById('csv-update').checked;
        
        let nuevos = 0;
        let actualizados = 0;
        let errores = 0;
        
        for (let i = 0; i < productosImportar.length; i++) {
            if (!importacionActiva) break;
            
            const producto = productosImportar[i];
            
            // Actualizar progreso
            actualizarProgreso(`Importando: ${producto.nombre}`, 
                Math.floor((i / productosImportar.length) * 100));
            
            try {
                // Validar producto
                if (!producto.nombre || producto.precio <= 0) {
                    errores++;
                    continue;
                }
                
                // Generar código si no tiene
                if (!producto.codigo || producto.codigo === 'SIN CÓDIGO') {
                    producto.codigo = generarCodigoAutomatico();
                }
                
                // Verificar si ya existe
                const indexExistente = productosExistentes.findIndex(p => p.codigo === producto.codigo);
                
                if (indexExistente !== -1 && actualizarExistentes) {
                    // Actualizar producto existente
                    productosExistentes[indexExistente] = {
                        ...productosExistentes[indexExistente],
                        nombre: producto.nombre,
                        precio: producto.precio,
                        categoria: producto.categoria || productosExistentes[indexExistente].categoria,
                        stock: (productosExistentes[indexExistente].stock || 0) + (producto.stock || 0)
                    };
                    actualizados++;
                } else if (indexExistente === -1) {
                    // Crear nuevo producto
                    const nuevoId = obtenerNuevoIdProducto();
                    productosExistentes.push({
                        id: nuevoId,
                        codigo: producto.codigo,
                        nombre: producto.nombre,
                        categoria: producto.categoria || 'General',
                        precio: producto.precio,
                        costo: producto.precio * 0.7, // Estimar costo
                        stock: producto.stock || 0,
                        stockMinimo: producto.stockMinimo || 5,
                        fechaCreacion: new Date().toISOString()
                    });
                    nuevos++;
                }
                
            } catch (error) {
                console.error('Error importando producto:', error);
                errores++;
            }
        }
        
        // Guardar en localStorage
        localStorage.setItem('productos', JSON.stringify(productosExistentes));
        
        // Actualizar contador
        const contadorActual = parseInt(localStorage.getItem('contador_productos') || '0');
        localStorage.setItem('contador_productos', (contadorActual + nuevos).toString());
        
        // Guardar en historial
        guardarEnHistorial({
            fecha: new Date().toISOString(),
            tipo: 'importacion',
            archivo: 'importacion_masiva.csv',
            nuevos: nuevos,
            actualizados: actualizados,
            errores: errores,
            total: productosImportar.length
        });
        
        // Mostrar resultados
        mostrarResultadosImportacion(nuevos, actualizados, errores);
        
        // Actualizar otros módulos
        if (typeof window.ProductosAPI?.cargarProductos === 'function') {
            window.ProductosAPI.cargarProductos();
        }
        
        if (typeof SistemaBazar?.cargarEstadisticasDashboard === 'function') {
            SistemaBazar.cargarEstadisticasDashboard();
        }
        
    } catch (error) {
        SistemaBazar.mostrarMensaje('error', `Error en importación: ${error.message}`);
    } finally {
        importacionActiva = false;
        ocultarModalProgreso();
    }
}

// ==================== UTILIDADES ====================
function generarCodigoAutomatico() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INT-${timestamp}${random}`;
}

function obtenerNuevoIdProducto() {
    const contador = parseInt(localStorage.getItem('contador_productos') || '0');
    const nuevoId = contador + 1;
    localStorage.setItem('contador_productos', nuevoId.toString());
    return nuevoId;
}

// ==================== HISTORIAL ====================
function cargarHistorial() {
    const historial = JSON.parse(localStorage.getItem('historial_importaciones') || '[]');
    const tabla = document.getElementById('history-table');
    
    if (!tabla) return;
    
    const tbody = tabla.querySelector('tbody');
    tbody.innerHTML = '';
    
    historial.reverse().forEach(item => {
        const fecha = new Date(item.fecha);
        const fechaStr = fecha.toLocaleDateString('es-AR');
        const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${fechaStr}<br>${horaStr}</td>
            <td>${item.archivo}</td>
            <td><span class="badge-categoria">${item.tipo}</span></td>
            <td>${item.total} productos</td>
            <td>
                <span class="status-badge ${item.errores === 0 ? 'status-new' : 'status-update'}">
                    ${item.nuevos}N / ${item.actualizados}A
                </span>
            </td>
            <td>
                <button class="btn-accion info" title="Ver detalles">
                    <i class="fas fa-info-circle"></i>
                </button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

function guardarEnHistorial(datos) {
    const historial = JSON.parse(localStorage.getItem('historial_importaciones') || '[]');
    historial.push(datos);
    localStorage.setItem('historial_importaciones', JSON.stringify(historial));
    cargarHistorial();
}

// ==================== MODALES Y UI ====================
function mostrarConfirmacionImportacion() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <i class="fas fa-file-import fa-3x" style="color: #3498db;"></i>
                    <h3 style="margin: 15px 0;">Confirmar Importación</h3>
                    <p>Se importarán ${productosImportar.length} productos</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p>Productos nuevos: <strong id="confirm-new">0</strong></p>
                        <p>Productos actualizados: <strong id="confirm-update">0</strong></p>
                    </div>
                </div>
                <div style="display: flex; gap: 15px;">
                    <button id="confirm-import" class="btn-success" style="flex: 1;">
                        <i class="fas fa-check"></i> Confirmar
                    </button>
                    <button id="cancel-import" class="btn-secondary" style="flex: 1;">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Calcular estadísticas
        const productosExistentes = JSON.parse(localStorage.getItem('productos') || '[]');
        let nuevos = 0;
        let actualizaciones = 0;
        
        productosImportar.forEach(producto => {
            const existe = productosExistentes.find(p => p.codigo === producto.codigo);
            if (existe) actualizaciones++;
            else nuevos++;
        });
        
        document.getElementById('confirm-new').textContent = nuevos;
        document.getElementById('confirm-update').textContent = actualizaciones;
        
        document.getElementById('confirm-import').addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });
        
        document.getElementById('cancel-import').addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        });
    });
}

function mostrarModalProgreso() {
    document.getElementById('progress-modal').style.display = 'flex';
}

function ocultarModalProgreso() {
    document.getElementById('progress-modal').style.display = 'none';
}

function mostrarProgreso(mensaje, porcentaje) {
    const modal = document.getElementById('progress-modal');
    if (modal.style.display !== 'flex') {
        modal.style.display = 'flex';
    }
    
    document.getElementById('progress-message').textContent = mensaje;
    document.getElementById('progress-bar').style.width = `${porcentaje}%`;
}

function actualizarProgreso(mensaje, porcentaje) {
    document.getElementById('progress-message').textContent = mensaje;
    document.getElementById('progress-bar').style.width = `${porcentaje}%`;
    document.getElementById('progress-current').textContent = Math.floor((porcentaje / 100) * productosImportar.length);
    document.getElementById('progress-total').textContent = productosImportar.length;
}

function ocultarProgreso() {
    setTimeout(() => {
        document.getElementById('progress-modal').style.display = 'none';
    }, 500);
}

function mostrarResultadosImportacion(nuevos, actualizados, errores) {
    document.getElementById('result-new').textContent = nuevos;
    document.getElementById('result-updated').textContent = actualizados;
    document.getElementById('result-errors').textContent = errores;
    
    document.getElementById('results-modal').style.display = 'flex';
}

// ==================== EVENTOS ====================
function inicializarEventos() {
    // Descargar plantilla
    document.getElementById('descargar-plantilla')?.addEventListener('click', descargarPlantilla);
    
    // Botón importar
    document.getElementById('btn-import')?.addEventListener('click', ejecutarImportacion);
    
    // Botón limpiar
    document.getElementById('btn-clear')?.addEventListener('click', limpiarTodo);
    
    // Botón test
    document.getElementById('btn-test')?.addEventListener('click', testImportacion);
    
    // Botón cancelar importación
    document.getElementById('btn-cancel-import')?.addEventListener('click', () => {
        importacionActiva = false;
        ocultarModalProgreso();
    });
    
    // Botones resultados
    document.getElementById('btn-view-products')?.addEventListener('click', () => {
        window.location.href = 'productos.html';
    });
    
    document.getElementById('btn-close-results')?.addEventListener('click', () => {
        document.getElementById('results-modal').style.display = 'none';
    });
    
    // Botón actualizar previsualización
    document.getElementById('btn-refresh-preview')?.addEventListener('click', () => {
        if (productosImportar.length > 0) {
            actualizarPrevisualizacion();
        }
    });
    
    // Delegación de eventos en tabla de previsualización
    document.addEventListener('click', function(e) {
        // Editar producto en previsualización
        if (e.target.closest('.btn-accion.editar')) {
            const boton = e.target.closest('.btn-accion.editar');
            const index = parseInt(boton.dataset.index);
            editarProductoPrevisualizacion(index);
        }
        
        // Eliminar producto en previsualización
        if (e.target.closest('.btn-accion.eliminar')) {
            const boton = e.target.closest('.btn-accion.eliminar');
            const index = parseInt(boton.dataset.index);
            eliminarProductoPrevisualizacion(index);
        }
    });
    
    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

function descargarPlantilla(e) {
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

function limpiarTodo() {
    if (productosImportar.length === 0) return;
    
    const confirmar = confirm('¿Limpiar todos los productos cargados?');
    if (confirmar) {
        productosImportar = [];
        limpiarPrevisualizacion();
        
        // Limpiar campos de archivos
        ['csv', 'pdf', 'ocr'].forEach(tipo => {
            document.getElementById(`file-${tipo}`).value = '';
            document.getElementById(`file-info-${tipo}`).textContent = 'No hay archivo seleccionado';
            document.getElementById(`file-info-${tipo}`).style.color = '';
        });
        
        SistemaBazar.mostrarMensaje('exito', 'Todo ha sido limpiado');
    }
}

function testImportacion() {
    // Cargar datos de prueba
    productosImportar = [
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
    
    actualizarPrevisualizacion();
    SistemaBazar.mostrarMensaje('info', 'Datos de prueba cargados. Revisa la previsualización.');
}

function editarProductoPrevisualizacion(index) {
    const producto = productosImportar[index];
    if (!producto) return;
    
    const nuevoNombre = prompt('Nuevo nombre:', producto.nombre);
    if (nuevoNombre !== null) {
        producto.nombre = nuevoNombre;
    }
    
    const nuevoPrecio = prompt('Nuevo precio:', producto.precio);
    if (nuevoPrecio !== null && !isNaN(parseFloat(nuevoPrecio))) {
        producto.precio = parseFloat(nuevoPrecio);
    }
    
    actualizarPrevisualizacion();
}

function eliminarProductoPrevisualizacion(index) {
    const confirmar = confirm('¿Eliminar este producto de la importación?');
    if (confirmar) {
        productosImportar.splice(index, 1);
        actualizarPrevisualizacion();
        SistemaBazar.mostrarMensaje('exito', 'Producto eliminado de la importación');
    }
}

// ==================== INICIALIZACIÓN ====================
// Exportar funciones globales si es necesario
window.ImportacionAPI = {
    ejecutarImportacion,
    limpiarTodo,
    testImportacion,
    generarCodigoAutomatico
};

console.log('Módulo de importación cargado correctamente');