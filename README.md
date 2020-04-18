# Node web scraper

This repo generates a Node API liestening at port 8000 that can recieve instructions on how to scrape some site.

## To run it 

Simply donwload it, run npm install to install all dependecies and run index.js with node.

## Usage

The API only have one GET entrypoint, that is "/scrape" and it takes three parameters
1. Url to be scraped
2. Scraping max distance from initial Url
3. Targets object telling api what needs to be returned,  which can contain propreties
    * searchString="stringToBeSearched"
    * searchImages=true or false
    * searchLinks=true or false

#### Example call:
Example call from linux CURL command line interface:
`curl -X GET -G 'http://localhost:8000/scrape' -d 'url=siteToScrape.com' -d 'depth=3' -d 'options={"searchString":true,"searchImages":true,"searchLinks":true}'`


## Features

It can go through every <a> tag that it find and scrape through that link. It can return the links that had the target string, return all image tags src and return all links that it has discovered.

## Is it realiable?

**NO!!** This should not be used as an reliable source of information scraping as it is a fun not serious project.

## Challenges

* Respect robots.txt
* Don't let one link timeout the server
* Do the scraping :D

## Flaws 

* It can't follow redirects
* The code isn't automated tested
* It uses deprecated request node module

## Why?

I was looking for something to practice my node skills and came out with this ideia.
