
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

    this.collectTemplates = function (tplPath, cb) {
      collectFolders(tplPath, cb);
    };

  };

};



