// IMPORT-MANAGER.JS - Gestión de la importación final

class ImportManager {
    static async ejecutarImportacion() {
        if (ImportacionCore.productosImportar.length === 0) {
            SistemaBazar.mostrarMensaje('error', 'No hay productos para importar');
            return;
        }
        
        const confirmar = await this.mostrarConfirmacionImportacion();
        if (!confirmar) return;
        
        ImportacionCore.importacionActiva = true;
        document.getElementById('progress-modal').style.display = 'flex';
        
        try {
            const productosExistentes = JSON.parse(localStorage.getItem('productos') || '[]');
            const actualizarExistentes = document.getElementById('csv-update').checked;
            
            let nuevos = 0;
            let actualizados = 0;
            let errores = 0;
            
            for (let i = 0; i < ImportacionCore.productosImportar.length; i++) {
                if (!ImportacionCore.importacionActiva) break;
                
                const producto = ImportacionCore.productosImportar[i];
                
                ImportacionCore.actualizarProgreso(
                    `Importando: ${producto.nombre}`, 
                    Math.floor((i / ImportacionCore.productosImportar.length) * 100),
                    ImportacionCore.productosImportar.length
                );
                
                try {
                    if (!producto.nombre || producto.precio <= 0) {
                        errores++;
                        continue;
                    }
                    
                    if (!producto.codigo || producto.codigo === 'SIN CÓDIGO') {
                        producto.codigo = ImportacionCore.generarCodigoAutomatico();
                    }
                    
                    const indexExistente = productosExistentes.findIndex(p => p.codigo === producto.codigo);
                    
                    if (indexExistente !== -1 && actualizarExistentes) {
                        productosExistentes[indexExistente] = {
                            ...productosExistentes[indexExistente],
                            nombre: producto.nombre,
                            precio: producto.precio,
                            categoria: producto.categoria || productosExistentes[indexExistente].categoria,
                            stock: (productosExistentes[indexExistente].stock || 0) + (producto.stock || 0)
                        };
                        actualizados++;
                    } else if (indexExistente === -1) {
                        const nuevoId = ImportacionCore.obtenerNuevoIdProducto();
                        productosExistentes.push({
                            id: nuevoId,
                            codigo: producto.codigo,
                            nombre: producto.nombre,
                            categoria: producto.categoria || 'General',
                            precio: producto.precio,
                            costo: producto.precio * 0.7,
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
            
            localStorage.setItem('productos', JSON.stringify(productosExistentes));
            
            // Sync with backend
            try {
                const url = typeof getApiUrl === 'function' ? getApiUrl('/api/products/sync') : `${API_CONFIG.BASE_URL}/api/products/sync`;
                await fetch(url, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(productosExistentes)
                });
            } catch (e) {
                console.error("Failed to sync imported products with backend", e);
            }

            HistoryManager.guardarEnHistorial({
                fecha: new Date().toISOString(),
                tipo: 'importacion',
                archivo: 'importacion_masiva.csv',
                nuevos: nuevos,
                actualizados: actualizados,
                errores: errores,
                total: ImportacionCore.productosImportar.length
            });
            
            ImportacionCore.mostrarResultados(nuevos, actualizados, errores);
            
            if (typeof window.ProductosAPI?.cargarProductos === 'function') {
                window.ProductosAPI.cargarProductos();
            }
            
            if (typeof SistemaBazar?.cargarEstadisticasDashboard === 'function') {
                SistemaBazar.cargarEstadisticasDashboard();
            }
            
        } catch (error) {
            SistemaBazar.mostrarMensaje('error', `Error en importación: ${error.message}`);
        } finally {
            ImportacionCore.importacionActiva = false;
            document.getElementById('progress-modal').style.display = 'none';
        }
    }
    
    static mostrarConfirmacionImportacion() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'flex';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <i class="fas fa-file-import fa-3x" style="color: #3498db;"></i>
                        <h3 style="margin: 15px 0;">Confirmar Importación</h3>
                        <p>Se importarán ${ImportacionCore.productosImportar.length} productos</p>
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
            
            const productosExistentes = JSON.parse(localStorage.getItem('productos') || '[]');
            let nuevos = 0;
            let actualizaciones = 0;
            
            ImportacionCore.productosImportar.forEach(producto => {
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
}

window.ImportManager = ImportManager;