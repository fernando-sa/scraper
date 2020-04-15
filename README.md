# Node web scraper

This repo generates a Node web server liestening at port 8000 that can recieve one link and the "max depth" that the scraper should go.

## To run it 

Simply donwload it, run npm install to install all dependecies and run index.js with node.

## Usage

Visit `127.0.0.1:8000/get/:linkToBeginScraping/:ScrapingDepth` and it will return all links found in scraping.

## Features

It can go through every <a> tag that it find and scrape through that link. In next "releases" it will search for an string or list images I really don't know yet :).

## Is it realiable?

**NO!!** This should not be used as an reliable source of information scraping as it is a fun not serious projects. Through development I notice some inconsistency that i really don't want to spend time refining.

## Challenges

* Respect robots.txt
* Don't let one link timeout the server
* Do the scraping :D

## Flaws 

* It can't follow redirects
* It is inconsistent(?)
* The code isn't automated tested
* It uses deprecated request node module

## Why?

I was looking for something to practice my node skills and came out with this ideia.
