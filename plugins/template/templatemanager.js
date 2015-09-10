
/* jshint node: true */
"use strict";

module.exports = function setup (options, imports, register) {

  // ---------------------------------------------------------------------------
  // dependency
  var reportConfig = imports.reportConfig;
  var handleError  = imports.commUtils.handleError;
  var outputMessage = imports.commUtils.outputMessage;
  var validateCallback = imports.commUtils.validateCallback;
  var collectFolders = imports.commUtils.collectFolders;

  // ---------------------------------------------------------------------------
  // class TemplateManager
  var TemplateManager = function () {
    var self = this;

    // cb (err, baseTemplates)
    this.collectBaseTemplates = function (baseTplPath, cb) {
      collectFolders(basePath, cb);
    };

    this.createTemplateFromBase = function (baseTplPath, cb) {};


  };

};



