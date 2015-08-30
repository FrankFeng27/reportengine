
/* jshing node: true */
"use strict";

var fs = require('fs');
var async = require('async');
var ReportDatabase = require('./reportdatabase');
var reportDatabaseUtils = require('./reportdatabaseutils');

module.exports = function setup (options, imports, register) {
  // dependency
  var reportConfig = imports.reportConfig;
  var handleError = imports.commUtils.handleError;
  var validateCallback = imports.commUtils.validateCallback;
  var BufferStream = imports.commUtils.BufferStream;
  

  // ---------------------------------------------------------------------------
  // class DataStorage
  var DataStorage = function () {
    var self = this;

    // private functions
    var connect_to_db = function () {
      if (!self.reportDB) {
        cb(new Error('Database was not initialized.'));
        return;
      }
      if (self.reportDB.isConnected()) {
        cb();
        return;
      }
      var mongodb = reportConfig.get('mongodb');
      self.reportDB.connect(mongodb.host, mongodb.port, mongodb.dbname, cb);
    };
    var initialize = function () {
      self.reportDB = new ReportDatabase();
    };

    // public functions
    this.connect = function (cb) {
      connect_to_db(function (err) {
        if (err) {
          handleError(err);
        }
        cb(err);
      });
    };
    
    // constructing...
    initialize();
  };

  // public functions
  DataStorage.prototype.disconnect = function () {
    this.reportDB.disconnect();
  };
  DataStorage.prototype.isReportDocumentExisted = function (rptPath, rptName, cb) {
    cb = validateCallback(cb);
    this.reportDB.isReportDocumentExisted(rptPath, rptName, cb);
  };
  DataStorage.prototype.createReportDocument = function (rptPath, rptName, cb) {
    cb = validateCallback(cb);
    this.reportDB.createReportDocument(rptPath, rptName, function (err, doc) {
      if (err) {
        handleError(err);
        cb(err);
        return;
      }
      if (doc) {
        doc['report-setting'] = {'report-name': "", 'template-name': "", 'model-path': "", 'is-template': false};
        this.reportDB.saveReportDocument(doc, 'report-setting', cb);
      } else {
        cb();
      }
    });
  };
  DataStorage.prototype.createTemplateDocument = function (rptpath, rptName, cb) {
    cb = validateCallback(cb);
    this.reportDB.createReportDocument(rptPath, rptName, function (err, doc) {
      if (err) {
        handleError(err);
        cb(err);
        return;
      }
      if (doc) {
        doc['report-setting'] = {'report-name': "", 'template-name': "", 'model-path': "", 'is-template': true};
        this.reportDB.saveReportDocument(doc, 'report-setting', cb);
      } else {
        cb();
      }
    });
  };
  DataStorage.prototype.saveData = function (rptPath, rptName, data_name, data_value, cb) {
    this.reportDB.saveReportData(rptPath, rptName, data_name, data_value, cb);
  };
  DataStorage.prototype.getData = function (rptPath, rptName, data_name, cb) {
    this.reportDB.getReportData(rptPath, rptName, data_name, cb);
  };
  DataStorage.prototype.isDataFileExisted = function (fpath, fname, cb) {
    var _joined_name = reportDatabaseUtils.joinFileName(fpath, fname);
    this.reportDB.isDataFileExisted(_joined_name, cb);
  };
  DataStorage.prototype.saveFileAsDataFile = function (srcFile, dataFilePath, dataFileName, cb) {
    var _joined_name = reportDatabaseUtils.joinFileName(dataFilePath, dataFileName);
    var _stat = fs.statSync(srcFile);
    if (!_stat.isFile()) {
      var err = new Error('Invalid file name: ', srcFile);
      handleError(err);
      cb(err);
      return;
    }
    var _size = _stat.size;
    var _chunk_size = reportDatabaseUtils.getDataFileChunkSize(_size);
    var _read_stream = fs.createReadStream(srcFile);
    this.reportDB.saveStreamToDataFile(_read_stream, _joined_name, _chunk_size, cb);
  };
  DataStorage.prototype.saveContentAsDataFile = function (content, fpath, fname, cb) {
    var _joined_name = reportDatabaseUtils.joinFileName(fpath, fname);
    var _buf = new Buffer(content);
    var _stream_buf = new BufferStream(_buf);
    this.reportDB.saveStreamToDataFile(_stream_buf, _joined_name, 0, cb);
  };
  DataStorage.prototype.getDataFile = function (fpath, fname, cb) {
    var _joined_name = reportDatabaseUtils.joinFileName(fpath, fname);
    this.reportDB.getDataFile(_joined_name, cb);
  };
  DataStorage.prototype.collectReports = function (cb) {
    this.reportDB.collectReportDocuments(cb);
  };
  DataStorage.prototype.setTemplatePath = function (rptPath, rptName, tPath, cb) {
    this.reportDB.setTemplatePath(rptPath, rptName, tPath, cb);
  };
  DataStorage.prototype.findReport = function (rptPath, rptName, cb) {
    this.reportDB.findReportDocument(rptPath, rptName, cb);
  };
  DataStorage.prototype.save_document_as = function (srcDocPath, srcDocName, dstDocPath, dstDocName, done) {
    var _dst_doc_path = reportDatabaseUtils.convertDirPath(dstDocPath);
    done = validateCallback(done);
    var self = this;
    async.waterfall([function (callback) {
      // 1. find source document
      self.reportDB.findReport(srcDocPath, srcDocName, function (err, doc) {
        if (err) {
          handleError(err);
        }
        callback(err, doc);
      });
    }, function (src_doc, callback) {
      // Check if dst document existed, if not, create one
      self.reportDB.findReport(_dst_doc_path, dstDocName, function (err, doc) {
        if (err) {
          handleError(err);
          callback(err);
          return;
        }
        if (doc) {
          callback(err, src_doc, doc);
        } else {
          self.reportDB.createReportDocument(_dst_doc_path, dstDocName, function (err, doc) {
            if (err) {
              handleError(err);
            }
            callback(err, src_doc, doc);
          });
        }
      });
    }, function (src_doc, dst_doc, callback) {
      self.
    }]);
  };
};


