const API_CONFIG = {
    // Detect if we are in a local environment (file:// or localhost) or production
    // If localhost, use the Python backend port 8000
    // If production (Vercel), use the relative path /api which will be rewritten to the backend function
    BASE_URL: (window.location.protocol === 'file:' || 
               window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1') 
               ? 'http://localhost:8000' 
               : '' 
};

// Helper to get full API URL
function getApiUrl(endpoint) {
    // Ensure endpoint starts with / if not present (unless it's a full URL)
    if (endpoint.startsWith('http')) return endpoint;
    if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
    
    // If BASE_URL is empty (production), we might want to ensure /api prefix if not present
    // But our backend defines routes like /api/products/...
    // So if the endpoint passed is /api/products/..., and BASE_URL is empty, result is /api/products/... (correct for relative)
    // If BASE_URL is http://localhost:8000, result is http://localhost:8000/api/products/... (correct)
    
    return `${API_CONFIG.BASE_URL}${endpoint}`;
}
