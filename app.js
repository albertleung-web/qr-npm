const QRCode = require('qrcode');
const fs = require('fs');
const http = require('http');
const url = require('url');

var server_port = 8080;
var server_ip_address = '0.0.0.0';
var timer = null;
var expire;

const template = "BEGIN:VCALENDAR\n"+
    "VERSION:2.0\n"+
    "BEGIN:VEVENT\n"+
    "SUMMARY;CHARSET=utf-8:{summary}\n"+
    "LOCATION;CHARSET=utf-8:{location}\n"+
    "DTSTART:{start}\n"+
    "DTEND:{end}\n"+
    "END:VEVENT\n"+
    "END:VCALENDAR";

fs.copyFile("./wait.gif", "./qrcode.png", (err) => {
    if (err) throw err;
});

http.createServer((req, res) => {

    const path = url.parse(req.url,true).pathname;
    //console.log((new Date()).toTimeString() + " " + path);

    if (path == '/app.js'){
        const queries = url.parse(req.url,true).query;

        var event = template
            .replace("{summary}", queries.summary)
            .replace("{location}", queries.location)
            .replace("{start}", queries.start)
            .replace("{end}", queries.end);
        console.log(event);
        console.log((new Date()).toString() + " qr code expire in " + queries.expire || 10000);

        QRCode.toFile('./qrcode.png', event);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<html><body bgcolor="#000000"><img src="./qrcode.png"/></body></html>');
        res.end();

        if (timer != null)
            clearTimeout(timer);
        timer = setTimeout(function() {
            console.log((new Date()).toString() + ' qr code expired');
            fs.copyFile("./wait.gif", "./qrcode.png", (err) => {
                if (err) throw err;
            });
        }, queries.expire || 10000);
    }
    else
    if (path == '/qrcode.png'){
        fs.readFile("." + path, function(error, content) {
            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(content, 'utf-8');
        });
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

