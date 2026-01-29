// SISTEMA BAZAR ARGENTINA - VENTAS.JS
// Punto de venta y gestión de ventas

document.addEventListener('DOMContentLoaded', function() {
    inicializarModuloVentas();
});

function inicializarModuloVentas() {
    console.log('Módulo de ventas inicializado V2');
    
    // Inicializar carrito
    cargarCarrito();
    
    // Configurar eventos
    configurarEventosVentas();
    
    // Cargar productos rápidos
    actualizarProductosRapidos();
    
    // Cargar ventas del día
    cargarVentasHoy();
    
    // Configurar método de pago
    configurarMetodoPago();
    
    // Escuchar eventos del scanner (cámara)
    document.addEventListener('codigoEscaneado', function(e) {
        const { codigo, producto } = e.detail;
        console.log('Producto escaneado desde cámara:', producto ? producto.nombre : codigo);
        
        if (producto) {
            agregarAlCarrito(producto.id, 1);
            
            // Cerrar modal de scanner si está abierto
            const scannerModal = document.getElementById('scanner-modal-ventas');
            if (scannerModal) {
                scannerModal.style.display = 'none';
                if (window.ScannerAPI && window.ScannerAPI.cerrarScanner) {
                    window.ScannerAPI.cerrarScanner();
                }
            }
        }
    });
}

let carrito = [];

function cargarCarrito() {
    const carritoGuardado = localStorage.getItem('carrito_venta');
    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
    }
    actualizarCarritoUI();
}

function guardarCarrito() {
    localStorage.setItem('carrito_venta', JSON.stringify(carrito));
}

function configurarEventosVentas() {
    // Finalizar venta
    const btnFinalizar = document.getElementById('btn-finalizar-venta');
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', finalizarVenta);
    }
    
    // Cancelar venta
    const btnCancelar = document.getElementById('btn-cancelar-venta');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarVenta);
    }
    
    // Efectivo recibido
    const inputEfectivo = document.getElementById('efectivo-recibido');
    if (inputEfectivo) {
        inputEfectivo.addEventListener('input', calcularVuelto);
    }
    
    // Método de pago
    const radiosPago = document.querySelectorAll('input[name="pago"]');
    radiosPago.forEach(radio => {
        radio.addEventListener('change', function() {
            mostrarSeccionEfectivo(this.value === 'efectivo');
            calcularVuelto();
        });
    });
    
    // Imprimir ticket
    const btnImprimir = document.getElementById('btn-imprimir-ticket');
    if (btnImprimir) {
        btnImprimir.addEventListener('click', imprimirTicket);
    }
    
    // Cerrar ticket
    const btnCerrarTicket = document.getElementById('btn-cerrar-ticket');
    if (btnCerrarTicket) {
        btnCerrarTicket.addEventListener('click', () => {
            document.getElementById('ticket-modal').style.display = 'none';
        });
    }
}

function configurarMetodoPago() {
    // Mostrar/ocultar sección efectivo según selección
    const efectivoRadio = document.querySelector('input[value="efectivo"]');
    if (efectivoRadio && efectivoRadio.checked) {
        mostrarSeccionEfectivo(true);
    }
}

function mostrarSeccionEfectivo(mostrar) {
    const efectivoSection = document.getElementById('efectivo-section');
    if (efectivoSection) {
        efectivoSection.style.display = mostrar ? 'block' : 'none';
    }
}

