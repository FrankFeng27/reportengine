
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

  var ImageFieldSchema = new Schema({
    'id': String,
    'app': String,
    'src': String,
    'macro': String,
    'path': String,
    'field-type': {type: String, default: 'image-field'},
    'aux-data': Shema.Types.Mixed
  }, {strict: false});

  var EditableFieldSchema = new Schema({
    'id': String,
    'content': String
    'aux-data': Schema.Types.Mixed
  }, {strict: false});

  var ReportSettingSchema  = new Schema {
    'report-name': String,   // report name which will run template to save as report
    'template-name': String, // template name which will be saved as template
    'model-path': String,    // related model path 
    'is-template': Boolean   // is template?
  };

  // Foundation Schema
  var ReportSchema = new Schema({
    'report-name': String,
    'report-path': String,
    'template': { 'path': {type: String, default: ''}, 'valid': {type: Boolean, default: false} },
    'version': String,
    'report-setting': ReportSettingSchema,
    'image-fields': [ImageFieldSchema],
    'editable-fields': [EditableFieldSchema],
    'meta-data': {modified: {type: Date, default: Date.now()}, created: {type: Date, default: Date.now()}}
  });
  

  conn.model('ReportModel', ReportSchema, 'ReportModel');

  return true;
};






