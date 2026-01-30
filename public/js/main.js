// SISTEMA BAZAR ARGENTINA - MAIN.JS
// Archivo principal para funcionalidades generales

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar sistema
    inicializarSistema();
    
    // Cargar estadísticas del dashboard
    cargarEstadisticasDashboard();
    
    // Cargar ventas recientes
    cargarVentasRecientes();
    
    // Configurar fecha y hora actual
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 60000);
    
    // Event listener para navegación
    configurarNavegacion();
    
    // Configurar notificaciones
    configurarNotificaciones();
});

function inicializarSistema() {
    console.log('Sistema Bazar Argentina iniciado');
    
    // Verificar si hay datos guardados
    if (!localStorage.getItem('sistema_inicializado')) {
        inicializarDatosPorDefecto();
    }
}

function inicializarDatosPorDefecto() {
    console.log('Inicializando datos por defecto...');
    
    // Productos de ejemplo
    const productosEjemplo = [
        {
            id: 1,
            codigo: '7501234567890',
            nombre: 'Arroz Gallo Oro 1kg',
            categoria: 'Alimentos',
            precio: 450.50,
            costo: 350.00,
            stock: 50,
            stockMinimo: 10,
            fechaCreacion: new Date().toISOString()
        },
        {
            id: 2,
            codigo: '7791234567891',
            nombre: 'Aceite Cocinero 1.5L',
            categoria: 'Alimentos',
            precio: 1200.00,
            costo: 900.00,
            stock: 30,
            stockMinimo: 5,
            fechaCreacion: new Date().toISOString()
        },
        {
            id: 3,
            codigo: '7791234567892',
            nombre: 'Detergente Magistral 500ml',
            categoria: 'Limpieza',
            precio: 350.75,
            costo: 250.00,
            stock: 15,
            stockMinimo: 8,
            fechaCreacion: new Date().toISOString()
        },
        {
            id: 4,
            codigo: '7791234567893',
            nombre: 'Coca-Cola 2.25L',
            categoria: 'Bebidas',
            precio: 800.00,
            costo: 600.00,
            stock: 40,
            stockMinimo: 12,
            fechaCreacion: new Date().toISOString()
        },
        {
            id: 5,
            codigo: '7791234567894',
            nombre: 'Galletas Oreo 117g',
            categoria: 'Alimentos',
            precio: 320.00,
            costo: 220.00,
            stock: 8,
            stockMinimo: 15,
            fechaCreacion: new Date().toISOString()
        }
    ];
    
    // Ventas de ejemplo
    const ventasEjemplo = [
        {
            id: 1001,
            fecha: new Date().toISOString(),
            productos: [
                { id: 1, cantidad: 2, precio: 450.50 },
                { id: 4, cantidad: 1, precio: 800.00 }
            ],
            subtotal: 1701.00,
            iva: 357.21,
            total: 2058.21,
            metodoPago: 'efectivo',
            efectivoRecibido: 2100.00,
            vuelto: 41.79
        },
        {
            id: 1002,
            fecha: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hora
            productos: [
                { id: 2, cantidad: 1, precio: 1200.00 },
                { id: 3, cantidad: 2, precio: 350.75 }
            ],
            subtotal: 1901.50,
            iva: 399.32,
            total: 2300.82,
            metodoPago: 'tarjeta',
            efectivoRecibido: 0,
            vuelto: 0
        }
    ];
    
    // Guardar datos
    localStorage.setItem('productos', JSON.stringify(productosEjemplo));
    localStorage.setItem('ventas', JSON.stringify(ventasEjemplo));
    localStorage.setItem('contador_productos', '5');
    localStorage.setItem('contador_ventas', '1002');
    localStorage.setItem('sistema_inicializado', 'true');
    
    console.log('Datos por defecto inicializados');
}

