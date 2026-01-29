// SISTEMA BAZAR ARGENTINA - SCANNER.JS
// Manejo de escáner de código de barras

class ScannerBarras {
    constructor() {
        this.videoElement = null;
        this.canvasElement = null;
        this.stream = null;
        this.scanning = false;
        this.lastScanned = '';
        this.scanCooldown = 2000; // 2 segundos entre escaneos
    }
    
    inicializar(videoId = 'scanner-video', canvasId = 'scanner-canvas') {
        this.videoElement = document.getElementById(videoId);
        this.canvasElement = document.getElementById(canvasId);
        
        if (!this.videoElement || !this.canvasElement) {
            console.error('Elementos de scanner no encontrados');
            return false;
        }
        
        return true;
    }
    
    async iniciarScanner() {
        try {
            // Solicitar acceso a la cámara
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Usar cámara trasera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();
            
            this.scanning = true;
            this.escanearContinuamente();
            
            return true;
        } catch (error) {
            console.error('Error al acceder a la cámara:', error);
            this.mostrarError('No se pudo acceder a la cámara. Verifica los permisos.');
            return false;
        }
    }
    
    detenerScanner() {
        this.scanning = false;
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
    }
    
    escanearContinuamente() {
        if (!this.scanning) return;
        
        const context = this.canvasElement.getContext('2d');
        const { videoWidth, videoHeight } = this.videoElement;
        
        // Configurar canvas
        this.canvasElement.width = videoWidth;
        this.canvasElement.height = videoHeight;
        
        // Dibujar frame actual
        context.drawImage(this.videoElement, 0, 0, videoWidth, videoHeight);
        
        // Obtener imagen para procesar
        const imageData = context.getImageData(0, 0, videoWidth, videoHeight);
        
        // Intentar detectar código de barras
        const codigo = this.detectarCodigoBarras(imageData);
        
        if (codigo && codigo !== this.lastScanned) {
            this.lastScanned = codigo;
            this.manejarCodigoEscaneado(codigo);
            
            // Cooldown para evitar múltiples lecturas
            setTimeout(() => {
                this.lastScanned = '';
            }, this.scanCooldown);
        }
        
        // Continuar escaneo
        requestAnimationFrame(() => this.escanearContinuamente());
    }
    
    detectarCodigoBarras(imageData) {
        // SIMULACIÓN: En producción usarías una librería como QuaggaJS o ZXing
        // Por ahora simulamos detección basada en patrones simples
        
        const { width, height, data } = imageData;
        const lineas = [];
        
        // Buscar patrones de barras oscuras y claras
        for (let y = Math.floor(height / 2) - 10; y < Math.floor(height / 2) + 10; y++) {
            let barras = [];
            let barraActual = { color: null, inicio: 0 };
            
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const luminosidad = (r + g + b) / 3;
                const esOscuro = luminosidad < 128;
                
                if (barraActual.color === null) {
                    barraActual.color = esOscuro ? 'oscuro' : 'claro';
                    barraActual.inicio = x;
                } else if ((esOscuro && barraActual.color !== 'oscuro') || 
                          (!esOscuro && barraActual.color !== 'claro')) {
                    barras.push({
                        ...barraActual,
                        fin: x,
                        ancho: x - barraActual.inicio
                    });
                    barraActual = { color: esOscuro ? 'oscuro' : 'claro', inicio: x };
                }
            }
            
            if (barras.length > 20) { // Patrón mínimo para código de barras
                lineas.push(barras);
            }
        }
        
        // Si encontramos patrones similares en varias líneas, probablemente sea un código
        if (lineas.length > 5) {
            // Generar código aleatorio para simulación
            return '7' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
        }
        
