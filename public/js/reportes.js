// SISTEMA BAZAR ARGENTINA - REPORTES.JS
// Lógica para reportes y estadísticas

document.addEventListener('DOMContentLoaded', () => {
    inicializarReportes();
});

let charts = {};
let ultimoTopProductos = [];

function inicializarReportes() {
    console.log('Módulo de reportes inicializado');
    configurarFiltros();
    configurarExportaciones();
    actualizarDashboard();
}

function configurarFiltros() {
    const filtroPeriodo = document.getElementById('filtro-periodo');
    const btnActualizar = document.getElementById('btn-actualizar');
    
    if (filtroPeriodo) {
        filtroPeriodo.addEventListener('change', actualizarDashboard);
    }
    
    if (btnActualizar) {
        btnActualizar.addEventListener('click', () => {
            const icon = btnActualizar.querySelector('i');
            icon.classList.add('fa-spin');
            actualizarDashboard();
            setTimeout(() => icon.classList.remove('fa-spin'), 500);
        });
    }
}

function configurarExportaciones() {
    const btnExportarReporte = document.getElementById('btn-exportar-reporte');
    const btnExportTop = document.getElementById('btn-export-top');
    if (btnExportarReporte) {
        btnExportarReporte.addEventListener('click', exportarReporteCompleto);
    }
    if (btnExportTop) {
        btnExportTop.addEventListener('click', exportarTopProductos);
    }
}

function obtenerVentasFiltradas(periodo) {
    const todasLasVentas = JSON.parse(localStorage.getItem('ventas') || '[]');
    const ahora = new Date();
    const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    
    return todasLasVentas.filter(venta => {
        const fechaVenta = new Date(venta.fecha);
        
        switch(periodo) {
            case 'hoy':
                return fechaVenta >= inicioDia;
            case 'semana':
                const semanaAtras = new Date(ahora);
                semanaAtras.setDate(ahora.getDate() - 7);
                return fechaVenta >= semanaAtras;
            case 'mes':
                return fechaVenta.getMonth() === ahora.getMonth() && 
                       fechaVenta.getFullYear() === ahora.getFullYear();
            case 'anio':
                return fechaVenta.getFullYear() === ahora.getFullYear();
            case 'todo':
            default:
                return true;
        }
    });
}

function actualizarDashboard() {
    const periodo = document.getElementById('filtro-periodo').value;
    const ventas = obtenerVentasFiltradas(periodo);
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    
    actualizarKPIs(ventas, productos);
    actualizarGraficos(ventas, periodo);
    actualizarTopProductos(ventas, productos);
}

function actualizarKPIs(ventas, productos) {
    // 1. Ventas Totales
    const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
    document.getElementById('kpi-ventas').textContent = `$${totalVentas.toFixed(2)}`;
    
    // 2. Transacciones
    document.getElementById('kpi-transacciones').textContent = ventas.length;
    
    // 3. Productos Vendidos
    const totalProductosVendidos = ventas.reduce((sum, v) => sum + v.productos.length, 0); // Asumiendo que v.productos es array de items
    // Si v.productos tiene cantidad, deberíamos sumar cantidad. 
    // Revisando ventas.js: carrito tiene {cantidad: N}.
    // ventas guardadas tienen v.productos = carrito snapshot.
    const itemsReales = ventas.reduce((sum, v) => {
        return sum + v.productos.reduce((sub, p) => sub + (p.cantidad || 1), 0);
    }, 0);
    
    document.getElementById('kpi-productos').textContent = itemsReales;
    
    // 4. Stock Bajo
    const stockBajo = productos.filter(p => p.stock <= p.stockMinimo).length;
    document.getElementById('kpi-stock-bajo').textContent = stockBajo;
}

function actualizarGraficos(ventas, periodo) {
    actualizarGraficoTiempo(ventas, periodo);
    actualizarGraficoCategorias(ventas);
}