function cargarEstadisticasDashboard() {
    // Verificar si estamos en el dashboard
    if (!document.getElementById('total-productos')) return;

    // Obtener datos
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
    
    // Calcular estadísticas
    const hoy = new Date().toDateString();
    const ventasHoy = ventas.filter(v => new Date(v.fecha).toDateString() === hoy);
    const ingresosHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);
    const bajoStock = productos.filter(p => p.stock <= p.stockMinimo).length;
    
    // Actualizar UI
    document.getElementById('total-productos').textContent = productos.length;
    document.getElementById('ventas-hoy').textContent = ventasHoy.length;
    document.getElementById('ingresos-hoy').textContent = `$${ingresosHoy.toFixed(2)}`;
    document.getElementById('bajo-stock').textContent = bajoStock;
}

function cargarVentasRecientes() {
    const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    
    // Ordenar por fecha (más reciente primero)
    ventas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    const tabla = document.getElementById('tabla-ventas-recientes');
    if (!tabla) return;
    
    const tbody = tabla.querySelector('tbody');
    tbody.innerHTML = '';
    
    // Mostrar solo las últimas 5 ventas
    ventas.slice(0, 5).forEach(venta => {
        const fecha = new Date(venta.fecha);
        const hora = fecha.toLocaleTimeString('es-AR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Obtener nombres de productos
        const nombresProductos = venta.productos.map(p => {
            const producto = productos.find(prod => prod.id === p.id);
            return producto ? producto.nombre : 'Producto no encontrado';
        }).join(', ');
        
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>#${venta.id}</td>
            <td>${nombresProductos.substring(0, 30)}${nombresProductos.length > 30 ? '...' : ''}</td>
            <td>${venta.productos.reduce((sum, p) => sum + p.cantidad, 0)}</td>
            <td>$${venta.total.toFixed(2)}</td>
            <td>${fecha.toLocaleDateString('es-AR')} ${hora}</td>
        `;
        tbody.appendChild(fila);
    });
}

function actualizarFechaHora() {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const hora = ahora.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Actualizar en el footer si existe
    const footer = document.querySelector('footer p');
    if (footer && !footer.innerHTML.includes('Versión')) {
        footer.innerHTML = `${fecha} - ${hora} | Sistema Bazar Argentina`;
    }
}

function configurarNavegacion() {
    // Resaltar enlace activo
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function configurarNotificaciones() {
    // Verificar bajo stock cada 5 minutos
    setInterval(() => {
        const productos = JSON.parse(localStorage.getItem('productos') || '[]');
        const bajoStock = productos.filter(p => p.stock <= p.stockMinimo);
        
        if (bajoStock.length > 0 && Notification.permission === 'granted') {
            new Notification('Alerta de Stock Bajo', {
                body: `Hay ${bajoStock.length} productos con stock bajo`,
                icon: '/img/logo.png'
            });
        }
    }, 300000);
    
    // Solicitar permiso para notificaciones
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Funciones de utilidad
function formatoMoneda(monto) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(monto);
}

function generarIdUnico(prefijo = '') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefijo}${timestamp}${random}`;
}

function mostrarMensaje(tipo, texto, duracion = 3000) {
    // Crear elemento de mensaje
    const mensaje = document.createElement('div');
    mensaje.className = `mensaje mensaje-${tipo}`;
    mensaje.innerHTML = `
        <i class="fas fa-${tipo === 'exito' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${texto}</span>
    `;
    
    // Estilos
    mensaje.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${tipo === 'exito' ? '#d4edda' : '#f8d7da'};
        color: ${tipo === 'exito' ? '#155724' : '#721c24'};
        border: 1px solid ${tipo === 'exito' ? '#c3e6cb' : '#f5c6cb'};
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    // Animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(mensaje);
    
    // Auto-eliminar
    setTimeout(() => {
        mensaje.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => mensaje.remove(), 300);
    }, duracion);
}

// Exportar funciones para uso en otros archivos
window.SistemaBazar = {
    formatoMoneda,
    generarIdUnico,
    mostrarMensaje,
    cargarEstadisticasDashboard
};
