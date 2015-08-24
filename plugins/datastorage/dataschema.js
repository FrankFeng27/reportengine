
/* jshint node: true */
"use strict";

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// -----------------------------------------------------------------------------
// define schema

exports.initReportModel = function (conn) {
  if (!conn) {
    return false;
  }

  // Foundation Schema
  var ReportSchema = new Schema({
    'report-name': String,
    'report-path': String,
    'template': { 'path': {type: String, default: ''}, 'valid': {type: Boolean, default: false} },
    'version': String,
    'data': Schema.Types.Mixed,
    'meta-data': {modified: {type: Date, default: Date.now()}, created: {type: Date, default: Date.now()}}
  }, {strict: false});
  

  conn.model('ReportSchema', ReportSchema, 'ReportSchema');

  return true;
};






