const QRCode = require('qrcode');
const fs = require('fs');
const http = require('http');
const url = require('url');

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'

const template = "BEGIN:VCALENDAR\n"+
    "VERSION:2.0\n"+
    "BEGIN:VEVENT\n"+
    "SUMMARY;CHARSET=utf-8:{summary}\n"+
    "LOCATION;CHARSET=utf-8:{location}\n"+
    "DTSTART:{start}\n"+
    "DTEND:{end}\n"+
    "END:VEVENT\n"+
    "END:VCALENDAR";

http.createServer((req, res) => {

    const path = url.parse(req.url,true).pathname;

    if (path == '/app.js'){
        const queries = url.parse(req.url,true).query;

        var event = template
            .replace("{summary}", queries.summary)
            .replace("{location}", queries.location)
            .replace("{start}", queries.start)
            .replace("{end}", queries.end);
        console.log(event);

        QRCode.toFile('./qrcode.png', event);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<html><body><img src="./qrcode.png"/></body></html>');
        res.end();
    }
    else
    if (path == '/qrcode.png'){
        fs.readFile("." + path, function(error, content) {
            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(content, 'utf-8');
        });
        setTimeout(function() {
            console.log('qr code expired');
            fs.copyFile("./happyface.png", "." + path, (err) => {
                if (err) throw err;
                console.log('qrcode replaced');
            });
        }, 30000);
    }
    else
    if (path == '/index.html'){
        fs.readFile("." + path, function(error, content) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
        });
    }
    else
    if (path == '/favicon.ico'){
        res.writeHead(200);
        res.end();
    }
    else {
        console.log("====>" + path);
        res.end();
    }

})
.listen(server_port, server_ip_address);
console.log('Node server running on server ' + server_ip_address + ' port ' + server_port);

