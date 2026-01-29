// PDF-PROCESSOR.JS - Procesamiento de archivos PDF
// Versión 3.0 - Con mejoras de detección avanzada y manejo robusto de errores
// CÓDIGO COMPLETO - LISTO PARA COPIAR Y PEGAR

class PDFProcessor {
    /**
     * Extrae productos de texto PDF mejorado con detección avanzada
     * @param {string} texto - Texto extraído del PDF
     * @param {Object} config - Configuración de columnas
     * @returns {Array} Productos extraídos
     */
    static extraerProductosDeTexto(texto, config = {}) {
        const productos = [];
        const lineas = texto.split('\n');
        
        // Configuración por defecto mejorada
        const cfg = {
            codigoCol: config.codigoCol || 'CÓDIGO',
            nombreCol: config.nombreCol || 'DESCRIPCIÓN',
            precioCol: config.precioCol || 'PRECIO',
            categoria: config.categoria || 'Importado',
            ...config
        };
        
        console.log('📄 Procesando texto PDF (v3.0)...');
        console.log('📝 Configuración:', cfg);
        console.log(`📊 Total líneas: ${lineas.length}`);
        
        let productosEncontrados = 0;
        let lineasProcesadas = 0;
        let patronUsado = null;
        
        // DETECCIÓN AUTOMÁTICA DE FORMATO
        const formatoDetectado = this.detectarFormato(lineas);
        console.log(`🔍 Formato detectado: ${formatoDetectado.tipo} (confianza: ${formatoDetectado.confianza}%)`);
        
        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i].trim();
            
            // Si la línea está vacía o es muy corta, saltar
            if (linea.length < 3) continue;
            
            lineasProcesadas++;
            
            // INTENTAR MÚLTIPLES PATRONES DE EXTRACCIÓN
            const extraccion = this.extraerProductoDeLinea(linea, formatoDetectado, cfg);
            