        return null;
    }
    
    manejarCodigoEscaneado(codigo) {
        console.log('Código escaneado:', codigo);
        
        // Buscar producto en la base de datos
        const productos = JSON.parse(localStorage.getItem('productos') || '[]');
        const producto = productos.find(p => p.codigo === codigo);
        
        // Mostrar resultado
        const resultadoDiv = document.getElementById('scanner-resultado');
        if (resultadoDiv) {
            if (producto) {
                resultadoDiv.innerHTML = `
                    <div class="scanner-producto-info">
                        <div class="scanner-producto-img">
                            <i class="fas fa-box"></i>
                        </div>
                        <div class="scanner-producto-details">
                            <h4>${producto.nombre}</h4>
                            <p>Código: ${producto.codigo}</p>
                            <p>Precio: $${producto.precio.toFixed(2)} | Stock: ${producto.stock}</p>
                        </div>
                    </div>
                `;
                
                // Emitir evento personalizado
                const evento = new CustomEvent('codigoEscaneado', {
                    detail: { codigo, producto }
                });
                document.dispatchEvent(evento);
                
                SistemaBazar.mostrarMensaje('exito', `Producto encontrado: ${producto.nombre}`);
            } else {
                resultadoDiv.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #e74c3c;">
                        <i class="fas fa-exclamation-triangle fa-2x"></i>
                        <p style="margin-top: 10px;">Producto no encontrado</p>
                        <p>Código: ${codigo}</p>
                    </div>
                `;
                
                SistemaBazar.mostrarMensaje('error', 'Producto no encontrado en la base de datos');
            }
        }
        
        // Beep sonido (simulado)
        this.reproducirBeep();
    }
    
    reproducirBeep() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 1000;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Sonido no disponible');
        }
    }
    
    mostrarError(mensaje) {
        SistemaBazar.mostrarMensaje('error', mensaje);
    }
    
    escanearDesdeInput() {
        const input = document.getElementById('input-codigo-barra');
        if (input && input.value.trim() !== '') {
            const codigo = input.value.trim();
            this.manejarCodigoEscaneado(codigo);
            input.value = '';
            input.focus();
        }
    }
}

// Inicialización global del scanner
let scannerGlobal = null;

document.addEventListener('DOMContentLoaded', function() {
    scannerGlobal = new ScannerBarras();
    
    // Configurar botones de scanner en productos.html
    const btnEscanear = document.getElementById('btn-escanear');
    if (btnEscanear) {
        btnEscanear.addEventListener('click', function() {
            abrirModalScanner();
        });
    }
    
    const btnBuscarCodigo = document.getElementById('btn-buscar-codigo');
    if (btnBuscarCodigo) {
        btnBuscarCodigo.addEventListener('click', function() {
            if (scannerGlobal) {
                scannerGlobal.escanearDesdeInput();
            }
        });
    }
    
    const inputCodigo = document.getElementById('input-codigo-barra');
    if (inputCodigo) {
        inputCodigo.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (scannerGlobal) {
                    scannerGlobal.escanearDesdeInput();
                }
            }
        });
    }
    
    // Configurar scanner para ventas
    const btnEscanearVenta = document.getElementById('btn-escanear-venta');
    if (btnEscanearVenta) {
        btnEscanearVenta.addEventListener('click', function() {
            abrirModalScanner('ventas');
        });
    }
    
    const btnAgregarVenta = document.getElementById('btn-agregar-venta');
    if (btnAgregarVenta) {
        btnAgregarVenta.addEventListener('click', function() {
            console.log('Click en boton agregar venta');
            const input = document.getElementById('venta-codigo-barra');
            if (input && input.value.trim() !== '') {
                console.log('Input tiene valor:', input.value);
                const codigo = input.value.trim();
                try {
                    if (typeof window.buscarYAgregarProductoVentaV2 === 'function') {
                        window.buscarYAgregarProductoVentaV2(codigo);
                    } else if (typeof buscarYAgregarProductoVenta === 'function') {
                         // Fallback old
                         buscarYAgregarProductoVenta(codigo);
                    } else {
                        console.error('buscarYAgregarProductoVentaV2 no es una funcion');
                    }
                } catch (e) {
                    console.error('Error llamando funcion:', e);
                }
                input.value = '';
                input.focus();
            } else {
                console.log('Input vacio o no encontrado');
            }
        });
    }
    
    const inputVentaCodigo = document.getElementById('venta-codigo-barra');
    if (inputVentaCodigo) {
        inputVentaCodigo.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const codigo = this.value.trim();
                if (codigo) {
                    buscarYAgregarProductoVenta(codigo);
                    this.value = '';
                    this.focus();
                }
            }
        });
    }
    
    // Configurar cierre de modales
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                cerrarModalScanner();
            }
        });
    });
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            cerrarModalScanner();
        }
    });
});

function abrirModalScanner(tipo = 'productos') {
    const modalId = tipo === 'ventas' ? 'scanner-modal-ventas' : 'scanner-modal';
    const modal = document.getElementById(modalId);
    
    if (modal) {
        modal.style.display = 'flex';
        
        // Iniciar scanner después de un breve delay
        setTimeout(() => {
            if (scannerGlobal) {
                scannerGlobal.inicializar(
                    tipo === 'ventas' ? 'scanner-video-ventas' : 'scanner-video',
                    'scanner-canvas'
                ).then(success => {
                    if (success) {
                        scannerGlobal.iniciarScanner();
                    }
                });
            }
        }, 500);
    }
}

function cerrarModalScanner() {
    const modales = document.querySelectorAll('.modal');
    modales.forEach(modal => {
        modal.style.display = 'none';
    });
    
    if (scannerGlobal) {
        scannerGlobal.detenerScanner();
    }
}

function buscarYAgregarProductoVenta(codigo) {
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    const producto = productos.find(p => p.codigo === codigo);
    
    if (producto) {
        // Agregar al carrito de ventas
        if (typeof window.agregarAlCarrito === 'function') {
            window.agregarAlCarrito(producto.id, 1);
            SistemaBazar.mostrarMensaje('exito', `${producto.nombre} agregado al carrito`);
        } else {
            console.log('Producto encontrado:', producto);
            SistemaBazar.mostrarMensaje('exito', `Producto: ${producto.nombre} - $${producto.precio.toFixed(2)}`);
        }
    } else {
        SistemaBazar.mostrarMensaje('error', 'Producto no encontrado');
    }
}

// Escuchar eventos de código escaneado
document.addEventListener('codigoEscaneado', function(e) {
    const { codigo, producto } = e.detail;
    console.log('Evento recibido:', codigo, producto);
    
    // Actualizar campo de código si existe
    const inputCodigo = document.getElementById('codigo');
    if (inputCodigo && !inputCodigo.value) {
        inputCodigo.value = codigo;
    }
    
    // Rellenar formulario si el producto existe
    if (producto) {
        rellenarFormularioProducto(producto);
    }
});

function rellenarFormularioProducto(producto) {
    const campos = {
        'producto-id': producto.id,
        'codigo': producto.codigo,
        'nombre': producto.nombre,
        'categoria': producto.categoria,
        'precio': producto.precio,
        'costo': producto.costo,
        'stock': producto.stock,
        'stock-minimo': producto.stockMinimo
    };
    
    Object.keys(campos).forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.value = campos[id];
        }
    });
    
    // Mostrar formulario si está oculto
    const formContainer = document.getElementById('form-producto');
    if (formContainer && formContainer.style.display === 'none') {
        formContainer.style.display = 'block';
        window.scrollTo(0, formContainer.offsetTop - 100);
    }
}

// API para otros módulos
window.ScannerAPI = {
    abrirScanner: abrirModalScanner,
    cerrarScanner: cerrarModalScanner,
    buscarCodigo: buscarYAgregarProductoVenta
};
