
/* jshint node: true */
"use strict";

var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var Grid = require('gridfs-stream');

var initReportModel = require('./reportschema').initReportModel;
var reportDatabaseUtils = require('./reportdatabaseutils');

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
  var connection  = null;
  var reportModel = null;
  var gridfs      = null;

  var self = this;

  // ---------------------------------------------------------------------------
  // private functions
  var ensure_callback = function (cb) {
    return _.isFunction(cb) ? cb : function () {return;};
  };
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
  var is_report_document_existed = function (query, cb) {
    if (!is_connection_valid(cb)) {
      return;
    }
    query = query || {};
    reportModel.count(query, function (err, cnt) {
      if (err) {
        cb(err);
        return;
      }
      cb(err, cnt > 0);
    });
  };
  var save_field_direct = function (doc, field_type, field, cb) {
    if (!doc || !field) {
      cb();
      return;
    }
    var _ix = _.findIndex(doc[field_type], function (item) {
      return item.id === field.id;
    });
    if (_ix >= 0) {
      doc[field_type][_ix] = field;
    } else {
      doc[field_type].push(field);
    }
    self.saveReportDocument(doc, field_type, cb);
  };
  var save_image_field = function (doc, field, cb) {
    save_field_direct(doc, 'image-field', field, cb);
  };
  var save_editable_field = function (doc, field, cb) {
    save_field_direct(doc, 'editable-field', field, cb);
  };
  var save_field_data = function (doc, name, field, cb) {
    if (name === 'image-field') {
      save_image_field(doc, field, cb);
    } else {
      save_editable_field(doc, field, cb);
    }
  };
  var save_common_data = function (doc, name, value, cb) {
    reportDatabaseUtils.setProperty(doc, name, value);
    self.saveReportDocument(doc, name, cb);
  };
  var is_field_type = function (name) {
    if (!_.isString(name)) {
      return false;
    }
    if (name.indexOf('image-field') === 0 || name.indexOf('editable-field') === 0) {
      return true;
    }
    return false;
  };
  var get_field_data_direct = function (doc, name_arr, cb) {
    var _id = name_arr[1];
    var field_type = name_arr[0];
    var _key_str = name_arr.length > 2 ? name_arr.slice(2).join('.') : "";
    var _found_field = _.find(doc[field_type], function (item) {
      return item.id === _id;
    });
    if (!_found_field) {
      cb(new Error("Can't find field: " + _id));
      return;
    }
    cb(null, reportDatabaseUtils.getProperty(_found_field, _key_str));
  };  
  var get_field_data = function (doc, name, cb) {
    var _key_arr = name.split('.');
    if (!_.isArray(_key_arr) || _key_arr.length < 2) {
      cb(new Error('Invalid input.'));
      return;
    }
    get_field_data_direct(doc, name.split('.'), cb);
  };
  var get_common_data = function (doc, name, cb) {
    var _tmp_obj = reportDatabaseUtils.getProperty(doc, name);
    cb(null, _tmp_obj);
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
    connection  = null;
    reportModel = null;
    gridfs      = null;
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
      gridfs = new Grid(connection.db, mongoose.mongo);
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
    var _update_obj = {'image-field': [], 'editable-field': [], 'meta-data': {modified: Date.now()}};
    reportModel.findOneAndUpdate(_query_obj, {$set: _update_obj}, {upsert: true}, function (err, doc) {
      if (err) {
        cb(err);
        return;
      }
      // If document does not exist, it will be created, but doc would be null, so we need to find.
      if (!doc) {
        self.findReportDocument(report_path, report_name, function (err, doc) {
          cb(err, doc);
        });
        return;
      }
      cb(err, doc);
    });
  };
  this.removeReportDocument = function (report_path, report_name, cb) {
    if (!is_connection_valid(cb)) {
      return;
    }
    reportModel.remove({'report-name': report_name, 'report-path': report_path}, cb);
  };
  this.setTemplatePath = function (report_path, report_name, template_path, cb) {
    cb = ensure_callback(cb);
    if (!is_connection_valid(cb)) {
      return;
    }
    var _query_obj = {'report-name': report_name, 'report-path': report_path};
    var _update_obj = {'template': {'path': template_path, 'valid': true}};
    reportModel.findOneAndUpdate(_query_obj, {$set: _update_obj}, {upsert: true}, function (err) {
      cb(err);
    });
  };
  this.isDataFileExisted = function (fname, cb) {
    if (!is_connection_valid(cb)) {
      return;
    }
    gridfs.exist({filename: fname}, function (err, exists) {
      cb(err, exists);
    });
  };
  this.isReportDocumentExisted = function (report_path, report_name, cb) {
    if (!is_connection_valid(cb)) {
      return;
    }
    is_report_document_existed({'report-path': report_path, 'report-name': report_name}, cb);
  };
  this.collectReportDocuments = function (cb) {
    if (!is_connection_valid(cb)) {
      return;
    }
    reportModel.find({}, function (err, docs) {      
      cb(err, docs);
    });
  };
  this.findReportDocument = function (report_path, report_name, cb) {
    if (!is_connection_valid(cb)) {
      return;
    }
    reportModel.findOne({'report-path': report_path, 'report-name': report_name}, function (err, doc) {
      cb(err, doc);
    });
  };

  /* save stream to database as data file */
  this.saveStreamToDataFile = function (readable_stream, dst_file_path, chunk_size, cb) {
    if (!is_connection_valid(cb)) {
      return;
    }
    if (!readable_stream) {
      return;
    }
    async.waterfall([function (callback) {
      // check if dst_file_path had existed.
      gridfs.exist({filename: dst_file_path}, function (err, exists) {
        callback(err, exists);
      });
    }, function (exists, callback) {
      // get existed files.
      if (exists) {
        gridfs.files.find({filename: dst_file_path}).toArray(function (err, docs) {
          if (err) {
            callback(err);
            return;
          }
          callback(err, docs);          
        });
      } else {
        callback(null, []);
      }
    }, function (docs, callback) {
      // remove existed files.
      var _cnt = docs.length;
      if (_cnt === 0) {
        callback(null);
        return;
      }
      var i = 0;
      _.each(docs, function (item) {
        gridfs.remove(item, function () {
          i += 1;
          if (i === _cnt) {
            callback(null);
          }
        });
      });
    }, function (callback) {
      // write to database.
      var _write_stream = null;
      if (chunk_size && chunk_size > 0) {
        _write_stream = gridfs.createWriteStream({filename: dst_file_path, chunkSize: chunk_size});
      } else {
        _write_stream = gridfs.createWriteStream({filename: dst_file_path});
      }
      readable_stream.pipe(_write_stream);
      _write_stream.on('close', function () {
        callback(null);
      });
    }], function (err) {
      cb(err);
    });    
  };
  this.getDataFile = function (fname, cb) {
    if (!is_connection_valid(cb)) {
      return;
    }
    gridfs.files.findOne({filename: fname}, function (err, doc) {
      if (err) {
        cb(err);
        return;
      }
      var buf = null;
      var _read_stream = gridfs.createReadStream({filename: fname, chunkSize: doc.chunkSize});
      _read_stream.on('data', function (data) {
        if (buf === null) {
          buf = data;
        } else {
          buf += data;
        }
      });
      _read_stream.on('end', function () {
        cb(null, buf);
      });
    });
  };

  this.saveReportDocument = function (doc, field, cb) {
    if (!is_connection_valid(cb)) {
      return;
    }
    if (!doc || !_.isString(field) || field.length === 0) {
      cb(new Error('Invalid input.'));
      return;
    }
    if (_.isFunction(doc.markModified)) {
      doc.markModified(field);
    }
    if (_.isFunction(doc.save)) {
      doc.save(cb);
    } else {
      cb();
    }
  };
  this.copyDataFile = function (src_file_name, dst_file_name, cb) {
    if (!is_connection_valid(cb)) {
      return;
    }
    if (src_file_name === dst_file_name) {
      cb();
      return;
    }
    async.waterfall([function (callback) {
      // 1. First, find source file
      gridfs.findOne({filename: src_file_name}, function (err, doc) {
        if (err) {
          callback(err);
          return;
        }
        if (!doc) {
          cb(null);
          return;
        }
        callback(err, doc);
      });
    }, function (src_doc, callback) {
      // 2. If dst file exists, delete it.
      gridfs.findOne({filename: dst_file_name}, function (err, doc) {
        if (err) {
          callback(err);
          return;
        }
        if (doc) {
          self.removeDataFile(dst_file_name, function (err) {
            if (err) {
              callback(err);
              return;
            }
            callback(err, src_doc);
          });
        } else {
          callback(err, src_doc);
        }
      });
    }, function (src_doc, callback) {
      // 3. copy src file to dst file
      var _rs = gridfs.createReadStream({_id: src_doc._id});
      var _ws = gridfs.createWriteStream({filename: dst_file_name, chunkSize: src_doc.chunkSize});
      _rs.pipe(_ws);
      _ws.on('close', function () {
        callback(null);
      });
    }], cb);
  };
  this.removeDataFile = function (fname, cb) {
    if (!is_connection_valid(cb)) {
      return;
    }
    gridfs.remove({filename: fname}, function (err) {
      cb(err);
    });
  };
  // For file in gridfs, we can't move by change its filename. We have to re-create and delete old one
  this.moveDataFile = function (old_fname, new_fname, cb) {
    if (!is_connection_valid(cb)) {
      return;
    }
    if (old_fname === new_fname) {
      cb();
      return;
    }
    self.copyDataFile(old_fname, new_fname, function (err) {
      if (err) {
        cb(err);
        return;
      }
      // remove old file
      gridfs.remove({filename: old_fname}, function (err) {        
        cb(err);
      });
    });
  };
  this.saveReportData = function (report_path, report_name, name, value, cb) {
    if (!is_connection_valid(cb)) {
      return;
    }

    async.waterfall([function (callback) {
      self.findReportDocument(report_path, report_name, function (err, doc) {
        callback(err, doc);
      });
    }, function (doc, callback) {
      if (!doc) {
        cb(new Error("Can't find document: " + report_name));
        return;
      }
      if (is_field_type(name)) {
        save_field_data(doc, name, value, callback);
      } else {
        save_common_data(doc, name, value, callback);
      }
    }], cb);
  };
  this.getReportData = function (report_path, report_name, name, cb) {
    if (!is_connection_valid(cb)) {
      return;
    }
    async.waterfall([function (callback) {
      self.findReportDocument(report_path, report_name, function (err, doc) {
        callback(err, doc);
      });
    }, function (doc, callback) {
      if (!doc) {
        callback(new Error("Can't find document: " + report_name));
        return;
      }
      if (is_field_type(name)) {
        get_field_data(doc, name, callback);
      } else {
        get_common_data(doc, name, callback);
      }
    }], function (dat) {
      cb(null, dat);
    });
  };
};