function actualizarProductosRapidos() {
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    const contenedor = document.getElementById('productos-rapidos');
    
    if (!contenedor) return;
    
    // Filtrar productos con stock y ordenar por frecuencia (simulado)
    const productosConStock = productos
        .filter(p => p.stock > 0)
        .sort((a, b) => b.stock - a.stock) // Ordenar por stock (ejemplo)
        .slice(0, 8); // Mostrar máximo 8
    
    contenedor.innerHTML = '';
    
    if (productosConStock.length === 0) {
        contenedor.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #7f8c8d; grid-column: 1 / -1;">
                <i class="fas fa-box-open fa-2x"></i>
                <p style="margin-top: 10px;">No hay productos con stock disponible</p>
            </div>
        `;
        return;
    }
    
    productosConStock.forEach(producto => {
        const productoDiv = document.createElement('div');
        productoDiv.className = 'producto-rapido';
        productoDiv.innerHTML = `
            <div style="font-size: 1.5rem; margin-bottom: 10px; color: #3498db;">
                <i class="fas fa-box"></i>
            </div>
            <div style="font-weight: 600; margin-bottom: 5px;">${producto.nombre.substring(0, 15)}${producto.nombre.length > 15 ? '...' : ''}</div>
            <div style="color: #2ecc71; font-weight: 700;">$${producto.precio.toFixed(2)}</div>
            <div style="font-size: 0.8rem; color: #7f8c8d;">Stock: ${producto.stock}</div>
        `;
        
        productoDiv.addEventListener('click', () => {
            agregarAlCarrito(producto.id, 1);
        });
        
        contenedor.appendChild(productoDiv);
    });
}

function cargarVentasHoy() {
    const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
    const hoy = new Date().toDateString();
    const ventasHoy = ventas.filter(v => new Date(v.fecha).toDateString() === hoy);
    
    const tabla = document.getElementById('tabla-ventas-hoy');
    if (!tabla) return;
    
    const tbody = tabla.querySelector('tbody');
    tbody.innerHTML = '';
    
    ventasHoy.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).forEach(venta => {
        const fecha = new Date(venta.fecha);
        const hora = fecha.toLocaleTimeString('es-AR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>#${venta.id}</td>
            <td>${hora}</td>
            <td>${venta.productos.length} productos</td>
            <td>$${venta.total.toFixed(2)}</td>
            <td>
                <span class="badge-pago ${venta.metodoPago}">
                    ${venta.metodoPago === 'efectivo' ? 'Efectivo' : 
                      venta.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Transferencia'}
                </span>
            </td>
        `;
        tbody.appendChild(fila);
    });
    
    // Aplicar estilos a badges de pago
    const style = document.createElement('style');
    style.textContent = `
        .badge-pago {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .badge-pago.efectivo {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .badge-pago.tarjeta {
            background: #cce5ff;
            color: #004085;
            border: 1px solid #b8daff;
        }
        
        .badge-pago.transferencia {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
    `;
    if (!document.getElementById('estilos-badges-pago')) {
        style.id = 'estilos-badges-pago';
        document.head.appendChild(style);
    }
}

// Funciones del carrito
window.agregarAlCarrito = function(productoId, cantidad = 1) {
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    const producto = productos.find(p => p.id === productoId);
    
    if (!producto) {
        SistemaBazar.mostrarMensaje('error', 'Producto no encontrado');
        return;
    }
    
    if (producto.stock < cantidad) {
        SistemaBazar.mostrarMensaje('error', `Stock insuficiente. Disponible: ${producto.stock}`);
        return;
    }
    
    // Buscar si el producto ya está en el carrito
    const itemIndex = carrito.findIndex(item => item.id === productoId);
    
    if (itemIndex !== -1) {
        // Actualizar cantidad
        const nuevaCantidad = carrito[itemIndex].cantidad + cantidad;
        if (producto.stock < nuevaCantidad) {
            SistemaBazar.mostrarMensaje('error', `Stock insuficiente. Máximo disponible: ${producto.stock}`);
            return;
        }
        carrito[itemIndex].cantidad = nuevaCantidad;
    } else {
        // Agregar nuevo item
        carrito.push({
            id: producto.id,
            codigo: producto.codigo,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: cantidad
        });
    }
    
    SistemaBazar.mostrarMensaje('exito', `${producto.nombre} agregado al carrito`);
    guardarCarrito();
    actualizarCarritoUI();
};

window.buscarYAgregarProductoVentaV2 = function(codigo) {
    console.log('Busqueda por codigo V2:', codigo);
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    const producto = productos.find(p => p.codigo === codigo || p.barcode === codigo);
    
    if (producto) {
        console.log('Producto encontrado V2:', producto.nombre);
        agregarAlCarrito(producto.id, 1);
    } else {
        console.log('Producto NO encontrado V2:', codigo);
        SistemaBazar.mostrarMensaje('error', 'Producto no encontrado con código: ' + codigo);
    }
};

