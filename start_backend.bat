@echo off
echo ==========================================
echo      INICIANDO SERVIDOR BACKEND (NODE.JS)
echo ==========================================
echo.
echo Navegando a la carpeta backend-node...
cd backend-node
echo.
echo Instalando dependencias (si faltan)...
call npm install
echo.
echo Inicializando base de datos (si es necesario)...
node init_db.js
echo.
echo Ejecutando Servidor...
echo El servidor estara disponible en: http://localhost:8000
echo.
node server.js
