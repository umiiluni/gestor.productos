// SISTEMA BAZAR ARGENTINA - INVENTARIO.JS
// Control y gestión de inventario

document.addEventListener('DOMContentLoaded', function() {
    inicializarModuloInventario();
});

function inicializarModuloInventario() {
    console.log('Módulo de inventario inicializado');
    
    // Inicializar flatpickr para filtro de fechas
    inicializarDatePicker();
    
    // Cargar datos de inventario
    cargarInventario();
    
    // Cargar estadísticas
    cargarEstadisticasInventario();
    
    // Cargar alertas
    cargarAlertasStock();
    
    // Configurar eventos
    configurarEventosInventario();
    
    // Configurar filtros
    configurarFiltros();
}

function inicializarDatePicker() {
    const filtroFecha = document.getElementById('filtro-fecha');
    if (filtroFecha) {
        flatpickr(filtroFecha, {
            mode: "range",
            dateFormat: "Y-m-d",
            locale: "es",
            onChange: function(selectedDates, dateStr) {
                if (dateStr) {
                    aplicarFiltros();
                }
            }
        });
    }
}

function cargarInventario() {
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    const tabla = document.getElementById('tabla-inventario');
    
    if (!tabla) return;
    
    const tbody = tabla.querySelector('tbody');
    tbody.innerHTML = '';
    
    if (productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <i class="fas fa-boxes fa-2x"></i>
                    <p style="margin-top: 15px;">No hay productos en el inventario</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Calcular valor total del inventario
    let valorTotal = 0;
    
    productos.forEach(producto => {
        const valorProducto = producto.stock * (producto.costo || producto.precio * 0.7);
        valorTotal += valorProducto;
        
        const estado = obtenerEstadoInventario(producto);
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${producto.codigo}</strong></td>
            <td>${producto.nombre}</td>
            <td><span class="badge-categoria">${producto.categoria}</span></td>
            <td>$${producto.precio.toFixed(2)}</td>
            <td>$${(producto.costo || producto.precio * 0.7).toFixed(2)}</td>
            <td>
                <span class="stock-indicator ${estado.clase}">
                    ${producto.stock}
                    <div class="stock-bar" style="width: ${Math.min(100, (producto.stock / (producto.stockMinimo * 3)) * 100)}%"></div>
                </span>
            </td>
            <td>${producto.stockMinimo}</td>
            <td><strong>$${valorProducto.toFixed(2)}</strong></td>
            <td>
                <span class="estado-inventario estado-${estado.clase}">
                    <i class="fas fa-${estado.icono}"></i> ${estado.texto}
                </span>
            </td>
            <td>
                <button class="btn-historial" data-id="${producto.id}" title="Ver historial">
                    <i class="fas fa-history"></i>
                </button>
                <button class="btn-ajustar" data-id="${producto.id}" title="Ajustar stock">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tbody.appendChild(fila);
    });
    
    // Aplicar estilos
    aplicarEstilosInventario();
}

function obtenerEstadoInventario(producto) {
    const porcentajeStock = producto.stockMinimo > 0 ? 
        (producto.stock / producto.stockMinimo) * 100 : 100;
    
    if (producto.stock === 0) {
        return { 
            texto: 'Agotado', 
            clase: 'agotado', 
            icono: 'times-circle' 
        };
    } else if (porcentajeStock <= 50) {
        return { 
            texto: 'Crítico', 
            clase: 'critico', 
            icono: 'exclamation-circle' 
        };
    } else if (porcentajeStock <= 100) {
        return { 
            texto: 'Bajo', 
            clase: 'bajo', 
            icono: 'exclamation-triangle' 
        };
    } else if (porcentajeStock <= 200) {
        return { 
            texto: 'Normal', 
            clase: 'normal', 
            icono: 'check-circle' 
        };
    } else {
        return { 
            texto: 'Excedente', 
            clase: 'excedente', 
            icono: 'box' 
        };
    }
}

function aplicarEstilosInventario() {
    const style = document.createElement('style');
    style.textContent = `
        .stock-indicator {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 15px;
            font-weight: 600;
            position: relative;
            overflow: hidden;
            min-width: 60px;
            text-align: center;
        }
        
        .stock-bar {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: rgba(0,0,0,0.1);
            z-index: 1;
        }
        
        .stock-indicator.agotado {
            background: #f8d7da;
            color: #721c24;
        }
        
        .stock-indicator.critico {
            background: #fff3cd;
            color: #856404;
        }
        
        .stock-indicator.bajo {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .stock-indicator.normal {
            background: #d4edda;
            color: #155724;
        }
        
        .stock-indicator.excedente {
            background: #cce5ff;
            color: #004085;
        }
        
        .estado-inventario {
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        
        .estado-agotado {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .estado-critico {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        .estado-bajo {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .estado-normal {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .estado-excedente {
            background: #cce5ff;
            color: #004085;
            border: 1px solid #b8daff;
        }
        
        .btn-historial, .btn-ajustar {
            width: 35px;
            height: 35px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin: 2px;
            transition: all 0.3s;
        }
        
        .btn-historial {
            background: #6c757d;
            color: white;
        }
        
        .btn-ajustar {
            background: #3498db;
            color: white;
        }
        
        .btn-historial:hover, .btn-ajustar:hover {
            transform: translateY(-2px);
            box-shadow: 0 3px 8px rgba(0,0,0,0.2);
        }
    `;
    if (!document.getElementById('estilos-inventario')) {
        style.id = 'estilos-inventario';
        document.head.appendChild(style);
    }
}

function cargarEstadisticasInventario() {
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    
    if (productos.length === 0) {
        document.getElementById('stat-total-productos').textContent = '0';
        document.getElementById('stat-valor-inventario').textContent = '$0.00';
        document.getElementById('stat-bajo-stock').textContent = '0';
        document.getElementById('stat-rotacion').textContent = '0%';
        return;
    }
    
    // Calcular estadísticas
    const totalProductos = productos.length;
    const valorInventario = productos.reduce((total, p) => {
        return total + (p.stock * (p.costo || p.precio * 0.7));
    }, 0);
    
    const bajoStock = productos.filter(p => p.stock <= p.stockMinimo).length;
    
    // Calcular rotación (simulada)
    const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
    const ventasUltimoMes = ventas.filter(v => {
        const fechaVenta = new Date(v.fecha);
        const unMesAtras = new Date();
        unMesAtras.setMonth(unMesAtras.getMonth() - 1);
        return fechaVenta > unMesAtras;
    }).length;
    
    const rotacion = ventasUltimoMes > 0 ? 
        Math.min(100, (ventasUltimoMes / productos.length) * 10) : 0;
    
    // Actualizar UI
    document.getElementById('stat-total-productos').textContent = totalProductos;
    document.getElementById('stat-valor-inventario').textContent = `$${valorInventario.toFixed(2)}`;
    document.getElementById('stat-bajo-stock').textContent = bajoStock;
    document.getElementById('stat-rotacion').textContent = `${rotacion.toFixed(1)}%`;
}

function cargarAlertasStock() {
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    const alertasContainer = document.getElementById('alertas-container');
    
    if (!alertasContainer) return;
    
    const productosBajoStock = productos.filter(p => p.stock <= p.stockMinimo);
    const productosAgotados = productos.filter(p => p.stock === 0);
    
    if (productosBajoStock.length === 0 && productosAgotados.length === 0) {
        alertasContainer.innerHTML = `
            <div class="alerta vacia">
                <i class="fas fa-check-circle"></i>
                <p>No hay alertas de stock en este momento</p>
            </div>
        `;
        return;
    }
    
    alertasContainer.innerHTML = '';
    
    // Alertas de productos agotados
    productosAgotados.forEach(producto => {
        const alerta = document.createElement('div');
        alerta.className = 'alerta critica';
        alerta.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <div style="flex: 1;">
                <strong>${producto.nombre}</strong>
                <p style="margin: 5px 0; font-size: 0.9rem;">Código: ${producto.codigo}</p>
                <p style="margin: 0; font-size: 0.9rem;">Stock: <strong>AGOTADO</strong> | Mínimo: ${producto.stockMinimo}</p>
            </div>
            <button class="btn-reabastecer" data-id="${producto.id}">
                <i class="fas fa-truck"></i> Reabastecer
            </button>
        `;
        alertasContainer.appendChild(alerta);
    });
    
    // Alertas de bajo stock
    productosBajoStock.filter(p => p.stock > 0).forEach(producto => {
        const alerta = document.createElement('div');
        alerta.className = 'alerta';
        alerta.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <div style="flex: 1;">
                <strong>${producto.nombre}</strong>
                <p style="margin: 5px 0; font-size: 0.9rem;">Código: ${producto.codigo}</p>
                <p style="margin: 0; font-size: 0.9rem;">Stock: ${producto.stock} | Mínimo: ${producto.stockMinimo}</p>
            </div>
            <button class="btn-reabastecer" data-id="${producto.id}">
                <i class="fas fa-edit"></i> Ajustar
            </button>
        `;
        alertasContainer.appendChild(alerta);
    });
    
    // Agregar eventos a botones de reabastecimiento
    document.querySelectorAll('.btn-reabastecer').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            mostrarFormularioAjuste(id, 'entrada');
        });
    });
}

