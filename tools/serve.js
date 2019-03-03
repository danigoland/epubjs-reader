var connect = require('connect');
var express = require('express');
var http = require('http');
var fs = require('fs');
var serveStatic = require('serve-static');
var morgan  = require('morgan');
var colors = require('colors');
var	argv = require('optimist').argv;
var	portfinder = require('portfinder');
var path = require('path');
var logger, port;
var log = console.log;
var axios = require('axios');


var bookDir = path.resolve(__dirname, '../reader/books/');
if (!fs.existsSync(bookDir)) {
    fs.mkdirSync(bookDir)
}


function start(_port) {
 if (!_port) {
    portfinder.basePort = 8080;
    portfinder.getPort(function (err, openPort) {
      if (err) throw err;
      port = openPort
      listen(port);
    });
  } else {
    listen(_port);
  }
}

//CORS middleware
function allowCrossDomain(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}


function listen(port) {

  var app = express();
  var staticServer = serveStatic(path.resolve(__dirname, '../reader/'), {'index': ['index.html', 'index.htm']})

  var server = http.createServer(app);

  app.use(allowCrossDomain);
    app.get('/book', function (req, res) {
        var url = req.query.q;
        var fileName = url.substring(url.lastIndexOf('/') + 1);
        var filePath = path.resolve(__dirname, '../reader/books/', fileName);
        if (fs.existsSync(filePath)) {
            console.log('exists');
            res.redirect(`/?bookPath=/books/${fileName}`);
        }else{
            return axios.request({
                responseType: 'arraybuffer',
                url: url,
                method: 'get',
                headers: {
                    'Content-Type': 'application/epub+zip',
                },
            }).then((result) => {
                fs.writeFileSync(filePath, result.data);
                res.redirect(`/?bookPath=/books/${fileName}`);
            });
        }

    });
  app.use(staticServer);

  if(!logger) app.use(morgan('dev'))

  server.listen(port);

  log('Starting up Server, serving '.yellow
    + __dirname.replace("tools", '').green
    + ' on port: '.yellow
    + port.toString().cyan);
  log('Hit CTRL-C to stop the server');

}

process.on('SIGINT', function () {
  log('Server stopped.'.red);
  process.exit();
});

module.exports = start;