function actualizarCarritoUI() {
    console.log('Actualizando UI carrito, items:', carrito.length);
    const contenedor = document.getElementById('carrito-items');
    if (!contenedor) {
        console.error('No se encontro contenedor carrito-items');
        return;
    }
    
    if (carrito.length === 0) {
        contenedor.innerHTML = `
            <div class="carrito-vacio">
                <i class="fas fa-shopping-cart fa-2x"></i>
                <p>El carrito está vacío</p>
                <p>Escanea o busca productos para agregar</p>
            </div>
        `;
        
        // Actualizar totales
        actualizarTotales();
        return;
    }
    
    // Calcular subtotal
    let subtotal = 0;
    
    contenedor.innerHTML = '';
    
    carrito.forEach((item, index) => {
        const itemTotal = item.precio * item.cantidad;
        subtotal += itemTotal;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'carrito-item';
        itemDiv.innerHTML = `
            <div style="flex: 2;">
                <div style="font-weight: 600; margin-bottom: 5px;">${item.nombre}</div>
                <div style="font-size: 0.9rem; color: #7f8c8d;">Código: ${item.codigo}</div>
            </div>
            <div style="flex: 1; text-align: center;">
                <div style="margin-bottom: 5px;">
                    <button class="btn-cantidad" data-index="${index}" data-action="decrementar">-</button>
                    <span style="margin: 0 10px; font-weight: 600;">${item.cantidad}</span>
                    <button class="btn-cantidad" data-index="${index}" data-action="incrementar">+</button>
                </div>
                <div style="font-size: 0.8rem;">
                    <button class="btn-eliminar-item" data-index="${index}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
            <div style="flex: 1; text-align: right;">
                <div style="font-size: 1.2rem; font-weight: 700; color: #2c3e50;">
                    $${itemTotal.toFixed(2)}
                </div>
                <div style="font-size: 0.9rem; color: #7f8c8d;">
                    $${item.precio.toFixed(2)} c/u
                </div>
            </div>
        `;
        contenedor.appendChild(itemDiv);
    });
    
    // Agregar eventos a botones de cantidad
    document.querySelectorAll('.btn-cantidad').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const action = this.dataset.action;
            
            if (action === 'incrementar') {
                modificarCantidad(index, 1);
            } else {
                modificarCantidad(index, -1);
            }
        });
    });
    
    // Agregar eventos a botones eliminar
    document.querySelectorAll('.btn-eliminar-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            eliminarDelCarrito(index);
        });
    });
    
    // Actualizar totales
    actualizarTotales(subtotal);
}

function modificarCantidad(index, cambio) {
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    const item = carrito[index];
    const producto = productos.find(p => p.id === item.id);
    
    const nuevaCantidad = item.cantidad + cambio;
    
    if (nuevaCantidad < 1) {
        eliminarDelCarrito(index);
        return;
    }
    
    if (producto.stock < nuevaCantidad) {
        SistemaBazar.mostrarMensaje('error', `Stock insuficiente. Disponible: ${producto.stock}`);
        return;
    }
    
    carrito[index].cantidad = nuevaCantidad;
    guardarCarrito();
    actualizarCarritoUI();
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    guardarCarrito();
    actualizarCarritoUI();
    SistemaBazar.mostrarMensaje('exito', 'Producto eliminado del carrito');
}

function actualizarTotales(subtotalCalculado = null) {
    // Calcular subtotal si no se proporciona
    let subtotal = subtotalCalculado;
    if (subtotal === null) {
        subtotal = carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    }
    
    // Calcular IVA (21%)
    const iva = subtotal * 0.21;
    const total = subtotal + iva;
    
    // Actualizar UI
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('iva').textContent = `$${iva.toFixed(2)}`;
    document.getElementById('total-venta').textContent = `$${total.toFixed(2)}`;
    
    // Calcular vuelto si es pago en efectivo
    calcularVuelto();
}

function calcularVuelto() {
    const efectivoRecibido = parseFloat(document.getElementById('efectivo-recibido')?.value) || 0;
    const total = parseFloat(document.getElementById('total-venta')?.textContent.replace('$', '') || 0);
    const vuelto = Math.max(0, efectivoRecibido - total);
    
    document.getElementById('vuelto').textContent = `$${vuelto.toFixed(2)}`;
    
    // Cambiar color si falta efectivo
    const vueltoElement = document.getElementById('vuelto');
    if (efectivoRecibido < total) {
        vueltoElement.style.color = '#e74c3c';
    } else {
        vueltoElement.style.color = '#2ecc71';
    }
}

