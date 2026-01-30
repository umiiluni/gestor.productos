const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // HTML content simulating an invoice with various formats to test OCR robustness
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; }
      .header { text-align: center; margin-bottom: 30px; }
      .meta { margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
      th { background-color: #f2f2f2; }
      .total { text-align: right; margin-top: 20px; font-weight: bold; font-size: 1.2em; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>FACTURA ELECTRÓNICA</h1>
      <p>PROVEEDOR DE PRUEBA S.A.</p>
      <p>RUT: 12.345.678-9</p>
    </div>
    
    <div class="meta">
      <p><strong>Fecha:</strong> 30/01/2026</p>
      <p><strong>N° Factura:</strong> F-00012345</p>
      <p><strong>Cliente:</strong> IMPORTADORA TECNORED</p>
    </div>

    <table>
      <thead>
        <tr>
          <th>CÓDIGO</th>
          <th>DESCRIPCIÓN</th>
          <th>CANT.</th>
          <th>PRECIO UNIT.</th>
          <th>TOTAL</th>
        </tr>
      </thead>
      <tbody>
        <!-- Caso 1: Formato estándar simple -->
        <tr>
          <td>PROD-001</td>
          <td>Teclado Mecánico RGB</td>
          <td>10</td>
          <td>$ 45.000</td>
          <td>$ 450.000</td>
        </tr>
        
        <!-- Caso 2: Formato con decimales y punto de miles (Europeo/Latino) -->
        <tr>
          <td>MS-500</td>
          <td>Mouse Gamer Pro Wireless</td>
          <td>5</td>
          <td>$ 25.990,50</td>
          <td>$ 129.952,50</td>
        </tr>

        <!-- Caso 3: Formato inglés (coma miles, punto decimal) -->
        <tr>
          <td>MON-27</td>
          <td>Monitor IPS 27 Pulgadas 144Hz</td>
          <td>2</td>
          <td>$ 1,200.00</td>
          <td>$ 2,400.00</td>
        </tr>

        <!-- Caso 4: Código numérico y descripción larga -->
        <tr>
          <td>885909</td>
          <td>Cable HDMI 2.1 Ultra High Speed 4K/120Hz 2m Mallado</td>
          <td>50</td>
          <td>$ 1.500</td>
          <td>$ 75.000</td>
        </tr>
      </tbody>
    </table>

    <div class="total">
      <p>NETO: $ 654.952</p>
      <p>IVA (19%): $ 124.441</p>
      <p>TOTAL A PAGAR: $ 779.393</p>
    </div>
  </body>
  </html>
  `;

  await page.setContent(htmlContent);
  
  // Save to public folder so it can be accessed via localhost
  const outputPath = path.join(__dirname, '../public/factura_test.pdf');
  
  await page.pdf({ path: outputPath, format: 'A4' });

  await browser.close();
  console.log('PDF generado exitosamente en:', outputPath);
})();
