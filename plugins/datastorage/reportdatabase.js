
/* jshint node: true */
"use strict";

var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');

var initReportModel = require('./reportschema').initReportModel;

// -----------------------------------------------------------------------------
// helper function
var connect_to_db = function (host, port, dbname, cb) {
  var _uri = "mongodb://" + host + ":" + port + "/" + dbname;
  try {
    var conn = mongoose.createConnection(_uri);
    conn.on('open', function () {
      cb(null, conn);
    });
  } catch (_err) {
    cb(_err);
  }
};

// -----------------------------------------------------------------------------
// class ReportDatabase
module.exports = function ReportDatabase (output) {
  // ---------------------------------------------------------------------------
  // private attributes
  var connection = null;
  var reportModel = null;

  var self = this;

  // ---------------------------------------------------------------------------
  // private functions
  var is_connected = function () {
    if (!connection) {
        return false;
    }
    return (connection.readyState === 1);
  };
  var is_connection_valid = function (cb) {
    if (!self.isConnected()) {
        cb(new Error('Not connected to database.'));
        return false;
    }
    return true;
  };

  // ---------------------------------------------------------------------------
  // public functions
  this.isConnected = function () {
    return is_connected();
  };
  this.disconnect = function () {
    if (connection !== null) {
      output('disconnecting...');
      connection.close();
    }
    connection = null;
    reportModel = null;
  };
  this.connect = function (host, port, dbname, cb) {
    this.disconnect();
    output('connecting...');
    connect_to_db(host, port, dbname, function (err, conn) {
      if (err) {
        cb(err);
        return;
      }
      if (!conn) {
        cb(new Error("Can't connect to database."));
        return;
      }
      initReportModel(conn);
      connection = conn;
      reportModel = conn.model('ReportModel');
      cb();
    });
  };
  this.dropDatabase = function (cb) {
    if (!is_connection_valid(cb)) {
      return;
    }
    connection.db.dropDatabase(cb);
  };
  this.createReportDocument = function (report_path, report_name, cb) {
    if (!is_connection_valid(cb)) {
      return;
    }
    var _query_obj = {'report-name': report_name, 'report-path': report_path};
    var _update_obj = {'image-fields': [], 'editable-fields': [], 'meta-data': {modified: Date.now()}};
    this.reportModel.findOneAndUpdate(_query_obj, {$set: _update_obj}, {upsert: true}, function (err, doc) {
      cb(err, doc);
    });
  };


};

