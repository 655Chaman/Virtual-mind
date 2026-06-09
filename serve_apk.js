const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;

const server = http.createServer((req, res) => {
    if (req.url === '/virtual-mind.apk') {
        const filePath = path.join(__dirname, 'virtual-mind.apk');
        const stat = fs.statSync(filePath);
        
        res.writeHead(200, {
            'Content-Type': 'application/vnd.android.package-archive',
            'Content-Length': stat.size,
            'Content-Disposition': 'attachment; filename=virtual-mind.apk'
        });
        
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    } else {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<html><body>');
        res.write('<h1>Virtual Mind Downloader</h1>');
        res.write('<a href="/virtual-mind.apk" style="font-size: 40px; padding: 20px; display: block; background: #c9a84c; color: black; text-align: center; text-decoration: none; border-radius: 10px; margin: 20px;">DOWNLOAD APK HERE</a>');
        res.write('<p>If tapping the button shows a white screen, long press it and select "Download link"</p>');
        res.write('</body></html>');
        res.end();
    }
});

server.listen(port, () => {
    console.log(`Download server running at http://0.0.0.0:${port}/`);
});