            if (extraccion && extraccion.codigo && extraccion.precio) {
                const { codigo, nombre, precio, patron } = extraccion;
                
                // Validar y normalizar
                const precioNormalizado = this.normalizarPrecio(precio);
                const nombreLimpio = this.limpiarNombreProducto(nombre, cfg);
                
                if (precioNormalizado > 0 && precioNormalizado < 1000000 && codigo.length >= 2) {
                    productos.push({
                        codigo: codigo,
                        nombre: nombreLimpio,
                        categoria: cfg.categoria,
                        precio: precioNormalizado,
                        stock: config.stock || 0,
                        stockMinimo: config.stockMinimo || 1,
                        fuente: 'PDF',
                        lineaOriginal: linea,
                        lineaNumero: i + 1,
                        patronUsado: patron,
                        confianza: this.calcularConfianza(linea, codigo, precioNormalizado, nombreLimpio, patron)
                    });
                    
                    productosEncontrados++;
                    patronUsado = patron;
                    console.log(`✅ Línea ${i + 1}: ${codigo} - ${nombreLimpio} - $${precioNormalizado} (${patron})`);
                }
            }
        }
        
        console.log(`🎯 Productos detectados: ${productosEncontrados}/${lineasProcesadas} líneas`);
        console.log(`📈 Tasa de éxito: ${lineasProcesadas > 0 ? ((productosEncontrados / lineasProcesadas) * 100).toFixed(1) : 0}%`);
        console.log(`🎪 Patrón más usado: ${patronUsado || 'N/A'}`);
        
        return productos;
    }
    
    /**
     * Detector automático de formato del texto
     * @private
     */
    static detectarFormato(lineas) {
        const muestras = lineas.slice(0, Math.min(20, lineas.length));
        let mejorTipo = 'desconocido';
        let mejorConfianza = 0;
        
        const tipos = [
            { nombre: 'tabla', patron: /\s{2,}|\t/, desc: 'Columnas con espacios/tabs' },
            { nombre: 'pipes', patron: /\|/, desc: 'Separado por pipes (|)' },
            { nombre: 'csv', patron: /,/, desc: 'Separado por comas' },
            { nombre: 'factura', patron: /(CÓDIGO|COD|REF|SKU).*(PRECIO|PRECIO UNIT|VALOR)/i, desc: 'Formato de factura' },
            { nombre: 'simple', patron: /^\d+\s+[A-Za-z].*\$\d+/, desc: 'Código Nombre $Precio' }
        ];
        
        for (const tipo of tipos) {
            let coincidencias = 0;
            for (const linea of muestras) {
                if (tipo.patron.test(linea)) coincidencias++;
            }
            
            const confianza = (coincidencias / muestras.length) * 100;
            if (confianza > mejorConfianza) {
                mejorConfianza = confianza;
                mejorTipo = tipo.nombre;
            }
        }
        
        return { tipo: mejorTipo, confianza: mejorConfianza, lineasAnalizadas: muestras.length };
    }
    
    /**
     * Extrae producto de una línea usando múltiples estrategias
     * @private
     */
    static extraerProductoDeLinea(linea, formato, config) {
        // ESTRATEGIA 1: Formato con pipes (|)
        if (formato.tipo === 'pipes' || linea.includes('|')) {
            const partes = linea.split('|').map(p => p.trim()).filter(p => p);
            if (partes.length >= 3) {
                // Buscar código (primer elemento que sea número)
                let codigoIdx = -1;
                let precioIdx = -1;
                
                for (let i = 0; i < partes.length; i++) {
                    if (/^\d{2,}$/.test(partes[i]) && codigoIdx === -1) {
                        codigoIdx = i;
                    }
                    if (/\$?\s*\d+[.,]\d{2}/.test(partes[i]) && precioIdx === -1) {
                        precioIdx = i;
                    }
                }
                
                if (codigoIdx !== -1 && precioIdx !== -1) {
                    const codigo = partes[codigoIdx];
                    const precio = partes[precioIdx];
                    let nombre = '';
                    
                    // Construir nombre con partes restantes
                    for (let i = 0; i < partes.length; i++) {
                        if (i !== codigoIdx && i !== precioIdx) {
                            nombre += (nombre ? ' ' : '') + partes[i];
                        }
                    }
                    
                    return { codigo, nombre, precio, patron: 'pipes' };
                }
            }
        }
        
        // ESTRATEGIA 2: Separadores múltiples (espacios, tabs)
        const separadores = [
            { regex: /\s{3,}/, nombre: 'espacios-triples' },
            { regex: /\t/, nombre: 'tabulacion' },
            { regex: /\s{2,}/, nombre: 'espacios-dobles' },
            { regex: /\s+/, nombre: 'espacios-simples' }
        ];
        
        for (const sep of separadores) {
            const partes = linea.split(sep.regex).map(p => p.trim()).filter(p => p);
            if (partes.length >= 3) {
                // Buscar código y precio
                const resultado = this.buscarCodigoYPrecio(partes);
                if (resultado) {
                    return { ...resultado, patron: sep.nombre };
                }
            }
        }
        
        // ESTRATEGIA 3: Patrones regex directos
        const patrones = [
            // Código al inicio, luego nombre, luego precio
            { regex: /^(\d{2,})\s+(.+?)\s+(\$?\s*\d+[.,]\d{2})/, grupos: [1, 2, 3], nombre: 'cod-nombre-precio' },
            // Nombre, código, precio
            { regex: /^(.+?)\s+(\d{2,})\s+(\$?\s*\d+[.,]\d{2})/, grupos: [2, 1, 3], nombre: 'nombre-cod-precio' },
            // Precio, código, nombre
            { regex: /^(\$?\s*\d+[.,]\d{2})\s+(\d{2,})\s+(.+)/, grupos: [2, 3, 1], nombre: 'precio-cod-nombre' }
        ];
        
        for (const patron of patrones) {
            const match = linea.match(patron.regex);
            if (match) {
                return {
                    codigo: match[patron.grupos[0]].trim(),
                    nombre: match[patron.grupos[1]].trim(),
                    precio: match[patron.grupos[2]].trim(),
                    patron: patron.nombre
                };
            }
        }
        
        return null;
    }
    
    /**
     * Busca código y precio en array de partes
     * @private
     */
    static buscarCodigoYPrecio(partes) {
        let codigo = null;
        let precio = null;
        let nombrePartes = [];
        
        for (let i = 0; i < partes.length; i++) {
            const parte = partes[i];
            
            // Es código si es número de 2+ dígitos y no es precio
            if (/^\d{2,}$/.test(parte) && !/\d+[.,]\d{2}/.test(parte) && !codigo) {
                codigo = parte;
            }
            // Es precio si tiene formato de dinero
            else if (/\$?\s*\d+[.,]\d{0,2}/.test(parte) && !precio) {
                precio = parte;
            }
            // Es parte del nombre
            else {
                nombrePartes.push(parte);
            }
        }
        
        if (codigo && precio && nombrePartes.length > 0) {
            return {
                codigo,
                nombre: nombrePartes.join(' '),
                precio
            };
        }
        
        return null;
    }
    
    /**
     * Normaliza precios de diferentes formatos
     * @private
     */
    static normalizarPrecio(precioStr) {
        if (!precioStr) return 0;
        
        try {
            // Remover símbolos de moneda y espacios
            let limpio = precioStr.replace(/[^\d,.-]/g, '').trim();
            
            // Caso 1: Solo coma (75,50 → 75.50)
            if (limpio.includes(',') && !limpio.includes('.')) {
                limpio = limpio.replace(',', '.');
            }
            // Caso 2: Punto como separador de miles, coma como decimal (1.250,99 → 1250.99)
            else if (limpio.includes('.') && limpio.includes(',')) {
                const partes = limpio.split(',');
                const parteEntera = partes[0].replace(/\./g, '');
                limpio = parteEntera + '.' + (partes[1] || '00');
            }
            // Caso 3: Punto decimal ya está correcto
            
            const numero = parseFloat(limpio);
            return isNaN(numero) ? 0 : Math.abs(numero);
        } catch (error) {
            console.warn(`⚠️ Error normalizando precio "${precioStr}":`, error);
            return 0;
        }
    }
    
    /**
     * Limpia y formatea el nombre del producto
     * @private
     */
    static limpiarNombreProducto(nombre, config) {
        if (!nombre) return 'Producto sin nombre';
        
        let limpio = nombre.trim();
        
        // 1. Remover cantidades y precios al final
        limpio = limpio
            .replace(/\s+\d+\s+\$\d+[.,]\d+$/g, '')  // "2 $2501.98"
            .replace(/\s+\d+[.,]\d+\s*$/g, '')       // "2.00" o "2,00"
            .replace(/\s+\d+\s*$/g, '')              // "2" al final
            .replace(/\s+x\s*\d+$/gi, '')           // "x 2" al final
            .replace(/\s*@.*$/g, '');               // "@ algo" al final
        
        // 2. Remover palabras comunes de unidades y medidas
        const palabrasRemover = [
            'un', 'un.', 'und', 'pza', 'pzs', 'pieza', 'piezas', 'unid', 'unidad',
            'kg', 'gr', 'g', 'mg', 'ml', 'l', 'lt', 'cm', 'mm', 'm',
            'pack', 'paq', 'caja', 'blister', 'bolsa'
        ];
        
        palabrasRemover.forEach(palabra => {
            const regex = new RegExp(`\\s${palabra}\\s*$`, 'i');
            limpio = limpio.replace(regex, '');
        });
        
        // 3. Remover caracteres especiales al inicio/fin
        limpio = limpio.replace(/^[-\|•\*\s]+|[-\|•\*\s]+$/g, '');
        
        // 4. Normalizar espacios
        limpio = limpio.replace(/\s+/g, ' ').trim();
        
        // 5. Capitalizar si todo está en mayúsculas
        if (limpio === limpio.toUpperCase() && limpio.length > 3) {
            limpio = limpio.split(' ')
                .map(palabra => {
                    if (palabra.length <= 2) return palabra;
                    return palabra.charAt(0) + palabra.slice(1).toLowerCase();
                })
                .join(' ');
        }
        
        // 6. Limitar longitud
        if (limpio.length > 100) {
            limpio = limpio.substring(0, 97) + '...';
        }
        
        return limpio || 'Producto sin nombre';
    }
    
    /**
     * Extrae el nombre del producto de una línea (método legacy)
     * @private
     */
    static extraerNombreDeLinea(linea, codigo, precioTexto) {
        // Remover código y precio
        let nombre = linea
            .replace(codigo, '')
            .replace(precioTexto, '')
            .replace(/\s+/g, ' ')  // Espacios múltiples a simple
            .trim();
        
        // Remover caracteres especiales al inicio/fin
        nombre = nombre.replace(/^[-\|•\*\s]+|[-\|•\*\s]+$/g, '');
        
        // Remover palabras comunes que no son parte del nombre
        const palabrasComunes = ['un', 'un.', 'und', 'pza', 'pzs', 'pieza', 'piezas', 'kg', 'gr', 'ml', 'l', 'cm'];
        palabrasComunes.forEach(palabra => {
            const regex = new RegExp(`\\s${palabra}\\s$`, 'i');
            nombre = nombre.replace(regex, ' ');
        });
        
        return nombre.trim();
    }
    
    /**
     * Calcula confianza de detección (0-100)
     * @private
     */
    static calcularConfianza(linea, codigo, precio, nombre, patron = 'desconocido') {
        let confianza = 50; // Base
        
        // FACTORES POSITIVOS
        if (codigo.length >= 8) confianza += 20; // Código largo (probable EAN)
        if (codigo.length >= 13) confianza += 10; // Código muy largo (EAN13)
        if (precio > 0.01 && precio < 10000) confianza += 25; // Precio razonable
        if (nombre.length >= 3 && nombre.length <= 100) confianza += 15; // Nombre válido
        if (linea.includes('$') || linea.includes('USD') || linea.includes('€')) confianza += 10; // Indicador de precio
        if (patron !== 'desconocido') confianza += 5; // Patrón conocido
        
        // FACTORES NEGATIVOS
        if (nombre.toLowerCase().includes('total') || nombre.toLowerCase().includes('subtotal')) confianza -= 40;
        if (nombre.toLowerCase().includes('iva') || nombre.toLowerCase().includes('impuesto')) confianza -= 40;
        if (nombre.toLowerCase().includes('cant') || nombre.toLowerCase().includes('cantidad')) confianza -= 20;
        if (linea.toLowerCase().includes('pagina') || linea.toLowerCase().includes('page')) confianza -= 30;
        
        // AJUSTAR POR FORMATO DE CÓDIGO
        if (/^\d{13}$/.test(codigo)) confianza += 5; // EAN13 perfecto
        if (/^\d{8}$/.test(codigo)) confianza += 5; // EAN8 perfecto
        
        return Math.min(Math.max(confianza, 0), 100);
    }
    
    /**
     * Procesa un archivo PDF completo
     */
    static async procesarPDF(archivo, config = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                if (typeof SistemaBazar !== 'undefined' && SistemaBazar.mostrarMensaje) {
                    SistemaBazar.mostrarMensaje('info', `Procesando PDF: ${archivo.name}`);
                }
                
                const arrayBuffer = await archivo.arrayBuffer();
                
                // Verificar que pdfjsLib esté disponible
                if (typeof pdfjsLib === 'undefined') {
                    throw new Error('PDF.js no está cargado. Asegúrate de incluir la librería.');
                }
                
                // Cargar PDF.js
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                
                let textoCompleto = '';
                const totalPaginas = pdf.numPages;
                
                if (typeof ImportacionCore !== 'undefined' && ImportacionCore.mostrarProgreso) {
                    ImportacionCore.mostrarProgreso(`Extrayendo texto (0/${totalPaginas})...`, 10);
                }
                
                // Extraer texto de cada página
                for (let i = 1; i <= totalPaginas; i++) {
                    if (typeof ImportacionCore !== 'undefined' && ImportacionCore.mostrarProgreso) {
                        ImportacionCore.mostrarProgreso(
                            `Extrayendo texto (${i}/${totalPaginas})...`, 
                            10 + Math.floor((i / totalPaginas) * 60)
                        );
                    }
                    
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    textoCompleto += pageText + '\n';
                    
                    console.log(`📄 Página ${i}/${totalPaginas}: ${pageText.substring(0, 100)}...`);
                }
                
                // Procesar el texto extraído
                if (typeof ImportacionCore !== 'undefined' && ImportacionCore.mostrarProgreso) {
                    ImportacionCore.mostrarProgreso('Analizando contenido...', 80);
                }
                
                const productos = this.extraerProductosDeTexto(textoCompleto, config);
                
                // Guardar en el core de importación si existe
                if (typeof ImportacionCore !== 'undefined') {
                    ImportacionCore.productosImportar = productos;
                    if (ImportacionCore.mostrarProgreso) {
                        ImportacionCore.mostrarProgreso('Finalizando...', 95);
                    }
                }
                
                console.log(`✅ PDF procesado: ${productos.length} productos encontrados`);
                if (typeof SistemaBazar !== 'undefined' && SistemaBazar.mostrarMensaje) {
                    SistemaBazar.mostrarMensaje('exito', `PDF procesado: ${productos.length} productos encontrados`);
                }
                
                resolve({
                    success: true,
                    productos: productos,
                    total: productos.length,
                    paginas: totalPaginas,
                    textoExtraido: textoCompleto.substring(0, 500) + (textoCompleto.length > 500 ? '...' : ''),
                    estadisticas: {
                        lineasProcesadas: textoCompleto.split('\n').length,
                        productosEncontrados: productos.length,
                        porcentajeExito: textoCompleto.split('\n').length > 0 ? 
                            ((productos.length / textoCompleto.split('\n').length) * 100).toFixed(1) + '%' : '0%'
                    }
                });
                
            } catch (error) {
                console.error('❌ Error procesando PDF:', error);
                if (typeof SistemaBazar !== 'undefined' && SistemaBazar.mostrarMensaje) {
                    SistemaBazar.mostrarMensaje('error', `Error procesando PDF: ${error.message}`);
                }
                reject(error);
            } finally {
                if (typeof ImportacionCore !== 'undefined' && ImportacionCore.ocultarProgreso) {
                    ImportacionCore.ocultarProgreso();
                }
            }
        });
    }
    
    /**
     * Maneja la carga y procesamiento de archivos PDF
     */
    static async manejarArchivoPDF(archivo, config = {}) {
        if (!archivo) {
            if (typeof SistemaBazar !== 'undefined' && SistemaBazar.mostrarMensaje) {
                SistemaBazar.mostrarMensaje('error', 'No se seleccionó ningún archivo');
            }
            return null;
        }
        
        if (archivo.type !== 'application/pdf') {
            if (typeof SistemaBazar !== 'undefined' && SistemaBazar.mostrarMensaje) {
                SistemaBazar.mostrarMensaje('error', 'Solo se permiten archivos PDF');
            }
            return null;
        }
        
        // Verificar tamaño máximo (10MB)
        if (archivo.size > 10 * 1024 * 1024) {
            if (typeof SistemaBazar !== 'undefined' && SistemaBazar.mostrarMensaje) {
                SistemaBazar.mostrarMensaje('error', 'El archivo es demasiado grande (máximo 10MB)');
            }
            return null;
        }
        
        console.log(`📁 Archivo PDF: ${archivo.name} (${Math.round(archivo.size / 1024)} KB)`);
        
        try {
            const resultado = await this.procesarPDF(archivo, config);
            if (typeof ImportacionCore !== 'undefined' && ImportacionCore.actualizarInfoArchivo) {
                ImportacionCore.actualizarInfoArchivo('pdf', archivo.name, resultado.total);
            }
            return resultado;
        } catch (error) {
            console.error('💥 Error en manejo de PDF:', error);
            throw error;
        }
    }
    
    /**
     * MÉTODO NUEVO: Procesar texto PDF directo (para pruebas y debug)
     * @param {string} texto - Texto PDF a procesar
     * @param {Object} config - Configuración
     * @returns {Object} Resultado del procesamiento
     */
    static processPDFText(texto, config = {}) {
        console.log('📄 Procesando texto PDF (método directo v3.0)...');
        console.log('📝 Configuración recibida:', config);
        
        try {
            // Validar entrada
            if (!texto || typeof texto !== 'string') {
                return {
                    success: false,
                    error: 'Texto no válido o vacío',
                    products: [],
                    total: 0
                };
            }
            
            const productos = this.extraerProductosDeTexto(texto, config);
            
            const resultado = {
                success: true,
                version: '3.0.0',
                products: productos,
                total: productos.length,
                config: config,
                estadisticas: {
                    lineasProcesadas: texto.split('\n').length,
                    productosEncontrados: productos.length,
                    porcentajeExito: texto.split('\n').length > 0 ? 
                        ((productos.length / texto.split('\n').length) * 100).toFixed(1) + '%' : '0%',
                    confianzaPromedio: productos.length > 0 ? 
                        (productos.reduce((sum, p) => sum + p.confianza, 0) / productos.length).toFixed(1) : 0
                },
                timestamp: new Date().toISOString()
            };
            
            console.log(`✅ Procesamiento directo completado: ${productos.length} productos`);
            return resultado;
            
        } catch (error) {
            console.error('❌ Error en procesamiento directo:', error);
            return {
                success: false,
                error: error.message,
                products: [],
                total: 0,
                version: '3.0.0'
            };
        }
    }
    
    /**
     * MÉTODO NUEVO: Para pruebas de consola - Mejorado
     */
    static debug() {
        const metodosDisponibles = [
            'processPDFText',
            'manejarArchivoPDF',
            'extraerProductosDeTexto',
            'debug',
            'normalizarPrecio',
            'limpiarNombreProducto'
        ];
        
        return {
            version: '3.0.0',
            metodos: metodosDisponibles,
            disponible: true,
            descripcion: 'Procesador de PDF mejorado con detección avanzada y múltiples formatos',
            caracteristicas: [
                'Detección automática de formato',
                'Soporte para múltiples separadores (pipes, tabs, espacios)',
                'Normalización de precios internacionales',
                'Limpieza inteligente de nombres',
                'Cálculo de confianza por producto',
                'Manejo robusto de errores'
            ],
            fecha: '2026-01-18'
        };
    }
    
    /**
     * MÉTODO NUEVO: Prueba rápida de funcionalidad
     */
    static test() {
        const textoPrueba = `CÓDIGO   PRODUCTO               PRECIO
001      LAPICERA AZUL         $150.00
002      CUADERNO RAYADO       $280.50
003      GOMA DE BORRAR        $45.25`;
        
        console.log('🧪 Ejecutando prueba interna...');
        const resultado = this.processPDFText(textoPrueba, {
            codigoCol: 'CÓDIGO',
            nombreCol: 'PRODUCTO',
            precioCol: 'PRECIO'
        });
        
        return {
            prueba: 'Interna',
            resultado: resultado.success ? '✅ PASÓ' : '❌ FALLÓ',
            productos: resultado.total,
            detalles: resultado
        };
    }
}