function configurarEventosInventario() {
    // Botón ajuste de stock
    const btnAjuste = document.getElementById('btn-ajuste-inventario');
    if (btnAjuste) {
        btnAjuste.addEventListener('click', () => mostrarFormularioAjuste());
    }
    
    // Botón exportar Excel
    const btnExcel = document.getElementById('btn-exportar-excel');
    if (btnExcel) {
        btnExcel.addEventListener('click', exportarAExcel);
    }
    
    // Botón exportar PDF
    const btnPDF = document.getElementById('btn-exportar-pdf');
    if (btnPDF) {
        btnPDF.addEventListener('click', exportarAPDF);
    }
    
    // Botón imprimir
    const btnImprimir = document.getElementById('btn-imprimir-inventario');
    if (btnImprimir) {
        btnImprimir.addEventListener('click', imprimirInventario);
    }
    
    // Delegación de eventos para botones en tabla
    document.addEventListener('click', function(e) {
        // Botones historial
        if (e.target.closest('.btn-historial')) {
            const boton = e.target.closest('.btn-historial');
            const id = parseInt(boton.dataset.id);
            mostrarHistorialProducto(id);
        }
        
        // Botones ajustar
        if (e.target.closest('.btn-ajustar')) {
            const boton = e.target.closest('.btn-ajustar');
            const id = parseInt(boton.dataset.id);
            mostrarFormularioAjuste(id);
        }
    });
    
    // Formulario ajuste de stock
    const formAjuste = document.getElementById('form-ajuste');
    if (formAjuste) {
        formAjuste.addEventListener('submit', aplicarAjusteStock);
    }
    
    // Botón cancelar ajuste
    const btnCancelarAjuste = document.getElementById('btn-cancelar-ajuste');
    if (btnCancelarAjuste) {
        btnCancelarAjuste.addEventListener('click', cerrarModalAjuste);
    }
    
    // Carga de productos en select
    cargarProductosEnSelect();
}

