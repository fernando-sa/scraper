var express = require('express');
var app = express();

var scraper = require('./scraper.js');

app.get('/scrape', function (req, res) {
    console.time("time")
    scraper.initScraping(req.query.url,
                        req.query.depth,
                        JSON.parse(req.query.targets),
                        function(callback){
                            console.timeEnd("time");
                            res.send(JSON.stringify(callback) + " \n");
                        });
});

app.listen(8000, function () {
    console.log('Scraper started at 8000');
});
