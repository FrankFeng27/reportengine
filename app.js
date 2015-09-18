
/* jshint node: true */
"use strict";

var express = require('express');
var path    = require('path');
var favicon = require('static-favicon');
var bodyParse = require('body-parser');
var async = require('async');
var assert = require('assert');
var logger = require('morgan');

var PluginManager = require('./plugins/pluginmanager');

var ReportEngine = function () {
  this.app = express();
  this.pluginMgr = null;
};

ReportEngine.prototype.init_resource = function (done) {
  this.app.set('view engine', 'jade');
  this.app.set('views', path.join(__dirname, './client/entry/views'));
  this.app.use(favicon());
  this.app.use(logger('dev'));
  this.app.use(bodyParse.json());
  this.app.use(bodyParse.urlencoded());

  // static resource
  /// this.app.use(express.static(__dirname));
  this.app.use(express.static(path.join(__dirname, './client/public')));
  this.app.use(express.static(path.join(__dirname, './client/entry/resources')));
  this.app.use(express.static(path.join(__dirname, 'node_modules')));
  this.app.use(express.static(path.join(__dirname, 'bower_components/jquery/dist')));
  this.app.use(express.static(path.join(__dirname, 'bower_components/bootstrap/dist/js')));
  this.app.use(express.static(path.join(__dirname, 'bower_components/underscore')));
  this.app.use(express.static(path.join(__dirname, 'bower_components/summernote/dist')));
  this.app.use(express.static(path.join(__dirname, 'bower_components/jqwidgets')));
  this.app.use('/css', express.static(path.join(__dirname, 'bower_components/bootstrap/dist/css')));  

  var ApplicationRouter = require('./routes/index');
  this.appRounter = new ApplicationRouter(this);
  this.app.use('/', this.appRounter.getRouter());

  done();
};

ReportEngine.prototype.init_plugins = function (done) {
  this.pluginMgr = new PluginManager();
  this.pluginMgr.initialize(done);
};

ReportEngine.prototype.initialize = function (done) {
  var self = this;
  async.series([function (callback) {
    self.init_resource(callback);
  }, function (callback) {
    self.init_plugins(callback);
  }, function () {
    done();
  }]);
};

ReportEngine.prototype.start = function (cb) {
  assert(this.pluginMgr, "Plugin manager not initialized.");

  var config = this.pluginMgr.getPlugin('reportConfig');
  var utils  = this.pluginMgr.getPlugin('commUtils');

  var port = config.get('port');
  var server = this.app.listen(port, function () {
    utils.outputMessage('Express server listening on port: ' + server.address().port);
    cb();
  });
};

ReportEngine.prototype.getPlugin = function (plugin_name) {
  return this.pluginMgr.getPlugin(plugin_name);
};

module.exports = ReportEngine;