function configurarFiltros() {
    const btnAplicar = document.getElementById('btn-aplicar-filtros');
    const btnLimpiar = document.getElementById('btn-limpiar-filtros');
    
    if (btnAplicar) {
        btnAplicar.addEventListener('click', aplicarFiltros);
    }
    
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFiltros);
    }
    
    const selectCategoria = document.getElementById('filtro-categoria');
    const selectEstado = document.getElementById('filtro-estado');
    
    if (selectCategoria) {
        selectCategoria.addEventListener('change', aplicarFiltros);
    }
    
    if (selectEstado) {
        selectEstado.addEventListener('change', aplicarFiltros);
    }
}

function cargarProductosEnSelect() {
    const select = document.getElementById('ajuste-producto');
    if (!select) return;
    
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    select.innerHTML = '<option value="">Seleccionar producto</option>';
    
    productos.forEach(producto => {
        const option = document.createElement('option');
        option.value = producto.id;
        option.textContent = `${producto.codigo} - ${producto.nombre} (Stock: ${producto.stock})`;
        select.appendChild(option);
    });
}

function mostrarFormularioAjuste(productoId = null, tipo = null) {
    const modal = document.getElementById('modal-ajuste');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    // Limpiar formulario
    document.getElementById('form-ajuste').reset();
    
    // Si se especifica producto y tipo
    if (productoId) {
        document.getElementById('ajuste-producto').value = productoId;
        
        if (tipo) {
            document.getElementById('ajuste-tipo').value = tipo;
        }
        
        // Si es reabastecimiento, sugerir cantidad
        if (tipo === 'entrada') {
            const productos = JSON.parse(localStorage.getItem('productos') || '[]');
            const producto = productos.find(p => p.id === productoId);
            if (producto) {
                const cantidadSugerida = producto.stockMinimo * 2;
                document.getElementById('ajuste-cantidad').value = cantidadSugerida;
                document.getElementById('ajuste-motivo').value = 'Reabastecimiento por bajo stock';
            }
        }
    }
}