async function finalizarVenta() {
    // Validaciones
    if (carrito.length === 0) {
        SistemaBazar.mostrarMensaje('error', 'El carrito está vacío');
        return;
    }
    
    const metodoPago = document.querySelector('input[name="pago"]:checked').value;
    const total = parseFloat(document.getElementById('total-venta').textContent.replace('$', ''));
    
    // Validar pago en efectivo
    if (metodoPago === 'efectivo') {
        const efectivoRecibido = parseFloat(document.getElementById('efectivo-recibido')?.value) || 0;
        if (efectivoRecibido < total) {
            SistemaBazar.mostrarMensaje('error', 'El efectivo recibido es menor al total');
            return;
        }
    }
    
    // Confirmar venta
    const confirmar = await mostrarConfirmacionVenta();
    if (!confirmar) return;
    
    // Procesar venta
    const ventaExitosa = await procesarVenta(metodoPago);
    
    if (ventaExitosa) {
        // Mostrar ticket
        mostrarTicket();
        
        // Limpiar carrito
        carrito = [];
        guardarCarrito();
        actualizarCarritoUI();
        
        // Actualizar lista de ventas
        cargarVentasHoy();
        
        // Actualizar dashboard si existe
        if (typeof SistemaBazar.cargarEstadisticasDashboard === 'function') {
            SistemaBazar.cargarEstadisticasDashboard();
        }
        
        // Actualizar productos rápidos
        actualizarProductosRapidos();
        
        SistemaBazar.mostrarMensaje('exito', 'Venta realizada con éxito');
    }
}

function mostrarConfirmacionVenta() {
    return new Promise((resolve) => {
        const total = document.getElementById('total-venta').textContent;
        const metodoPago = document.querySelector('input[name="pago"]:checked').value;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <i class="fas fa-cash-register fa-3x" style="color: #2ecc71; margin-bottom: 15px;"></i>
                    <h3 style="color: #2c3e50;">Confirmar Venta</h3>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p style="margin: 5px 0;">Total: <strong>${total}</strong></p>
                        <p style="margin: 5px 0;">Método: <strong>${metodoPago === 'efectivo' ? 'Efectivo' : 
                          metodoPago === 'tarjeta' ? 'Tarjeta' : 'Transferencia'}</strong></p>
                        <p style="margin: 5px 0;">Productos: <strong>${carrito.length}</strong></p>
                    </div>
                </div>
                <div style="display: flex; gap: 15px;">
                    <button id="confirmar-venta-si" class="btn-success" style="flex: 1;">
                        <i class="fas fa-check"></i> Confirmar
                    </button>
                    <button id="confirmar-venta-no" class="btn-secondary" style="flex: 1;">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        document.getElementById('confirmar-venta-si').addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });
        
        document.getElementById('confirmar-venta-no').addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });
    });
}

async function procesarVenta(metodoPago) {
    try {
        const productos = JSON.parse(localStorage.getItem('productos') || '[]');
        const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
        
        // Validar stock antes de procesar
        for (const item of carrito) {
            const producto = productos.find(p => p.id === item.id);
            if (!producto || producto.stock < item.cantidad) {
                SistemaBazar.mostrarMensaje('error', `Stock insuficiente para: ${item.nombre}`);
                return false;
            }
        }
        
        // Calcular totales
        const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const iva = subtotal * 0.21;
        const total = subtotal + iva;
        
        // Generar ID de venta
        const ventaId = parseInt(localStorage.getItem('contador_ventas') || '1000') + 1;
        
        // Crear objeto de venta
        const nuevaVenta = {
            id: ventaId,
            fecha: new Date().toISOString(),
            productos: carrito.map(item => ({
                id: item.id,
                cantidad: item.cantidad,
                precio: item.precio
            })),
            subtotal: subtotal,
            iva: iva,
            total: total,
            metodoPago: metodoPago,
            efectivoRecibido: metodoPago === 'efectivo' ? 
                parseFloat(document.getElementById('efectivo-recibido')?.value) : 0,
            vuelto: metodoPago === 'efectivo' ? 
                parseFloat(document.getElementById('efectivo-recibido')?.value) - total : 0
        };
        
        // Actualizar stock
        for (const item of carrito) {
            const index = productos.findIndex(p => p.id === item.id);
            if (index !== -1) {
                productos[index].stock -= item.cantidad;
            }
        }
        
        // Actualizar contador de ventas
        localStorage.setItem('contador_ventas', ventaId.toString());
        
        // Guardar datos actualizados
        localStorage.setItem('productos', JSON.stringify(productos));
        
        // Agregar venta a historial
        ventas.push(nuevaVenta);
        localStorage.setItem('ventas', JSON.stringify(ventas));

        // INTENTAR SINCRONIZAR CON BACKEND
        try {
            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaVenta)
            });
            if (response.ok) {
                console.log('Venta sincronizada con backend');
            } else {
                console.warn('No se pudo sincronizar venta con backend');
            }
        } catch (e) {
            console.warn('Error de red al sincronizar venta:', e);
        }
        
        return true;
        
    } catch (error) {
        console.error('Error procesando venta:', error);
        SistemaBazar.mostrarMensaje('error', 'Error al procesar la venta');
        return false;
    }
}

