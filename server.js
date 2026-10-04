const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.fbx': 'application/octet-stream',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Quitar ?query y decodificar %20 (hay archivos con espacios, ej. "Button Click  Sound Effect.mp3")
    let urlPath;
    try {
        urlPath = decodeURIComponent(req.url.split('?')[0]);
    } catch (e) {
        res.writeHead(400);
        res.end('URL inválida');
        return;
    }

    let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);

    // Seguridad: no servir nada fuera de la carpeta del juego
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Acceso denegado');
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Archivo no encontrado</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Error del servidor: ' + error.code, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║        🏜️  ECOS DE CHILE: ATACAMA - SERVIDOR ACTIVO         ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
    console.log('');
    console.log('📋 Instrucciones:');
    console.log('   1. Abre tu navegador');
    console.log(`   2. Ve a: http://localhost:${PORT}`);
    console.log('   3. ¡Disfruta el juego!');
    console.log('');
    console.log('⏹️  Para detener: Presiona Ctrl + C');
    console.log('');
});
