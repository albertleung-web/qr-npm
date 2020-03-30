const QRCode = require('qrcode');
const fs = require('fs');
const http = require('http');
const url = require('url');
const WebSocketServer = require('ws').Server;

var server_port = 8080;
var server_ip_address = '0.0.0.0';
var timer = null;
var expire;
var expire_default = 60;

const template = "BEGIN:VCALENDAR\n"+
    "VERSION:2.0\n"+
    "BEGIN:VEVENT\n"+
    "SUMMARY;CHARSET=utf-8:{summary}\n"+
    "LOCATION;CHARSET=utf-8:{location}\n"+
    "DTSTART:{start}\n"+
    "DURATION:PT15M\n"+
    "END:VEVENT\n"+
    "END:VCALENDAR";

fs.copyFile("./wait.gif", "./qrcode.png", (err) => {
    if (err) throw err;
});

function notifyClients(msg){
    console.log("Notify client, count = " + wss.clients.size);
    wss.clients.forEach(function each(client) {
        client.send(msg);
    });
}

const server = http.createServer((req, res) => {

    const path = url.parse(req.url,true).pathname;
    //console.log((new Date()).toTimeString() + " " + path);

    if (path == '/app.js'){
        const queries = url.parse(req.url,true).query;

        var event = template
            .replace("{summary}", (queries.summary || ""))
            .replace("{location}", (queries.location || ""))
            .replace("{start}", "20" + (queries.startd || "") + "T" + (queries.startt || "") + "00");
        console.log(event);
        var msg = (new Date()).toString() + " qr code expire in " + (queries.expire || expire_default) + " sec";
        console.log(msg);

        QRCode.toFile('./qrcode.png', event);
        fs.readFile("./calendar.html", function(error, content) {
            var calendar = content.toString()
                .replace("{summary}", (queries.summary || ""))
                .replace("{location}", (queries.location || ""))
                .replace("{startd}", (queries.startd || ""))
                .replace("{startt}", (queries.startt || ""));
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(calendar, 'utf-8');
        });

        if (timer != null)
            clearTimeout(timer);
        timer = setTimeout(function() {
            var msg = (new Date()).toString() + ' qr code expired';
            console.log(msg);
            fs.copyFile("./wait.gif", "./qrcode.png", (err) => {
                if (err) throw err;
            });
            notifyClients(msg);
        }, (queries.expire || expire_default) * 1000 );

        notifyClients(msg);
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

var wss = new WebSocketServer({server});

console.log('Node server running on server ' +
    server_ip_address +
    ' port ' + server_port);