function cancelarVenta() {
    if (carrito.length === 0) {
        SistemaBazar.mostrarMensaje('info', 'No hay venta para cancelar');
        return;
    }
    
    const confirmar = confirm('¿Cancelar venta y vaciar carrito?');
    if (confirmar) {
        carrito = [];
        guardarCarrito();
        actualizarCarritoUI();
        SistemaBazar.mostrarMensaje('exito', 'Venta cancelada');
    }
}

function mostrarTicket() {
    const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
    const ultimaVenta = ventas[ventas.length - 1];
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    
    if (!ultimaVenta) return;
    
    // Formatear fecha
    const fecha = new Date(ultimaVenta.fecha);
    const fechaStr = fecha.toLocaleDateString('es-AR');
    const horaStr = fecha.toLocaleTimeString('es-AR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Actualizar contenido del ticket
    document.getElementById('ticket-fecha').textContent = `${fechaStr} ${horaStr}`;
    document.getElementById('ticket-id').textContent = ultimaVenta.id;
    document.getElementById('ticket-subtotal').textContent = `$${ultimaVenta.subtotal.toFixed(2)}`;
    document.getElementById('ticket-iva').textContent = `$${ultimaVenta.iva.toFixed(2)}`;
    document.getElementById('ticket-total').textContent = `$${ultimaVenta.total.toFixed(2)}`;
    document.getElementById('ticket-pago').textContent = 
        ultimaVenta.metodoPago === 'efectivo' ? 'Efectivo' :
        ultimaVenta.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Transferencia';
    
    // Listar productos
    const ticketItems = document.getElementById('ticket-items');
    ticketItems.innerHTML = '';
    
    ultimaVenta.productos.forEach(item => {
        const producto = productos.find(p => p.id === item.id);
        const nombre = producto ? producto.nombre : 'Producto no encontrado';
        const totalItem = item.precio * item.cantidad;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'ticket-item';
        itemDiv.innerHTML = `
            <div style="flex: 2;">
                <div>${nombre.substring(0, 20)}${nombre.length > 20 ? '...' : ''}</div>
                <div style="font-size: 0.8rem;">${item.cantidad} x $${item.precio.toFixed(2)}</div>
            </div>
            <div style="flex: 1; text-align: right; font-weight: 600;">
                $${totalItem.toFixed(2)}
            </div>
        `;
        ticketItems.appendChild(itemDiv);
    });
    
    // Mostrar modal
    document.getElementById('ticket-modal').style.display = 'flex';
}

function imprimirTicket() {
    const ticketContent = document.getElementById('ticket-impresion');
    const ventanaImpresion = window.open('', '_blank');
    
    ventanaImpresion.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket de Venta</title>
            <style>
                body { 
                    font-family: 'Courier New', monospace; 
                    margin: 0; 
                    padding: 10px;
                    font-size: 12px;
                }
                .ticket { 
                    width: 80mm; 
                    margin: 0 auto; 
                }
                .ticket-header { 
                    text-align: center; 
                    border-bottom: 1px dashed #000; 
                    padding-bottom: 10px; 
                    margin-bottom: 10px;
                }
                .ticket-header h4 { 
                    margin: 5px 0; 
                    font-size: 14px;
                }
                .ticket-item { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 5px;
                    border-bottom: 1px dashed #ccc;
                    padding-bottom: 5px;
                }
                .ticket-totales { 
                    border-top: 2px dashed #000; 
                    padding-top: 10px; 
                    margin-top: 10px; 
                }
                @media print {
                    body { margin: 0; padding: 0; }
                }
            </style>
        </head>
        <body>
            ${ticketContent.outerHTML}
        </body>
        </html>
    `);
    
    ventanaImpresion.document.close();
    setTimeout(() => {
        ventanaImpresion.print();
        ventanaImpresion.close();
    }, 500);
}

// Exportar funciones para otros módulos
window.VentasAPI = {
    agregarAlCarrito: window.agregarAlCarrito,
    obtenerVentasDelDia: () => {
        const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
        const hoy = new Date().toDateString();
        return ventas.filter(v => new Date(v.fecha).toDateString() === hoy);
    },
    obtenerTotalVentasHoy: () => {
        const ventasHoy = window.VentasAPI.obtenerVentasDelDia();
        return ventasHoy.reduce((total, venta) => total + venta.total, 0);
    }
};
