// API-PROCESSOR.JS - Gestión de importación desde API
class ApiProcessor {
    static async manejarImportacionAPI() {
        const url = document.getElementById('api-url').value;
        const key = document.getElementById('api-key').value;
        const mapping = {
            codigo: document.getElementById('map-codigo').value,
            nombre: document.getElementById('map-nombre').value,
            precio: document.getElementById('map-precio').value,
            stock: document.getElementById('map-stock').value,
            root: document.getElementById('map-root').value
        };

        if (!url) {
            alert('Por favor ingrese la URL de la API');
            return;
        }

        try {
            document.body.style.cursor = 'wait';
            
            // Call Backend to fetch and map data
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/products/import/from-api`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    api_key: key,
                    mapping: mapping
                })
            });

            const result = await response.json();
            
            if (result.success) {
                ImportManager.setProductos(result.data);
                ImportManager.setFuente(`API: ${url}`);
                alert(`Se obtuvieron ${result.data.length} productos de la API`);
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error al conectar con el backend de importación');
        } finally {
            document.body.style.cursor = 'default';
        }
    }
}
