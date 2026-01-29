// HISTORY-MANAGER.JS - Gestión del historial

class HistoryManager {
    static cargarHistorial() {
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
    
    static guardarEnHistorial(datos) {
        const historial = JSON.parse(localStorage.getItem('historial_importaciones') || '[]');
        historial.push(datos);
        localStorage.setItem('historial_importaciones', JSON.stringify(historial));
        this.cargarHistorial();
    }
}

window.HistoryManager = HistoryManager;
