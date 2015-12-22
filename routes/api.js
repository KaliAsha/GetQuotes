module.exports = function(io) {
  var debug = require('debug')('HelloWorld:api');
  var quotes = require('../modules/getquotes');
  var express = require('express');
  var router = express.Router();

  /* Api page. */
  router.get('/', function(req, res, next) {
    res.render('api', { title: 'API' });
  });

  /**
   * SEARCH
   */
  router.get('/s', function(req, res, next) {
    res.render('api', { title: 'SEARCH' });
  });

  router.get('/s/:search', function(req, res, next) {
    var search = req.params.search;
    quotes.search(search, function(result) {
      res.send(result);
    });
  });


  /**
   * GET
   */
  router.get('/g', function(req, res, next) {
    res.render('api', { title: 'GET' });
  });

  router.get('/g/:code', function(req, res, next) {
    var code = req.params.code;
    quotes.get(code, function (result) {
      res.send(result);
    })
  });

  return router;
}