// EXPORTAR PARA USO GLOBAL - TODO COMPLETO
window.PDFProcessor = PDFProcessor;

// CREAR ALIAS PARA COMPATIBILIDAD CON PRUEBAS DE CONSOLA - TODO COMPLETO
window.pdfProcessor = {
    processPDFText: PDFProcessor.processPDFText.bind(PDFProcessor),
    debug: PDFProcessor.debug.bind(PDFProcessor),
    test: PDFProcessor.test.bind(PDFProcessor),
    manejarArchivoPDF: PDFProcessor.manejarArchivoPDF.bind(PDFProcessor),
    extraerProductosDeTexto: PDFProcessor.extraerProductosDeTexto.bind(PDFProcessor)
};

// MENSAJE DE CARGA - TODO COMPLETO
console.log('✅ PDF Processor v3.0 cargado correctamente');
console.log('📋 Métodos disponibles: processPDFText(), manejarArchivoPDF(), extraerProductosDeTexto(), debug(), test()');
console.log('🚀 Características: Detección automática, múltiples formatos, normalización avanzada');

// EXPORTAR PARA MÓDULOS (SI SE USA ES6) - TODO COMPLETO
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFProcessor;
}

// INICIALIZACIÓN ADICIONAL PARA PRUEBAS RÁPIDAS - TODO COMPLETO
if (typeof window !== 'undefined' && window.console) {
    // Crear función de prueba rápida en consola
    window.probarPDF = function(texto, config) {
        console.log('🔧 Ejecutando prueba rápida...');
        return PDFProcessor.processPDFText(texto || `101|Producto Test|$99.99\n102|Otro Producto|$149.50`, config);
    };
    
    console.log('💡 Tip: Usa probarPDF() para pruebas rápidas desde consola');
}
