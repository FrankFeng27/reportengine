
/* jshint node: true */
"use strict";

var async = require('async');
var _ = require('underscore');
var reportDatabaseUtils = require('./reportdatabaseutils');

var update_doc_modified = function (doc) {
  if (!doc) {
    return;
  }
  if (!doc['meta-data']) {
    doc['meta-data'] = {};
  }
  doc['meta-data'].modified = Date.now();
};

/*
 *  Check if we need to update image field:
 *  If image in image-field was saved in template (or report) folder, we need to update image-field: 
 *  1. copy image to current template/report folder.
 *  2. update image-field.
 */
var need_update_image_field = function (imgField, oldTPLName, curTPLName) {
  if (!imgField || oldTPLName === curTPLName) {
    return false;
  }
  if (imgField.path.length < oldTPLName.length) {
    return false;
  }
  if (imgField.path.slice(0, oldTPLName.length) !== oldTPLName) {
    return false;
  }
  return true;
};

var update_image_field = function (imgField, oldTPLName, curTPLName, db, cb) {
  if (!imgField) {
    return;
  }
  var _cur_images_path = reportDatabaseUtils.joinFileName(curTPLName, 'images');
  var _cur_img_path = reportDatabaseUtils.joinFileName(_cur_images_path, imgField.name);
  var _old_img_path = reportDatabaseUtils.joinFileName(imgField.path, imgField.name);

  db.copyDataFile(_old_img_path, _cur_img_path, function (err) {
    if (err) {
      cb(err);
      return;
    }
    imgField.path = _cur_images_path;
    cb();
  });
};

var need_remove_image_field = function (docImagesPath, imgField) {
  // Check if image is in document folder
  if (!imgField.path || imgField.path.length === 0) {
    return false;
  }
  if (imgField.path.length < docImagesPath.length) {
    return false;
  }
  if (imgField.path.slice(0, docImagesPath.length) !== docImagesPath) {
    return false;
  }
  return true;
};

var remove_image_field = function (doc, imgField, db, cb) {
  var _doc_full_path = reportDatabaseUtils.joinFileName(doc['report-path'], doc['report-name']);
  var _doc_images_path = reportDatabaseUtils.joinFileName(_doc_full_path, 'images');

  var _macro_path = reportDatabaseUtils.buildMacroPath(doc['report-path'], doc['report-name'], 'image-field', imgField.id, imgField.macro);
  db.removeDataFile(_macro_path, function () {
    if (!need_remove_image_field(_doc_images_path, imgField)) {
      cb();
      return;
    }
    db.removeDataFile(reportDatabaseUtils.joinFileName(imgField.path, imgField.name), cb);
  });
};

var dataStorageHandler = {
  saveDocumentAs: function (srcDocPath, srcDocName, dstDocPath, dstDocName, db, done) {
    var self = this;
    async.waterfall([function (callback) {
        // 1. find source document
        db.findReport(srcDocPath, srcDocName, function (err, doc) {          
          callback(err, doc);
        });
      }, function (src_doc, callback) {
        // Check if dst document existed, if not, create one
        db.findReport(dstDocPath, dstDocName, function (err, doc) {
          if (err) {
            callback(err);
            return;
          }
          if (doc) {
            callback(err, src_doc, doc);
          } else {
            db.createReportDocument(dstDocPath, dstDocName, function (err, doc) {              
              callback(err, src_doc, doc);
            });
          }
        });
      }, function (src_doc, dst_doc, callback) {
        self.copyDocument(src_doc, dst_doc, db, function (err) {
          callback(err, src_doc, dst_doc);
        });
      }], function (err, src_doc, dst_doc) {
        done(err, src_doc, dst_doc);
      });
  },
  copyDocument: function (srcDoc, dstDoc, db, done) {
    var _src_full_path = reportDatabaseUtils.joinFileName(srcDoc['report-path'], srcDoc['report-name']);
    var _dst_full_path = reportDatabaseUtils.joinFileName(dstDoc['report-path'], dstDoc['report-name']);

    dstDoc.template = srcDoc.template;
    dstDoc['report-setting'] = srcDoc['report-setting'];
    // copy editable fields
    _.each(srcDoc['editable-field'], function (item) {
      dstDoc['editable-field'].push(item);
    });

    var _make_update_image_field_func = function (imgField) {
      return function (cb) {
        var imgFieldId = imgField.id;
        var _src_macro_path = reportDatabaseUtils.buildMacroPath(srcDoc['report-path'], srcDoc['report-name'], 'image-field', imgFieldId, imgField.macro);
        var _dst_macro_path = reportDatabaseUtils.buildMacroPath(dstDoc['report-path'], dstDoc['report-name'], 'image-field', imgFieldId, imgField.macro);

        db.copyDataFile(_src_macro_path, _dst_macro_path, function () {
          if (need_update_image_field(imgField, _src_full_path, _dst_full_path)) {
            update_image_field(imgField, _src_full_path, _dst_full_path, db, cb);
          } else {
            cb();
          }
        });
      };
    };

    var _funcs = [];
    _.each(dstDoc['image-field'], function (item) {
      _funcs.push(_make_update_image_field_func(item));
    });
    async.series(_funcs, function () {
      db.saveDocument(dstDoc, 'image-field');
      update_doc_modified(dstDoc);
      done();
    });
  },
  removeDocument: function (doc, db, cb) {
    
    var _make_remove_iamge_field_func = function (imgField) {
      return function(cb) {
        remove_image_field(doc, imgField, db, cb);
      };
    };

    var _funcs = [];
    _.each(doc['image-field'], function (item) {
      _funcs.push(_make_remove_iamge_field_func(item));
    });

    async.each(_funcs, function () {
      db.removeReportDocument(doc['report-path'], doc['report-name'], cb);
    });
  }
};

module.exports = dataStorageHandler;


