

/* jshint node: true */
"use strict";

var express = require('express');

var ApplicationRouter = function (app) {
  // private
  var router = express.Router();
  
  router.get('/', function (req, res) {
    res.send(200, 'Welcome to Report Engine.');
  });
  
  // public
  this.getRouter = function () {
    return router;
  };

};

module.exports = ApplicationRouter;





