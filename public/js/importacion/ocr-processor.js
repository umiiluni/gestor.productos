// OCR-PROCESSOR.JS - Procesamiento OCR para PDFs escaneados

class OCRProcessor {
    static async procesarOCR(archivos) {
        ImportacionCore.mostrarProgreso('Iniciando reconocimiento OCR...', 0);
        
        try {
            const tesseract = Tesseract.create({
                workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@4.0.2/dist/worker.min.js',
                langPath: 'https://tessdata.projectnaptha.com/4.0.0',
                corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@4.0.2/tesseract-core.wasm.js',
            });
            
            let textoCompleto = '';
            const idioma = document.getElementById('ocr-language').value;
            const calidad = document.getElementById('ocr-quality').value;
            
            for (let i = 0; i < archivos.length; i++) {
                const archivo = archivos[i];
                
                ImportacionCore.actualizarProgreso(
                    `Procesando archivo ${i + 1}/${archivos.length}...`, 
                    Math.floor((i / archivos.length) * 100),
                    archivos.length
                );
                
                const resultado = await tesseract.recognize(archivo, idioma, {
                    logger: m => console.log(m)
                });
                
                textoCompleto += resultado.data.text + '\n';
            }
            
            // Usar el mismo procesador de PDF para extraer productos
            const productos = PDFProcessor.extraerProductosDeTexto(textoCompleto);
            ImportacionCore.productosImportar = productos;
            return productos;
        } catch (error) {
            throw error;
        }
    }
    
    static async manejarArchivoOCR(archivos) {
        if (!archivos || archivos.length === 0) return;
        
        try {
            await this.procesarOCR(archivos);
            ImportacionCore.actualizarInfoArchivo('ocr', `${archivos.length} archivo(s)`);
            return ImportacionCore.productosImportar;
        } catch (error) {
            SistemaBazar.mostrarMensaje('error', `Error en OCR: ${error.message}`);
            throw error;
        } finally {
            ImportacionCore.ocultarProgreso();
        }
    }
}

window.OCRProcessor = OCRProcessor;