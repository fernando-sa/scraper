var express = require('express');
var app = express();

var scraper = require('./scraper.js');

app.get('/get/:url/:depth', function (req, res) {
    console.time("time")
    scraper.initCrawl(req.params.url, req.params.depth,function(callback){
        console.timeEnd("time");
        res.send(callback);
    });
});

app.listen(8000, function () {
    console.log('Scraper started at 8000');
});
