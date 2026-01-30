// CSV-PROCESSOR.JS - Procesamiento de archivos CSV y Excel

window.testImportacion = {
  resultados: [],
  csvData: `codigo,nombre,categoria,precio,stock,stockMinimo
001,Producto Test 1,General,100,50,10
002,Producto Test 2,Electronica,200,30,5
003,Producto Test 3,Ropa,50,100,20`,
  probarCSV: async function() {
    console.log('📊 Probando procesamiento CSV...');
    
    // Crear archivo desde datos CSV
    const blob = new Blob([this.csvData], { type: 'text/csv' });
    const file = new File([blob], 'test_importacion.csv', { type: 'text/csv' });
    
    // Llamar al procesador CSV
    if (window.csvProcessor && window.csvProcessor.processFile) {
      try {
        // csvProcessor.processFile devuelve un array directamente, no objeto
        const productos = await csvProcessor.processFile(file);
        
        console.log('✅ Datos procesados:', productos);
        console.log('📋 Productos importados:', productos.length);
        
        // Agregar resultado
        this.resultados.push({
          tipo: 'CSV',
          archivo: 'test_importacion.csv',
          productos: productos.length,
          fecha: new Date().toLocaleTimeString()
        });
        
        console.log('📈 Resultado CSV exitoso');
        return productos;
        
      } catch (error) {
        console.error('❌ Error procesando CSV:', error);
        return null;
      }
    } else {
      console.error('❌ csvProcessor no disponible');
      return null;
    }
  }
};

class CSVProcessor {
    static async procesarCSV(archivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const contenido = e.target.result;
                    const separador = document.getElementById('csv-separator').value;
                    const tieneEncabezados = document.getElementById('csv-headers').checked;
                    
                    const lineas = contenido.split('\n');
                    let datos = [];
                    
                    const inicio = tieneEncabezados ? 1 : 0;
                    for (let i = inicio; i < lineas.length; i++) {
                        if (lineas[i].trim() === '') continue;
                        
                        const columnas = lineas[i].split(separador).map(col => col.trim().replace(/"/g, ''));
                        
                        if (columnas.length >= 3) {
                            datos.push({
                                codigo: columnas[0] || ImportacionCore.generarCodigoAutomatico(),
                                nombre: columnas[1] || 'Sin nombre',
                                categoria: columnas[2] || 'General',
                                precio: parseFloat(columnas[3]) || 0,
                                stock: parseInt(columnas[4]) || 0,
                                stockMinimo: parseInt(columnas[5]) || 5
                            });
                        }
                    }
                    
                    ImportacionCore.productosImportar = datos;
                    resolve(datos);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsText(archivo);
        });
    }
    
    static async procesarExcel(archivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    const primeraHoja = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[primeraHoja];
                    const datos = XLSX.utils.sheet_to_json(worksheet);
                    
                    const productos = datos.map(item => ({
                        codigo: item.codigo || item.CODIGO || item.Código || ImportacionCore.generarCodigoAutomatico(),
                        nombre: item.nombre || item.NOMBRE || item.Nombre || item.descripcion || 'Sin nombre',
                        categoria: item.categoria || item.CATEGORIA || item.Categoría || 'General',
                        precio: parseFloat(item.precio || item['Precio Venta'] || item.PRECIO || item.Precio || 0),
                        costo: parseFloat(item.costo || item.Costo || item.COSTO || 0),
                        stock: parseInt(item.stock || item.STOCK || item.Stock || 0),
                        stockMinimo: parseInt(item.stockMinimo || item['Stock Mínimo'] || item.STOCK_MIN || 5),
                        unidad: item.unidad || item.Unidad || item.UNIDAD || 'un'
                    }));
                    
                    ImportacionCore.productosImportar = productos;
                    resolve(productos);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsArrayBuffer(archivo);
        });
    }
    
    static async manejarArchivoCSV(archivo) {
        if (!archivo) return;
        
        ImportacionCore.mostrarProgreso('Leyendo archivo CSV...', 10);
        
        try {
            const extension = archivo.name.split('.').pop().toLowerCase();
            
            if (extension === 'csv') {
                await CSVProcessor.procesarCSV(archivo);
            } else if (['xlsx', 'xls'].includes(extension)) {
                await this.procesarExcel(archivo);
            } else {
                throw new Error('Formato no soportado');
            }
            
            ImportacionCore.actualizarInfoArchivo('csv', archivo.name);
            return ImportacionCore.productosImportar;
        } catch (error) {
            console.error(`Error procesando CSV: ${error.message}`);
            throw error;
        } finally {
            ImportacionCore.ocultarProgreso();
        }
    }
}

window.csvProcessor = { processFile: CSVProcessor.manejarArchivoCSV };
window.CSVProcessor = CSVProcessor;