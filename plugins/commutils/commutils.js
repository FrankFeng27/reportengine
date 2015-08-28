
/* jshint node: true */
"use strict";

var _ = require('underscore');
var logger = require('./logger');
var BufferStream = require('./bufferstream');

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
    }
    BufferStream: BufferStream
  };

  register(null, {commUtils: api});
};