function actualizarGraficoTiempo(ventas, periodo) {
    const ctx = document.getElementById('chart-ventas-tiempo');
    if (!ctx) return;
    
    // Agrupar ventas por fecha
    const datosAgrupados = {};
    
    ventas.forEach(venta => {
        const fecha = new Date(venta.fecha);
        let key;
        
        if (periodo === 'hoy') {
            key = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        } else {
            key = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
        }
        
        datosAgrupados[key] = (datosAgrupados[key] || 0) + venta.total;
    });
    
    const labels = Object.keys(datosAgrupados);
    const data = Object.values(datosAgrupados);
    
    if (charts.tiempo) {
        charts.tiempo.destroy();
    }
    
    charts.tiempo = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas ($)',
                data: data,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function actualizarGraficoCategorias(ventas) {
    const ctx = document.getElementById('chart-categorias');
    if (!ctx) return;
    
    const categorias = {};
    
    ventas.forEach(venta => {
        venta.productos.forEach(item => {
            // Necesitamos la categoría del producto.
            // Si no está en el item de venta, podríamos necesitar buscarla en productos
            // Pero en ventas.js: carrito tiene {id, codigo, nombre, precio, cantidad}. NO tiene categoria.
            // Debemos buscar la categoría en los productos globales.
            const productosGlobales = JSON.parse(localStorage.getItem('productos') || '[]');
            const productoInfo = productosGlobales.find(p => p.id === item.id);
            const cat = productoInfo ? productoInfo.categoria : 'Desconocido';
            
            const monto = item.precio * item.cantidad;
            categorias[cat] = (categorias[cat] || 0) + monto;
        });
    });
    
    const labels = Object.keys(categorias);
    const data = Object.values(categorias);
    
    if (charts.categorias) {
        charts.categorias.destroy();
    }
    
    charts.categorias = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#2ecc71', '#3498db', '#9b59b6', '#f1c40f', '#e74c3c', '#95a5a6'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}

function actualizarTopProductos(ventas, productosGlobales) {
    const productoVentas = {};
    
    ventas.forEach(venta => {
        venta.productos.forEach(item => {
            if (!productoVentas[item.id]) {
                productoVentas[item.id] = {
                    id: item.id,
                    nombre: item.nombre,
                    cantidad: 0,
                    total: 0
                };
            }
            productoVentas[item.id].cantidad += item.cantidad;
            productoVentas[item.id].total += (item.precio * item.cantidad);
        });
    });
    
    // Convertir a array y ordenar
    const topProductos = Object.values(productoVentas)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10); // Top 10
    ultimoTopProductos = topProductos;
        
    const tbody = document.querySelector('#tabla-top-productos tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    topProductos.forEach(prod => {
        const info = productosGlobales.find(p => p.id === prod.id);
        const categoria = info ? info.categoria : '-';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${prod.nombre}</td>
            <td><span class="badge-categoria">${categoria}</span></td>
            <td>${prod.cantidad}</td>
            <td>$${prod.total.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Aplicar estilos badge si no existen (copiados de productos.js)
    if (!document.getElementById('estilos-badges-reportes')) {
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
        `;
        style.id = 'estilos-badges-reportes';
        document.head.appendChild(style);
    }
}

function exportarReporteCompleto() {
    const periodo = document.getElementById('filtro-periodo').value;
    const ventas = obtenerVentasFiltradas(periodo);
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    if (!ventas.length) {
        if (window.SistemaBazar && SistemaBazar.mostrarMensaje) {
            SistemaBazar.mostrarMensaje('warning', 'No hay ventas en el periodo seleccionado');
        } else {
            alert('No hay ventas en el periodo seleccionado');
        }
        return;
    }
    const datosVentas = ventas.map(v => {
        const fecha = new Date(v.fecha);
        const cantidadItems = v.productos.reduce((sum, p) => sum + (p.cantidad || 1), 0);
        return {
            Fecha: fecha.toLocaleString('es-AR'),
            Total: v.total,
            Items: cantidadItems
        };
    });
    const wb = XLSX.utils.book_new();
    const wsVentas = XLSX.utils.json_to_sheet(datosVentas);
    
    // Ajustar columnas Ventas
    wsVentas['!cols'] = [
        { wch: 20 }, // Fecha
        { wch: 12 }, // Total
        { wch: 8 }   // Items
    ];
    
    XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas');
    if (ultimoTopProductos && ultimoTopProductos.length) {
        const productosGlobales = JSON.parse(localStorage.getItem('productos') || '[]');
        const datosTop = ultimoTopProductos.map(prod => {
            const info = productosGlobales.find(p => p.id === prod.id);
            return {
                Producto: prod.nombre,
                Categoria: info ? info.categoria : '-',
                Vendidos: prod.cantidad,
                Ingresos: prod.total
            };
        });
        const wsTop = XLSX.utils.json_to_sheet(datosTop);
        
        // Ajustar columnas Top
        wsTop['!cols'] = [
            { wch: 40 }, // Producto
            { wch: 15 }, // Categoria
            { wch: 10 }, // Vendidos
            { wch: 12 }  // Ingresos
        ];
        
        XLSX.utils.book_append_sheet(wb, wsTop, 'Top Productos');
    }
    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Reporte_ventas_${fecha}.xlsx`);
    if (window.SistemaBazar && SistemaBazar.mostrarMensaje) {
        SistemaBazar.mostrarMensaje('exito', 'Reporte exportado a Excel');
    }
}

function exportarTopProductos() {
    const periodo = document.getElementById('filtro-periodo').value;
    const ventas = obtenerVentasFiltradas(periodo);
    if (!ventas.length) {
        if (window.SistemaBazar && SistemaBazar.mostrarMensaje) {
            SistemaBazar.mostrarMensaje('warning', 'No hay ventas para exportar');
        } else {
            alert('No hay ventas para exportar');
        }
        return;
    }
    const productosGlobales = JSON.parse(localStorage.getItem('productos') || '[]');
    const productoVentas = {};
    ventas.forEach(venta => {
        venta.productos.forEach(item => {
            if (!productoVentas[item.id]) {
                productoVentas[item.id] = {
                    id: item.id,
                    nombre: item.nombre,
                    cantidad: 0,
                    total: 0
                };
            }
            productoVentas[item.id].cantidad += item.cantidad;
            productoVentas[item.id].total += (item.precio * item.cantidad);
        });
    });
    const topProductos = Object.values(productoVentas)
        .sort((a, b) => b.total - a.total)
        .slice(0, 50);
    if (!topProductos.length) {
        if (window.SistemaBazar && SistemaBazar.mostrarMensaje) {
            SistemaBazar.mostrarMensaje('warning', 'No hay productos para exportar');
        } else {
            alert('No hay productos para exportar');
        }
        return;
    }
    const datosTop = topProductos.map(prod => {
        const info = productosGlobales.find(p => p.id === prod.id);
        return {
            Producto: prod.nombre,
            Categoria: info ? info.categoria : '-',
            Vendidos: prod.cantidad,
            Ingresos: prod.total
        };
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosTop);
    XLSX.utils.book_append_sheet(wb, ws, 'Top Productos');
    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Top_productos_${fecha}.xlsx`);
    if (window.SistemaBazar && SistemaBazar.mostrarMensaje) {
        SistemaBazar.mostrarMensaje('exito', 'Top de productos exportado a Excel');
    }
}
