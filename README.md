# Sistema de Gestión LolaShop

Sistema integral para la gestión de productos, inventario, ventas y gastos de comercio. Desarrollado con tecnologías web modernas y un backend robusto en Node.js.

![LolaShop Dashboard](https://via.placeholder.com/800x400?text=Sistema+de+Gestion+LolaShop)

##  Características Principales

###  Gestión de Productos
- **Inventario Completo**: Alta, baja y modificación de productos.
- **Precios Múltiples**: Soporte para hasta 4 listas de precios por producto.
- **Unidades de Medida**: Venta por unidad o peso (kg, lt).
- **Importación/Exportación**: Carga masiva desde Excel/CSV y reportes exportables.
- **Scraping de Precios**: (En desarrollo) Actualización automática de precios de competidores.

###  Ventas y Caja
- **Punto de Venta (POS)**: Interfaz ágil para cargar ventas.
- **Buscador Inteligente**: Búsqueda rápida por código de barras o nombre.
- **Tickets**: Generación de comprobantes de venta.

###  Administración y Finanzas
- **Control de Gastos**: Registro de gastos operativos (alquiler, servicios, etc.).
- **Clientes y Proveedores**: Gestión de cuentas corrientes (Backend preparado).
- **Reportes**: Visualización de ventas y stock.

##  Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5.
- **Backend**: Node.js, Express.js.
- **Base de Datos**: SQLite (Ligera, sin configuración, archivo `database.sqlite`).
- **Despliegue**: Docker & Docker Compose.

## 🏁 Guía de Inicio Rápido

### Requisitos Previos
- Tener instalado **Node.js** (v18 o superior).
- Opcional: **Docker Desktop** si prefieres usar contenedores.

### Opción 1: Ejecución Directa (Windows)

Simplemente ejecuta el archivo incluido:
```bash
start_backend.bat
```
Este script instalará automáticamente las dependencias necesarias e iniciará el servidor y la base de datos.

### Opción 2: Instalación Manual

1. **Backend**:
   ```bash
   cd backend-node
   npm install
   node init_db.js  # Inicializa la base de datos
   node server.js   # Inicia el servidor
   ```
   El servidor correrá en `http://localhost:8000`.

2. **Frontend**:
   Abre el archivo `public/index.html` en tu navegador o usa un servidor local (Live Server).

### Opción 3: Docker (Recomendado)

Si tienes Docker instalado:
```bash
docker-compose up --build
```
Todo el sistema se levantará automáticamente.

## 🧪 Testing

El proyecto incluye scripts de prueba para verificar la integridad del sistema:

- **Test de Terminal**: Ejecuta `node test_terminal.js` en la raíz para un diagnóstico rápido de conexión, archivos y base de datos.

## 📂 Estructura del Proyecto

```
/
├── backend-node/       # Servidor Node.js y Base de Datos
│   ├── server.js       # Lógica principal del servidor
│   ├── init_db.js      # Script de inicialización de DB
│   └── database.sqlite # Archivo de base de datos
├── public/             # Frontend (HTML/JS/CSS)
│   ├── js/             # Lógica de cliente
│   ├── css/            # Estilos
│   └── *.html          # Páginas del sistema
├── docker-compose.yml  # Configuración Docker
└── start_backend.bat   # Script de inicio automático
```

## 📄 Licencia

Este proyecto es de uso privado para LolaShop.
