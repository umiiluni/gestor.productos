// SISTEMA BAZAR ARGENTINA - PRODUCTOS.JS
// Gestión de productos

document.addEventListener('DOMContentLoaded', function() {
    inicializarModuloProductos();
});

function inicializarModuloProductos() {
    console.log('Módulo de productos inicializado');
    
    // Cargar lista de productos
    cargarProductos();
    
    // Configurar eventos
    configurarEventosProductos();
    
    // Sincronizar con backend (si está disponible)
    sincronizarConBackend();
    
    // Configurar búsqueda y filtros
    configurarBusquedaYFiltros();
}

async function sincronizarConBackend() {
    try {
        const url = getApiUrl('/api/products/');
        const response = await fetch(url);
        if (response.ok) {
            const backendProducts = await response.json();
            if (Array.isArray(backendProducts) && backendProducts.length > 0) {
                localStorage.setItem('productos', JSON.stringify(backendProducts));
                cargarProductos();
                console.log('Sincronización con backend exitosa');
            }
        }
    } catch (error) {
        console.log('Modo Offline: Backend no detectado');
    }
}

function cargarProductos() {
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    const tabla = document.getElementById('tabla-productos');
    
    if (!tabla) return;
    
    const tbody = tabla.querySelector('tbody');
    tbody.innerHTML = '';
    
    if (productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <i class="fas fa-box-open fa-2x"></i>
                    <p style="margin-top: 15px;">No hay productos registrados</p>
                    <button id="btn-agregar-primer-producto" class="btn-primary" style="margin-top: 15px;">
                        <i class="fas fa-plus"></i> Agregar primer producto
                    </button>
                </td>
            </tr>
        `;
        
        document.getElementById('btn-agregar-primer-producto')?.addEventListener('click', mostrarFormularioProducto);
        return;
    }
    
    // Ordenar por ID descendente (más nuevos primero)
    productos.sort((a, b) => b.id - a.id).forEach(producto => {
        const estado = obtenerEstadoStock(producto);
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${producto.codigo}</strong></td>
            <td>${producto.nombre}</td>
            <td><span class="badge-categoria">${producto.categoria}</span></td>
            <td>$${producto.precio.toFixed(2)}</td>
            <td>
                <span class="stock-badge ${estado.clase}">
                    ${producto.stock} ${estado.stockMinimo ? `(Mín: ${producto.stockMinimo})` : ''}
                </span>
            </td>
            <td>
                <span class="estado-badge estado-${estado.clase}">
                    <i class="fas fa-${estado.icono}"></i> ${estado.texto}
                </span>
            </td>
            <td>
                <div class="acciones-producto">
                    <button class="btn-accion editar" data-id="${producto.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-accion eliminar" data-id="${producto.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-accion info" data-id="${producto.id}" title="Ver Detalles">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(fila);
    });
    
    // Aplicar estilos a badges
    aplicarEstilosBadges();
}

function obtenerEstadoStock(producto) {
    if (producto.stock <= 0) {
        return { 
            texto: 'Sin Stock', 
            clase: 'sin-stock', 
            icono: 'times-circle' 
        };
    } else if (producto.stock <= producto.stockMinimo) {
        return { 
            texto: 'Bajo Stock', 
            clase: 'bajo-stock', 
            icono: 'exclamation-triangle' 
        };
    } else {
        return { 
            texto: 'Disponible', 
            clase: 'disponible', 
            icono: 'check-circle' 
        };
    }
}

function aplicarEstilosBadges() {
    const style = document.createElement('style');
    style.textContent = `
        .badge-categoria {
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        
        .stock-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.85rem;
        }
        
        .stock-badge.disponible {
            background: #d4edda;
            color: #155724;
        }
        
        .stock-badge.bajo-stock {
            background: #fff3cd;
            color: #856404;
        }
        
        .stock-badge.sin-stock {
            background: #f8d7da;
            color: #721c24;
        }
        
        .estado-badge {
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        
        .estado-disponible {
            background: #d1f7c4;
            color: #0d5c0d;
            border: 1px solid #a3e9a4;
        }
        
        .estado-bajo-stock {
            background: #ffeaa7;
            color: #856404;
            border: 1px solid #fdcb6e;
        }
        
        .estado-sin-stock {
            background: #ffccc7;
            color: #a8071a;
            border: 1px solid #ffa39e;
        }
        
        .acciones-producto {
            display: flex;
            gap: 8px;
        }
        
        .btn-accion {
            width: 35px;
            height: 35px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            font-size: 0.9rem;
        }
        
        .btn-accion.editar {
            background: #3498db;
            color: white;
        }
        
        .btn-accion.eliminar {
            background: #e74c3c;
            color: white;
        }
        
        .btn-accion.info {
            background: #2ecc71;
            color: white;
        }
        
        .btn-accion:hover {
            transform: translateY(-2px);
            box-shadow: 0 3px 8px rgba(0,0,0,0.2);
        }
    `;
    document.head.appendChild(style);
}

function configurarEventosProductos() {
    // Botón nuevo producto
    const btnNuevo = document.getElementById('btn-nuevo-producto');
    if (btnNuevo) {
        btnNuevo.addEventListener('click', mostrarFormularioProducto);
    }
    
    // Botón cancelar formulario
    const btnCancelar = document.getElementById('btn-cancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', ocultarFormularioProducto);
    }

    // Botón actualizar proveedores
    const btnActualizar = document.getElementById('btn-actualizar-proveedores');
    if (btnActualizar) {
        btnActualizar.addEventListener('click', actualizarProveedores);
    }
    
    // Formulario producto
    const formProducto = document.getElementById('form-producto-data');
    if (formProducto) {
        formProducto.addEventListener('submit', guardarProducto);
    }
    
    // Delegación de eventos para botones de acciones
    document.addEventListener('click', function(e) {
        // Botones editar
        if (e.target.closest('.btn-accion.editar')) {
            const boton = e.target.closest('.btn-accion.editar');
            const id = parseInt(boton.dataset.id);
            editarProducto(id);
        }
        
        // Botones eliminar
        if (e.target.closest('.btn-accion.eliminar')) {
            const boton = e.target.closest('.btn-accion.eliminar');
            const id = parseInt(boton.dataset.id);
            eliminarProducto(id);
        }
        
        // Botones info
        if (e.target.closest('.btn-accion.info')) {
            const boton = e.target.closest('.btn-accion.info');
            const id = parseInt(boton.dataset.id);
            verDetallesProducto(id);
        }
    });
}

function configurarBusquedaYFiltros() {
    const inputBusqueda = document.getElementById('buscar-producto');
    const selectCategoria = document.getElementById('filtrar-categoria');
    
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', function() {
            filtrarProductos(this.value, selectCategoria?.value || '');
        });
    }
    
    if (selectCategoria) {
        selectCategoria.addEventListener('change', function() {
            filtrarProductos(inputBusqueda?.value || '', this.value);
        });
    }
}

function filtrarProductos(texto, categoria) {
    const filas = document.querySelectorAll('#tabla-productos tbody tr');
    
    filas.forEach(fila => {
        const nombre = fila.cells[1].textContent.toLowerCase();
        const cat = fila.cells[2].textContent;
        const mostrar = 
            (texto === '' || nombre.includes(texto.toLowerCase())) &&
            (categoria === '' || cat === categoria);
        
        fila.style.display = mostrar ? '' : 'none';
    });
}

function mostrarFormularioProducto(producto = null) {
    const formContainer = document.getElementById('form-producto');
    if (!formContainer) return;
    
    formContainer.style.display = 'block';
    
    // Limpiar formulario si es nuevo
    if (!producto) {
        document.getElementById('form-producto-data').reset();
        document.getElementById('producto-id').value = '';
        document.getElementById('stock').value = 0;
        document.getElementById('stock-minimo').value = 5;
        
        // Generar código de barras sugerido
        const codigoInput = document.getElementById('codigo');
        if (codigoInput && !codigoInput.value) {
            codigoInput.value = '779' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
        }
    }
    
    // Scroll al formulario
    window.scrollTo({
        top: formContainer.offsetTop - 100,
        behavior: 'smooth'
    });
}

function ocultarFormularioProducto() {
    const formContainer = document.getElementById('form-producto');
    if (formContainer) {
        formContainer.style.display = 'none';
        document.getElementById('form-producto-data').reset();
    }
}

function editarProducto(id) {
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    const producto = productos.find(p => p.id === id);
    
    if (producto) {
        mostrarFormularioProducto(producto);
        
        // Rellenar formulario
        const campos = {
            'producto-id': producto.id,
            'codigo': producto.codigo,
            'nombre': producto.nombre,
            'categoria': producto.categoria,
            'precio': producto.precio,
            'costo': producto.costo,
            'stock': producto.stock,
            'stock-minimo': producto.stockMinimo,
            'supplier-url': producto.supplier_url || '',
            'scraping-method': producto.scraping_method || 'static',
            'selector-price': producto.scraping_selectors?.price || '',
            'selector-stock': producto.scraping_selectors?.stock || ''
        };
        
        Object.keys(campos).forEach(campoId => {
            const elemento = document.getElementById(campoId);
            if (elemento) {
                elemento.value = campos[campoId];
            }
        });
    }
}

async function guardarProducto(e) {
    e.preventDefault();
    
    // Obtener valores del formulario
    const id = document.getElementById('producto-id').value;
    const codigo = document.getElementById('codigo').value.trim();
    const nombre = document.getElementById('nombre').value.trim();
    const categoria = document.getElementById('categoria').value;
    const precio = parseFloat(document.getElementById('precio').value);
    const costo = parseFloat(document.getElementById('costo').value) || 0;
    const stock = parseInt(document.getElementById('stock').value) || 0;
    const stockMinimo = parseInt(document.getElementById('stock-minimo').value) || 5;

    // Scraping values
    const supplierUrl = document.getElementById('supplier-url').value.trim();
    const scrapingMethod = document.getElementById('scraping-method').value;
    const selectorPrice = document.getElementById('selector-price').value.trim();
    const selectorStock = document.getElementById('selector-stock').value.trim();
    
    const scrapingSelectors = {
        price: selectorPrice,
        stock: selectorStock
    };
    
    // Validaciones
    if (!codigo || !nombre || !precio) {
        SistemaBazar.mostrarMensaje('error', 'Complete los campos obligatorios (*)');
        return;
    }
    
    if (precio <= 0) {
        SistemaBazar.mostrarMensaje('error', 'El precio debe ser mayor a 0');
        return;
    }
    
    // Obtener productos actuales
    let productos = JSON.parse(localStorage.getItem('productos') || '[]');
    
    // Verificar si el código ya existe (excepto en edición)
    const codigoExistente = productos.find(p => p.codigo === codigo && p.id !== parseInt(id));
    if (codigoExistente) {
        SistemaBazar.mostrarMensaje('error', 'El código de barras ya está registrado');
        return;
    }
    
    let nuevoProducto;
    
    if (id) {
        // EDITAR producto existente
        const index = productos.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            nuevoProducto = {
                ...productos[index],
                codigo,
                nombre,
                categoria,
                precio,
                costo,
                stock,
                stockMinimo,
                supplier_url: supplierUrl,
                scraping_method: scrapingMethod,
                scraping_selectors: scrapingSelectors,
                fechaActualizacion: new Date().toISOString()
            };
            productos[index] = nuevoProducto;
            
            SistemaBazar.mostrarMensaje('exito', 'Producto actualizado correctamente');
        }
    } else {
        // NUEVO producto
        const nuevoId = parseInt(localStorage.getItem('contador_productos') || '0') + 1;
        nuevoProducto = {
            id: nuevoId,
            codigo,
            nombre,
            categoria,
            precio,
            costo,
            stock,
            stockMinimo,
            supplier_url: supplierUrl,
            scraping_method: scrapingMethod,
            scraping_selectors: scrapingSelectors,
            fechaCreacion: new Date().toISOString()
        };
        productos.push(nuevoProducto);
        
        // Actualizar contador
        localStorage.setItem('contador_productos', nuevoId.toString());
        
        SistemaBazar.mostrarMensaje('exito', 'Producto creado correctamente');
    }
    
    // Guardar en localStorage
    localStorage.setItem('productos', JSON.stringify(productos));

    // Sincronizar con backend
    await syncWithBackend(productos);
    
    // Actualizar lista
    cargarProductos();
    
    // Ocultar formulario
    ocultarFormularioProducto();
    
    // Actualizar dashboard si existe
    if (typeof SistemaBazar.cargarEstadisticasDashboard === 'function') {
        SistemaBazar.cargarEstadisticasDashboard();
    }
    
    // Actualizar productos rápidos en ventas
    if (typeof window.actualizarProductosRapidos === 'function') {
        window.actualizarProductosRapidos();
    }
}

async function eliminarProducto(id) {
    const confirmar = await mostrarConfirmacion(
        '¿Eliminar producto?',
        'Esta acción no se puede deshacer. ¿Desea continuar?',
        'warning'
    );
    
    if (!confirmar) return;
    
    let productos = JSON.parse(localStorage.getItem('productos') || '[]');
    productos = productos.filter(p => p.id !== id);
    
    localStorage.setItem('productos', JSON.stringify(productos));
    await syncWithBackend(productos);
    
    SistemaBazar.mostrarMensaje('exito', 'Producto eliminado correctamente');
    cargarProductos();
    
    // Actualizar dashboard
    if (typeof SistemaBazar.cargarEstadisticasDashboard === 'function') {
        SistemaBazar.cargarEstadisticasDashboard();
    }
}

async function syncWithBackend(productos) {
    try {
        const url = getApiUrl('/api/products/sync');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productos)
        });
        if (!response.ok) throw new Error('Failed to sync');
        console.log('Sincronizado con backend');
    } catch (e) {
        console.error('Error sincronizando con backend:', e);
    }
}

async function actualizarProveedores() {
    const btn = document.getElementById('btn-actualizar-proveedores');
    const originalText = btn.innerHTML;
    
    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
        btn.disabled = true;

        // Primero sincronizamos para asegurar que el backend tiene los últimos datos (URLs, selectores)
        const productos = JSON.parse(localStorage.getItem('productos') || '[]');
        await syncWithBackend(productos);
        
        // Luego disparamos la actualización
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/products/update-scraping`, {
            method: 'POST'
        });
        
        if (response.ok) {
            SistemaBazar.mostrarMensaje('exito', 'Actualización iniciada en segundo plano. Los precios se actualizarán en breve.');
            // Opcional: Podríamos hacer polling para ver el progreso, pero por ahora basta con avisar.
        } else {
            throw new Error('Error al iniciar actualización');
        }
    } catch (e) {
        console.error(e);
        SistemaBazar.mostrarMensaje('error', 'Error al conectar con el servidor de actualización. Asegúrate de que el backend esté corriendo.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function verDetallesProducto(id) {
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    const producto = productos.find(p => p.id === id);
    
    if (!producto) return;
    
    const detallesHTML = `
        <div class="detalles-producto">
            <h3><i class="fas fa-box"></i> ${producto.nombre}</h3>
            <div class="detalles-grid">
                <div class="detalle-item">
                    <strong>Código:</strong>
                    <span>${producto.codigo}</span>
                </div>
                <div class="detalle-item">
                    <strong>Categoría:</strong>
                    <span>${producto.categoria}</span>
                </div>
                <div class="detalle-item">
                    <strong>Precio Venta:</strong>
                    <span>$${producto.precio.toFixed(2)}</span>
                </div>
                <div class="detalle-item">
                    <strong>Costo:</strong>
                    <span>$${producto.costo.toFixed(2)}</span>
                </div>
                <div class="detalle-item">
                    <strong>Stock Actual:</strong>
                    <span>${producto.stock} unidades</span>
                </div>
                <div class="detalle-item">
                    <strong>Stock Mínimo:</strong>
                    <span>${producto.stockMinimo} unidades</span>
                </div>
                <div class="detalle-item">
                    <strong>Margen:</strong>
                    <span>${producto.costo > 0 ? ((producto.precio - producto.costo) / producto.costo * 100).toFixed(1) : '0'}%</span>
                </div>
                <div class="detalle-item">
                    <strong>Valor Stock:</strong>
                    <span>$${(producto.stock * producto.costo).toFixed(2)}</span>
                </div>
                ${producto.supplier_url ? `
                <div class="detalle-item full-width">
                    <strong>Proveedor:</strong>
                    <a href="${producto.supplier_url}" target="_blank" class="link-proveedor">
                        <i class="fas fa-external-link-alt"></i> Ver en proveedor
                    </a>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    mostrarModal('Detalles del Producto', detallesHTML);
}

async function exportarExcel() {
    try {
        SistemaBazar.mostrarMensaje('info', 'Generando exportación masiva...');
        
        // Obtener TODOS los productos del servidor
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Error de conexión con servidor');
        const productos = await response.json();
        
        if (!productos || productos.length === 0) {
            SistemaBazar.mostrarMensaje('warning', 'No hay productos para exportar');
            return;
        }
        
        // Preparar datos para Excel
        const datosExportar = productos.map(p => ({
            'ID': p.id,
            'Código': p.codigo,
            'Nombre': p.nombre,
            'Categoría': p.categoria,
            'Precio Venta': p.precio,
            'Costo': p.costo || 0,
            'Stock': p.stock,
            'Stock Mínimo': p.stockMinimo || 5, // Valor por defecto si no viene del server
            'Unidad': p.unidad || 'un',
            'Proveedor URL': p.supplier_url || '',
            'Método Scraping': p.scraping_method || '',
            'Fecha Actualización': p.fechaActualizacion ? new Date(p.fechaActualizacion).toLocaleString() : new Date().toLocaleDateString()
        }));
        
        // Crear libro y hoja
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datosExportar);
        
        // Ajustar ancho de columnas (básico)
        const wscols = [
            {wch: 5},  // ID
            {wch: 15}, // Código
            {wch: 40}, // Nombre
            {wch: 15}, // Categoría
            {wch: 12}, // Precio
            {wch: 12}, // Costo
            {wch: 8},  // Stock
            {wch: 10}, // Stock Min
            {wch: 30}, // URL
            {wch: 15}, // Método
            {wch: 20}  // Fecha
        ];
        ws['!cols'] = wscols;
        
        XLSX.utils.book_append_sheet(wb, ws, "Productos");
        
        // Generar nombre de archivo con fecha
        const fecha = new Date().toISOString().slice(0,10);
        XLSX.writeFile(wb, `Inventario_Masivo_${fecha}.xlsx`);
        
        SistemaBazar.mostrarMensaje('exito', `Exportación completada: ${productos.length} productos`);
    } catch (error) {
        console.error('Error exportando:', error);
        SistemaBazar.mostrarMensaje('error', 'Falló la exportación: ' + error.message);
    }
}



function mostrarModalDetalles(contenido) {
    // Crear modal si no existe
    let modal = document.getElementById('modal-detalles-producto');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-detalles-producto';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <span class="close-modal">&times;</span>
                <div id="detalles-contenido"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Configurar cierre
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Estilos para detalles
    const style = document.createElement('style');
    style.textContent = `
        .detalles-producto {
            padding: 10px;
        }
        
        .detalles-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        
        .detalle-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #dee2e6;
        }
        
        .detalle-item:last-child {
            border-bottom: none;
        }
        
        .detalles-fecha {
            text-align: right;
            color: #6c757d;
            font-size: 0.9rem;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #dee2e6;
        }
    `;
    if (!document.getElementById('estilos-detalles')) {
        style.id = 'estilos-detalles';
        document.head.appendChild(style);
    }
    
    // Mostrar contenido
    modal.querySelector('#detalles-contenido').innerHTML = contenido;
    modal.style.display = 'flex';
}

function mostrarConfirmacion(titulo, mensaje, tipo = 'warning') {
    return new Promise((resolve) => {
        // Crear modal de confirmación
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="confirmacion-header" style="text-align: center; margin-bottom: 20px;">
                    <i class="fas fa-exclamation-triangle fa-3x" style="color: #f39c12; margin-bottom: 15px;"></i>
                    <h3 style="color: #2c3e50; margin-bottom: 10px;">${titulo}</h3>
                    <p style="color: #7f8c8d;">${mensaje}</p>
                </div>
                <div class="confirmacion-botones" style="display: flex; gap: 15px; justify-content: center; margin-top: 25px;">
                    <button id="confirmar-si" class="btn-success" style="flex: 1;">
                        <i class="fas fa-check"></i> Sí, continuar
                    </button>
                    <button id="confirmar-no" class="btn-secondary" style="flex: 1;">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Configurar eventos
        document.getElementById('confirmar-si').addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });
        
        document.getElementById('confirmar-no').addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });
    });
}

// Exportar funciones para otros módulos
window.ProductosAPI = {
    cargarProductos,
    obtenerProductoPorId: (id) => {
        const productos = JSON.parse(localStorage.getItem('productos') || '[]');
        return productos.find(p => p.id === id);
    },
    obtenerProductoPorCodigo: (codigo) => {
        const productos = JSON.parse(localStorage.getItem('productos') || '[]');
        return productos.find(p => p.codigo === codigo);
    },
    actualizarStock: (id, cantidad, operacion = 'restar') => {
        let productos = JSON.parse(localStorage.getItem('productos') || '[]');
        const index = productos.findIndex(p => p.id === id);
        
        if (index !== -1) {
            if (operacion === 'restar') {
                productos[index].stock = Math.max(0, productos[index].stock - cantidad);
            } else {
                productos[index].stock += cantidad;
            }
            
            localStorage.setItem('productos', JSON.stringify(productos));
            return true;
        }
        return false;
    }
};
