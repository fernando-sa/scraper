var request = require('request');
const cheerio = require('cheerio');

var consumedLinks = [];
var futureLinks = [];

var scrapingTargets = [];

scrapingTargets['images'] = false;
scrapingTargets['strings'] = false;
scrapingTargets['links'] = false;

var targetString;
var linksWithStrings;

var images;

var maxIndexingDepth;
var urlRange;
var robots;


class Scraper {

    initScraping(url, maxDepth, options, call){

        scrapingTargets['strings'] = false;
        scrapingTargets['images'] = false;
        scrapingTargets['links'] = false;

        this.parseScrapingOptions(options, () => {

            if(! this.validateParameters(url, maxDepth)){
                call('Invalid parameters');
                return;
            }

            if(! this.checkScrapingTargets()){
                call('No scraping target was set');
                return;
            }

            this.resetScrapingState(url, maxDepth);


            this.parseRobots(() => {
                if(this.robotsBlockAll()){
                    call("Robots block all access");
                    return;
                };

                if (maxIndexingDepth == 0) {
                    call('Indexing max depth = 0!')
                }else{
                    this.parseLink(url, 0, () => {
                        // Return all links discovered
                        call(this.gatherResponse());
                    });
                }
            });
        });

    }

    parseLink(url, currentIndexingDepth, callback){

        // console.log("VisitedLinks = " + consumedLinks.length + " - Discovered Links = " + (futureLinks.length + consumedLinks.length));
        // console.log("Indexing current url = " + url);


        if(currentIndexingDepth >= maxIndexingDepth){
            callback();
            return;
        };

        let discoveredLinks = [];
        let self = this;

        request({url: 'https://' + self.formatUrl(url), timeout : 10000, followRedirect : false}, function (error, response, body) {
            let indexedLinksCounter = 0;
            // console.log(url);

            if (! error && response.statusCode == 200) {
                let link;

                // load parser
                const $ = cheerio.load(body);

                $('a').each(function(){
                    link = $(this).attr('href');

                    if(! self.isIndexed(link) && self.isAddressValid(link)){
                        futureLinks.push(link);
                        discoveredLinks.push(link);
                    }

                });

                if(scrapingTargets['strings'] == true)
                    self.scrapeForString(url, $);

                if(scrapingTargets['images'] == true)
                    self.scrapeForImages($)

            }else{
                console.log("Erro in : " + url + " detail: " + error);
                callback();
                return;
            }

            if (discoveredLinks.length == 0){
                callback();
                return;

            }

            for (const discoveredLink of discoveredLinks) {

                self.parseLink(self.removeProtocol(discoveredLink), currentIndexingDepth + 1,() => {
                    indexedLinksCounter++;
                    // console.log(discoveredLink);
                    if(indexedLinksCounter == discoveredLinks.length){
                        callback(discoveredLinks);
                        return;
                    }
                });
            }

        });


    }

    scrapeForString(url, $){
        if($('body').html().includes(targetString))
            linksWithStrings.push(url);
    }

    scrapeForImages($){
        let link;

        $('img').each(function(){
            link = $(this).attr('src');

            if(! images.includes(link)){
                images.push(link);
            }

        });
    }

    isIndexed(url){
        return typeof url == 'string'
            && (consumedLinks.includes(url) || futureLinks.includes(url));
    }

    isAddressValid(url){
        return typeof url == 'string'
            && url != undefined
            && ( ( (url.includes('https://') || url.includes('http://')) && url.includes(urlRange) ) || url[0] == '/' )
            && this.isAllowedByRobots(url);
    }

    removeProtocol(url){
        if(url.includes('https://'))
            return url.replace('https://', '');
        else
           return url.replace('http://', '');
    }

    removeUrlRange(url){
        return url.replace(urlRange, '');
    }

    formatUrl(url){
        if(url !== undefined && url[0] == "/")
            return urlRange + url;
        else
            return url;
    }

    parseRobots(callback){

        request('http://' + urlRange + "/robots.txt", function (error, response, body) {

            if (! error && response.statusCode == 200) {
                const $ = cheerio.load(body);
                // Get all user agents rules
                let agentsRules = $('body').html().split('/(?<=\User-agent: )/');

                for (const agentsRule of agentsRules) {

                    // Use general user agent rules
                    if (agentsRule.includes('User-agent: *')){
                        robots = agentsRule.split('\n');
                        break;
                    }
                }

                let deleteFromArray = [];
                // Remove user agent specification and disallow text, leaving only the url we cant access
                for (let i = 0; i < robots.length; i++) {
                    if (robots[i].includes('Disallow: ')){

                        robots[i] = robots[i].replace('Disallow: ', '');

                        // Put / before all rules to make it easier to compare it to urls
                        if(robots[i][0] != "/")
                            robots[i] = "/" + robots[i];

                    }else{
                        // If this isn't an disallow rule, delete it
                        // We take the lenght of deleteFromArray to take in consideration deleted indexes when looping through it
                        deleteFromArray.push(i - deleteFromArray.length);
                    }
                }

                for (const indexToDelete of deleteFromArray) {
                    robots.splice(indexToDelete, 1);
                }

                callback()
                return;

            }else{
                console.log(error);
                callback()
                return;
            }

        });

    }

    isAllowedByRobots(url){
        url = this.removeProtocol(this.removeUrlRange(url));

        // Break it into "/" and "?"
        url = url.split(/(?=[/?])/)

        let rule;
        let equalPart;

        // Iterate through every rule
        for (let i = 0; i < robots.length; i++) {
            rule = robots[i].split(/(?=[/?])/);
            equalPart = 0;

            // Iterate through every "/" of the rule
            for (let j = 0; j < rule.length; j++) {

                if(j > url.length) break;

                // If text matches or the rule is general (*) mark it as a match
                if(rule[j].includes('*') || rule[j] == url[j]){
                    equalPart++;
                    // If all parts matched, this url is disallowed
                    if(equalPart == rule.length) return false;
                }
            }

        }

        // If we passed through every rule and didn't had a match, it is allowed
        return true;
    }

    robotsBlockAll(){
        for (const rule of robots) {
            if (rule == 'Disallow: /') {
                return true;
            }
        }

        return false;
    }

    resetScrapingState(url, maxDepth){
        consumedLinks = [];
        futureLinks = []

        maxIndexingDepth = maxDepth;

        urlRange = url.split(".").slice(-2).join(".");


    }

    parseScrapingOptions(options, callback){
        if(options.hasOwnProperty('searchString')){
            
            linksWithStrings = [];
            scrapingTargets['strings'] = true;
            targetString = options.searchString;
        }
        
        if(options.hasOwnProperty('searchImages')){
            images = [];
            scrapingTargets['images'] = true;
        }

        if(options.hasOwnProperty('searchLinks')){
            scrapingTargets['links'] = true;
        }
        callback();
        return;
    }

    gatherResponse(){

        let response = {};

        if(scrapingTargets['strings'])
            response.strings = linksWithStrings;

        if(scrapingTargets['images'])
            response.images = images;

        if(scrapingTargets['links'])
            response.links = consumedLinks.concat(futureLinks);

        console.log(response)
        return response;
    }

    checkScrapingTargets(){
        for (const target in scrapingTargets) {
            if(scrapingTargets[target] == true) return true
            
        }
        return false;
    }
    
    validateParameters(url, maxDepth){
        if(typeof url != "string" || typeof maxDepth != "string"){
            return false;
        }

        return true;
    }
}

module.exports = new Scraper();