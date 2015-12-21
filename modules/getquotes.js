module.exports = {

  /**
  * Search for an action on euronext.com
  */
  search: function(keyword, callback) {

    var debug = require('debug')('GetQuotes:search');
    var request = require('request');
    var cheerio = require('cheerio');

    var url = 'https://euronext.com/fr/search_instruments/' + keyword;
    var res = [];

    /* Parse results from the request to json */
    function parseResult(reqBody) {
      var table = cheerio.load(reqBody)('#nyx-lookup-instruments-directory-table tbody').html();

      cheerio.load(table)('tr').each(function(i, el) {
        var tab = {
          symbol : cheerio.load(el)('td:nth-child(1)').text(),
          name :   cheerio.load(el)('td:nth-child(2)').text().replace(/\s+/, ' '),
          isin :   cheerio.load(el)('td:nth-child(3)').text(),
          market : cheerio.load(el)('td:nth-child(5)').text(),
          type :   cheerio.load(el)('td:nth-child(6)').text()
        };
        res.push(tab);
      });
    }

    /* Request Euronext's infos */
    request(url, function(error, resp, body) {
      debug('Response : ' + resp.statusCode + ', Errors : ' + error);   // DEBUG ONLY
      parseResult(body);
      return callback(res);
    });
  },

  /**
  * Get info about an action by ISIN
  */
  get: function(code, callback) {

    var debug = require('debug')('GetQuotes:get');
    var request = require('request');
    var cheerio = require('cheerio');

    var isin = code.split('-')[0];
    var market = code.split('-')[1];

    if (!market) {
      request('http://localhost:3000/api/s/' + isin, function(error, resp, body) {
        var result = JSON.parse(body);
        market = result[0].market;
        getQuotes(isin, market)
      });
    } else {
      getQuotes(isin, market);
    }

    /**
    *	Extract Quotes from the request
    * TODO: Improve parser
    */
    function extractQuotes(reqBody) {
      var $ = cheerio.load(reqBody);
      var name = $('.instrument-name').text();
      var data = {
        name:         $('.instrument-name').text(),
        lastTime:     $('#datetimeLastvalue').text().replace(' CET', ''),
        segment:      $('.first-row .box-header div:nth-child(2)').text().replace(/\s\w/g, function (x) { return x.toUpperCase(); }).replace(/\s/g, '').replace('Segment:', ''),
        symbole:      $('.first-row .first-column span').text(),
        currency:     $('#currencySymbolvalue').text().replace(/\s/g, ''),
        price:        ($('#lastPriceint').text() + $('#lastPricefract').text()).replace(/,/g, '.')*1,
        marketStatus: $('#tradingStatusvalue').text(),
        prevCloseAbs: $('#cnDiffAbsvalue').text().replace(/\s/g, '').replace(/,/g, '.')*1,
        prevCloseRel: $('#cnDiffRelvalue').text().replace(/\((.+?)%\)/g, '$1').replace(/,/g, '.')*1,
        openAbs:      $('#cnOpenDiffAbsvalue').text().replace(/,/g, '.')*1,
        openRel:      $('#cnOpenDiffRelvalue').text().replace(/\((.+?)%\)/g, '$1').replace(/,/g, '.')*1,
        open:         $('.first-row .fourth-column tr:nth-child(3) td:last-of-type').text().replace(/(€|\$|£)/g, '').replace(/,/g, '.')*1,
        tradeCap:     $('#turnovervalue').text().replace(/(€|\$|£)/g, '').replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.')*1,
        nbrTrans:     $('#transactionsvalue').text().replace(/\s/g, '').replace(/\./g, '')*1,
        todayVol:  {
          volume: $('#todayVolumevalue').text().replace(/\[(.+)\]/g, '').replace(/\./g, '').replace(/,/g, '.')*1,
          time:   $('#todayVolumevalue').text().replace(/(?:.+?)\[(.+)\]/g, '$1'),
        },
        yestClose: {
          price: $('.first-row .fourth-column tr:nth-child(2) td:last-of-type').text().replace(/(€|\$|£)/g, '').replace(/\[(.+)\]/g, '').replace(/,/g, '.')*1,
          time:  $('.first-row .fourth-column tr:nth-child(2) td:last-of-type').text().replace(/(€|\$|£)/g, '').replace(/(?:.+?)\[(.+)\]/g, '$1'),
        },
        var52Week: {
          high: $('.first-row .fourth-column tr:nth-child(4) td:last-of-type').text().replace(/\s/g, '').replace(/(€|\$|£)/g, '').replace(/(?:.+?)-(.+?)/g, '$1').replace(/,/g, '.')*1,
          low:  $('.first-row .fourth-column tr:nth-child(4) td:last-of-type').text().replace(/\s/g, '').replace(/(€|\$|£)/g, '').replace(/(.+?)-(?:.+)/g, '$1').replace(/,/g, '.')*1,
        },
        low:      {
          price: $('#lowPricevalue').text().replace(/\s/g, '').replace(/\[(.+)\]/g, '').replace(/,/g, '.')*1,
          time:  $('#lowPricevalue').text().replace(/\s/g, '').replace(/(?:.+?)\[(.+)\]/g, '$1'),
        },
        high:       {
          price: $('#highPricevalue').text().replace(/\s/g, '').replace(/\[(.+)\]/g, '').replace(/,/g, '.')*1,
          time:  $('#highPricevalue').text().replace(/\s/g, '').replace(/(?:.+?)\[(.+)\]/g, '$1'),
        },
        marketCap: {
          value: $('#marketCapvalue').text().replace(/(€|\$|£)/g, '').replace(/[a-z]/gi, '')*1,
          unit:  $('#marketCapvalue').text().replace(/(€|\$|£)/g, '').replace(/(?:\d+?)([a-z])/gi, '$1'),
        }
      };
      return data;
    }

    function getQuotes(isin, market) {
      var url = "https://euronext.com/fr/nyx_eu_listings/real-time/quote?isin=" + isin + "&mic=" + market;
      request(url, function(error, resp, body) {
        debug('Response : ' + resp.statusCode + ', Errors : ' + error);   // DEBUG ONLY
        var res = extractQuotes(body);
        return callback(res);
      });
    }


  },

}
