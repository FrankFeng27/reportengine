
/* jshint node: true */
"use strict";

var fs = require('fs');
var ReportDatabase = require('./reportdatabase');
var reportDatabaseUtils = require('./reportdatabaseutils');
var dataStorageHandler = require('./datastoragehandler');

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
    var connect_to_db = function (cb) {
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
        this.reportDB.saveReportDocument(doc, 'report-setting', function (err) {
          if (err) {
            handleError(err);
            cb(err);
            return;
          }
          cb(null, doc);
        });
      } else {
        cb(null, doc);
      }
    });
  };
  DataStorage.prototype.createTemplateDocument = function (rptPath, rptName, cb) {
    cb = validateCallback(cb);
    this.reportDB.createReportDocument(rptPath, rptName, function (err, doc) {
      if (err) {
        handleError(err);
        cb(err);
        return;
      }
      if (doc) {
        doc['report-setting'] = {'report-name': "", 'template-name': "", 'model-path': "", 'is-template': true};
        this.reportDB.saveReportDocument(doc, 'report-setting', function (err) {
          if (err) {
            handleError(err);
            cb(err);
            return;
          }
          cb(null, doc);
        });
      } else {
        cb(null, doc);
      }
    });
  };
  DataStorage.prototype.saveData = function (rptPath, rptName, data_name, data_value, cb) {
    cb = validateCallback(cb);
    this.reportDB.saveReportData(rptPath, rptName, data_name, data_value, cb);
  };
  DataStorage.prototype.getData = function (rptPath, rptName, data_name, cb) {
    cb = validateCallback(cb);
    this.reportDB.getReportData(rptPath, rptName, data_name, cb);
  };
  DataStorage.prototype.isDataFileExisted = function (fpath, fname, cb) {
    cb = validateCallback(cb);
    var _joined_name = reportDatabaseUtils.joinFileName(fpath, fname);
    this.reportDB.isDataFileExisted(_joined_name, cb);
  };
  DataStorage.prototype.saveFileAsDataFile = function (srcFile, dataFilePath, dataFileName, cb) {
    cb = validateCallback(cb);
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
    cb = validateCallback(cb);
    var _joined_name = reportDatabaseUtils.joinFileName(fpath, fname);
    var _buf = new Buffer(content);
    var _stream_buf = new BufferStream(_buf);
    this.reportDB.saveStreamToDataFile(_stream_buf, _joined_name, 0, cb);
  };
  DataStorage.prototype.getDataFile = function (fpath, fname, cb) {
    cb = validateCallback(cb);
    var _joined_name = reportDatabaseUtils.joinFileName(fpath, fname);
    this.reportDB.getDataFile(_joined_name, cb);
  };
  DataStorage.prototype.collectReports = function (cb) {
    cb = validateCallback(cb);
    this.reportDB.collectReportDocuments(cb);
  };
  DataStorage.prototype.setTemplatePath = function (rptPath, rptName, tPath, cb) {
    cb = validateCallback(cb);
    this.reportDB.setTemplatePath(rptPath, rptName, tPath, cb);
  };
  DataStorage.prototype.findReport = function (rptPath, rptName, cb) {
    cb = validateCallback(cb);
    this.reportDB.findReportDocument(rptPath, rptName, cb);
  };
  DataStorage.prototype.save_document_as = function (srcDocPath, srcDocName, dstDocPath, dstDocName, done) {
    dataStorageHandler.saveDocumentAs(srcDocPath, srcDocName, dstDocPath, dstDocName, this.reportDB, done);
  };
  DataStorage.prototype.saveTemplateAsTemplate = function (rptPath, rptName, tplPath, tplName, cb) {
    cb = validateCallback(cb);
    var _tpl_path = reportDatabaseUtils.convertDirPath(tplPath);
    var _tpl_name = tplName;
    var self = this;
    this.save_document_as(rptPath, rptName, _tpl_path, _tpl_name, function (err, srcDoc, dstDoc) {
      if (err) {
        handleError(err);
        cb(err);
        return;
      }
      // mark dstDoc as report
      dstDoc['report-setting']['is-template'] = true;
      self.reportDB.saveReportDocument(dstDoc, 'report-setting', function () {});

      cb(err, srcDoc, dstDoc);
    });
  };
  DataStorage.prototype.saveTemplateAsReport = function (rptPath, rptName, rptPathSave, rptNameSave, cb) {
    cb = validateCallback(cb);
    var _rpt_path = reportDatabaseUtils.convertDirPath(rptPathSave);
    var _rpt_name = rptNameSave;
    var self = this;
    this.save_document_as(rptPath, rptName, _rpt_path, _rpt_name, function (err, srcDoc, dstDoc) {
      if (err) {
        handleError(err);
        cb(err);
        return;
      }
      // mark dstDoc as report
      dstDoc['report-setting']['is-template'] = false;
      self.reportDB.saveReportDocument(dstDoc, 'report-setting', function () {});

      cb(err, srcDoc, dstDoc);
    });
  };
  DataStorage.prototype.removeReport = function (rptPath, rptName, cb) {
    cb = validateCallback(cb);
    var self = this;
    this.reportDB.findReport(rptPath, rptName, function (err, doc) {
      if (err) {
        handleError(err);
        cb(err);
        return;
      }
      if (!doc) {
        cb();
        return;
      }
      dataStorageHandler.removeDocument(doc, self.reportDB, cb);
    });
  };
  
  var _data_storage = new DataStorage();
  _data_storage.connect(function () {
    register(null, {
        dataStorage: _data_storage
    });
  });
};


