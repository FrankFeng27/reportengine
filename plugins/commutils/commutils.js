
/* jshint node: true */
"use strict";

var _ = require('underscore');
var logger = require('./logger');
var BufferStream = require('./bufferstream');
var fs = require('fs');

module.exports = function setup (options, imports, register) {
  var api = {
    handleError: function (err) {
      logger.log('error', String(err));
    },
    outputMessage: function (msg_obj) {
      var _msg = msg_obj
      if (_.isString(_msg)) {
        _msg = { type: "debug", message: _msg };
      }
      var type = _msg.type ? _msg.type : "debug";
      var content = _msg.message ? _msg.message : "";

      logger.log(type, content);
    },
    validateCallback: function (cb) {
      if (_.isFunction(cb)) {
        return cb;
      }
      return function () {};
    },
    walkFolder: function (inPath, cb) {
      if (!inPath) {
        cb(new Error('Invalid path.'));
        return;
      }
      inPath = inPath.replace(/\\/g, '/');
      if (inPath[inPath.length - 1] !== '/') {
        inPath += '/';
      }
      fs.readdir(inPath, function (err, files) {
        if (err) {
          cb(err);
          return;
        }
        _.each(files, function (item) {
          var _item_path = inPath + item;
          var _stats = fs.statSync(_item_path);
          cb(null, item, _item_path, _stats);
        });
        // done
        cb();
      });
    },
    collectFolders: function (inPath, cb) {
      if (!_.isString(inPath) || inPath.length === 0) {
        cb(new Error('Invalid path.'));
        return;
      }
      var _folders = [];
      this.walkFolder(inPath, function (err, item, itemPath, stats) {
        if (err) {
          cb(err);
          return;
        }
        if (!item) {
          // done
          cb(null, _folders);
          return;
        }
        if (stats.isDirectory()) {
          _folders.push({name: item, path: itemPath});
        }
      });
    },
    BufferStream: BufferStream
  };

  register(null, {commUtils: api});
};


