var express = require('express');
var app = express();
var reqTimestamps = [];

app.get('/', function (req, res) {
    console.log("\nreq from host: ", req.hostname);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send('Script should be running!');
    console.log("param query:", req._parsedUrl.query.split("=")[1]);
    var timestamp = req._parsedUrl.query.split("=")[1];

    console.log("got request");

    if (req.hostname) {
        if (reqTimestamps.indexOf(timestamp) == -1) {
            reqTimestamps.push(timestamp);
            if (reqTimestamps.length == 2) {
                process.exit(0)
            }
        }
    } else {
        setTimeout(function(){ console.log("Request timeout"); process.exit(0) }, 15000);
        system.exit(1);
    }
});

var server = app.listen(8082, function () {

  var host = server.address().address;
  var port = server.address().port;
  console.log('お待ちください');
  console.log('Example app listening at http://%s:%s', host, port);
});