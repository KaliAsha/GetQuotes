module.exports = function(io) {
  var debug = require('debug')('HelloWorld:index');
  var express = require('express');
  var router = express.Router();

  /* Home page. */
  router.get('/', function(req, res, next) {
    res.render('index', { title: 'GetQuotes' });
  });

  return router;
}
