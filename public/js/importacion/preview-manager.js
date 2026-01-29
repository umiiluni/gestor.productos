// PREVIEW-MANAGER.JS - Gestión de la previsualización

class PreviewManager {
    static actualizarPrevisualizacion() {
        const tabla = document.getElementById('preview-table');
        if (!tabla) return;
        
        const tbody = tabla.querySelector('tbody');
        tbody.innerHTML = '';
        
        const productosExistentes = JSON.parse(localStorage.getItem('productos') || '[]');
        
        let nuevos = 0;
        let actualizaciones = 0;
        
        ImportacionCore.productosImportar.forEach((producto, index) => {
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
        
        document.getElementById('preview-count').textContent = `${ImportacionCore.productosImportar.length} productos detectados`;
        document.getElementById('preview-new').textContent = `${nuevos} nuevos`;
        document.getElementById('preview-update').textContent = `${actualizaciones} actualizaciones`;
    }
    
    static limpiarPrevisualizacion() {
        ImportacionCore.productosImportar = [];
        const tbody = document.querySelector('#preview-table tbody');
        if (tbody) tbody.innerHTML = '';
        
        document.getElementById('preview-count').textContent = '0 productos detectados';
        document.getElementById('preview-new').textContent = '0 nuevos';
        document.getElementById('preview-update').textContent = '0 actualizaciones';
    }
    
    static editarProductoPrevisualizacion(index) {
        const producto = ImportacionCore.productosImportar[index];
        if (!producto) return;
        
        const nuevoNombre = prompt('Nuevo nombre:', producto.nombre);
        if (nuevoNombre !== null) {
            producto.nombre = nuevoNombre;
        }
        
        const nuevoPrecio = prompt('Nuevo precio:', producto.precio);
        if (nuevoPrecio !== null && !isNaN(parseFloat(nuevoPrecio))) {
            producto.precio = parseFloat(nuevoPrecio);
        }
        
        this.actualizarPrevisualizacion();
    }
    
    static eliminarProductoPrevisualizacion(index) {
        const confirmar = confirm('¿Eliminar este producto de la importación?');
        if (confirmar) {
            ImportacionCore.productosImportar.splice(index, 1);
            this.actualizarPrevisualizacion();
            SistemaBazar.mostrarMensaje('exito', 'Producto eliminado de la importación');
        }
    }
}

window.PreviewManager = PreviewManager;