function cerrarModalAjuste() {
    const modal = document.getElementById('modal-ajuste');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function aplicarAjusteStock(e) {
    e.preventDefault();
    
    const productoId = parseInt(document.getElementById('ajuste-producto').value);
    const tipo = document.getElementById('ajuste-tipo').value;
    const cantidad = parseInt(document.getElementById('ajuste-cantidad').value);
    const motivo = document.getElementById('ajuste-motivo').value.trim();
    
    // Validaciones
    if (!productoId || !cantidad || cantidad <= 0) {
        SistemaBazar.mostrarMensaje('error', 'Complete todos los campos obligatorios');
        return;
    }
    
    // Obtener producto
    let productos = JSON.parse(localStorage.getItem('productos') || '[]');
    const productoIndex = productos.findIndex(p => p.id === productoId);
    
    if (productoIndex === -1) {
        SistemaBazar.mostrarMensaje('error', 'Producto no encontrado');
        return;
    }
    
    const producto = productos[productoIndex];
    
    // Validar stock si es salida
    if (tipo === 'salida' && producto.stock < cantidad) {
        SistemaBazar.mostrarMensaje('error', `Stock insuficiente. Disponible: ${producto.stock}`);
        return;
    }
    
    // Aplicar ajuste
    let nuevoStock = producto.stock;
    
    switch (tipo) {
        case 'entrada':
            nuevoStock += cantidad;
            break;
        case 'salida':
            nuevoStock = Math.max(0, nuevoStock - cantidad);
            break;
        case 'ajuste':
            nuevoStock = cantidad;
            break;
    }
    
    // Actualizar producto
    productos[productoIndex].stock = nuevoStock;
    
    // Guardar historial
    guardarMovimientoInventario({
        productoId: producto.id,
        productoNombre: producto.nombre,
        tipo: tipo,
        cantidad: cantidad,
        stockAnterior: producto.stock,
        stockNuevo: nuevoStock,
        motivo: motivo || 'Ajuste manual',
        fecha: new Date().toISOString(),
        usuario: 'Sistema'
    });
    
    // Guardar cambios
    localStorage.setItem('productos', JSON.stringify(productos));
    
    // Cerrar modal
    cerrarModalAjuste();
    
    // Actualizar vista
    cargarInventario();
    cargarEstadisticasInventario();
    cargarAlertasStock();
    
    // Actualizar otros módulos
    if (typeof window.actualizarProductosRapidos === 'function') {
        window.actualizarProductosRapidos();
    }
    
    SistemaBazar.mostrarMensaje('exito', `Stock actualizado: ${producto.nombre} (${nuevoStock} unidades)`);
}

function guardarMovimientoInventario(movimiento) {
    const movimientos = JSON.parse(localStorage.getItem('movimientos_inventario') || '[]');
    movimientos.push({
        id: Date.now(),
        ...movimiento
    });
    localStorage.setItem('movimientos_inventario', JSON.stringify(movimientos));
}

function mostrarHistorialProducto(productoId) {
    const movimientos = JSON.parse(localStorage.getItem('movimientos_inventario') || '[]');
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;
    
    const movimientosProducto = movimientos
        .filter(m => m.productoId === productoId)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    let historialHTML = `
        <div class="historial-header">
            <h4>${producto.nombre}</h4>
            <p>Código: ${producto.codigo} | Stock actual: ${producto.stock}</p>
        </div>
    `;
    
    if (movimientosProducto.length === 0) {
        historialHTML += `
            <div style="text-align: center; padding: 30px; color: #7f8c8d;">
                <i class="fas fa-history fa-2x"></i>
                <p style="margin-top: 15px;">No hay movimientos registrados</p>
            </div>
        `;
    } else {
        historialHTML += `
            <div class="historial-list">
        `;
        
        movimientosProducto.forEach(mov => {
            const fecha = new Date(mov.fecha);
            const fechaStr = fecha.toLocaleDateString('es-AR');
            const horaStr = fecha.toLocaleTimeString('es-AR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            const tipoClase = mov.tipo === 'entrada' ? 'entrada' : 
                            mov.tipo === 'salida' ? 'salida' : 'ajuste';
            const tipoTexto = mov.tipo === 'entrada' ? 'Entrada' : 
                            mov.tipo === 'salida' ? 'Salida' : 'Ajuste';
            const signo = mov.tipo === 'entrada' ? '+' : '-';
            
            historialHTML += `
                <div class="historial-item">
                    <div class="historial-tipo ${tipoClase}">
                        <i class="fas fa-${tipoClase === 'entrada' ? 'arrow-down' : 'arrow-up'}"></i>
                        ${tipoTexto}
                    </div>
                    <div class="historial-info">
                        <div class="historial-cantidad">
                            ${signo}${mov.cantidad} unidades
                        </div>
                        <div class="historial-stock">
                            ${mov.stockAnterior} → ${mov.stockNuevo}
                        </div>
                        <div class="historial-motivo">
                            ${mov.motivo}
                        </div>
                    </div>
                    <div class="historial-fecha">
                        ${fechaStr}<br>${horaStr}
                    </div>
                </div>
            `;
        });
        
        historialHTML += `</div>`;
    }
    
    // Mostrar modal
    mostrarModalHistorial(historialHTML);
}

function mostrarModalHistorial(contenido) {
    // Crear modal si no existe
    let modal = document.getElementById('modal-historial');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-historial';
        modal.className = 'modal historial-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <div id="historial-container"></div>
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
    
    // Estilos para historial
    const style = document.createElement('style');
    style.textContent = `
        .historial-header {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .historial-list {
            max-height: 400px;
            overflow-y: auto;
        }
        
        .historial-item {
            display: flex;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid #dee2e6;
            gap: 15px;
        }
        
        .historial-item:last-child {
            border-bottom: none;
        }
        
        .historial-tipo {
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 5px;
            min-width: 100px;
        }
        
        .historial-tipo.entrada {
            background: #d4edda;
            color: #155724;
        }
        
        .historial-tipo.salida {
            background: #f8d7da;
            color: #721c24;
        }
        
        .historial-tipo.ajuste {
            background: #fff3cd;
            color: #856404;
        }
        
        .historial-info {
            flex: 1;
        }
        
        .historial-cantidad {
            font-weight: 600;
            font-size: 1.1rem;
            margin-bottom: 5px;
        }
        
        .historial-stock {
            color: #6c757d;
            font-size: 0.9rem;
            margin-bottom: 5px;
        }
        
        .historial-motivo {
            font-size: 0.85rem;
            color: #495057;
        }
        
        .historial-fecha {
            font-size: 0.8rem;
            color: #6c757d;
            text-align: right;
        }
    `;
    if (!document.getElementById('estilos-historial')) {
        style.id = 'estilos-historial';
        document.head.appendChild(style);
    }
    
    // Mostrar contenido
    modal.querySelector('#historial-container').innerHTML = contenido;
    modal.style.display = 'flex';
}

function aplicarFiltros() {
    const categoria = document.getElementById('filtro-categoria').value;
    const estado = document.getElementById('filtro-estado').value;
    const fecha = document.getElementById('filtro-fecha').value;
    
    const filas = document.querySelectorAll('#tabla-inventario tbody tr');
    
    filas.forEach(fila => {
        if (fila.cells.length < 10) return;
        
        const cat = fila.cells[2].textContent;
        const estadoElement = fila.cells[8].querySelector('.estado-inventario');
        const estadoClase = estadoElement ? estadoElement.className : '';
        
        let mostrar = true;
        
        // Filtrar por categoría
        if (categoria && cat !== categoria) {
            mostrar = false;
        }
        
        // Filtrar por estado
        if (estado) {
            if (estado === 'bajo' && !estadoClase.includes('estado-bajo') && !estadoClase.includes('estado-critico') && !estadoClase.includes('estado-agotado')) {
                mostrar = false;
            } else if (estado === 'normal' && !estadoClase.includes('estado-normal')) {
                mostrar = false;
            } else if (estado === 'sin' && !estadoClase.includes('estado-agotado')) {
                mostrar = false;
            }
        }
        
        // Filtrar por fecha (simplificado)
        if (fecha) {
            // En un sistema real, aquí buscarías movimientos recientes
            // Por ahora solo mostramos todos
        }
        
        fila.style.display = mostrar ? '' : 'none';
    });
}

function limpiarFiltros() {
    document.getElementById('filtro-categoria').value = '';
    document.getElementById('filtro-estado').value = '';
    document.getElementById('filtro-fecha').value = '';
    
    const filas = document.querySelectorAll('#tabla-inventario tbody tr');
    filas.forEach(fila => {
        fila.style.display = '';
    });
}

function exportarAExcel() {
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    
    if (productos.length === 0) {
        SistemaBazar.mostrarMensaje('error', 'No hay datos para exportar');
        return;
    }
    
    // Crear contenido CSV
    let csv = 'Código,Nombre,Categoría,Precio,Costo,Stock,Stock Mínimo,Valor Total,Estado\n';
    
    productos.forEach(producto => {
        const valorTotal = producto.stock * (producto.costo || producto.precio * 0.7);
        const estado = obtenerEstadoInventario(producto).texto;
        
        csv += `"${producto.codigo}","${producto.nombre}","${producto.categoria}",${producto.precio},${producto.costo || producto.precio * 0.7},${producto.stock},${producto.stockMinimo},${valorTotal},"${estado}"\n`;
    });
    
    // Crear y descargar archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    SistemaBazar.mostrarMensaje('exito', 'Inventario exportado a CSV');
}

function exportarAPDF() {
    SistemaBazar.mostrarMensaje('info', 'Función de exportación a PDF en desarrollo');
    // En producción, usarías una librería como jsPDF
}

function imprimirInventario() {
    const printWindow = window.open('', '_blank');
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reporte de Inventario</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { text-align: center; color: #2c3e50; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #f2f2f2; }
                .header-info { margin-bottom: 30px; }
                .totales { margin-top: 30px; font-weight: bold; }
                @media print {
                    body { margin: 0; padding: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>INVENTARIO BAZAR ARGENTINA</h1>
            <div class="header-info">
                <p>Fecha: ${new Date().toLocaleDateString('es-AR')}</p>
                <p>Total productos: ${productos.length}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Costo</th>
                        <th>Stock</th>
                        <th>Stock Mínimo</th>
                        <th>Valor</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    let valorTotal = 0;
    
    productos.forEach(producto => {
        const valor = producto.stock * (producto.costo || producto.precio * 0.7);
        valorTotal += valor;
        const estado = obtenerEstadoInventario(producto).texto;
        
        html += `
            <tr>
                <td>${producto.codigo}</td>
                <td>${producto.nombre}</td>
                <td>${producto.categoria}</td>
                <td>$${producto.precio.toFixed(2)}</td>
                <td>$${(producto.costo || producto.precio * 0.7).toFixed(2)}</td>
                <td>${producto.stock}</td>
                <td>${producto.stockMinimo}</td>
                <td>$${valor.toFixed(2)}</td>
                <td>${estado}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
            <div class="totales">
                <p>Valor total del inventario: $${valorTotal.toFixed(2)}</p>
            </div>
            <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()">Imprimir</button>
                <button onclick="window.close()">Cerrar</button>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
}
