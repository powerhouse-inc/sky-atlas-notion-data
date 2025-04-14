import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';

export function AtlasDataHtml() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Atlas Data</title>
      </head>
      <body>
        <div>AtlasDataHtml</div>
      </body>
    </html>
  );
}

const html = `<!DOCTYPE html>${renderToString(<AtlasDataHtml />)}`;

// Save the HTML to a file
const outputPath = path.join(process.cwd(), 'data', 'atlas-data.html');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html);

console.log(`HTML file saved to: ${outputPath}`);
