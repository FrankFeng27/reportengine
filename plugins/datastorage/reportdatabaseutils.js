
/* jshint node: true */
"use strict";

var _ = require('underscore');
var path = require('path');

module.exports = {
    /*
   * These two functions support to access embeded data, like:
   * var obj = {};
   * setProperty(obj, "test.color.r", 255); // Now obj is {test: {color: {r: 255}}}
   * console.log(getProperty(obj, "test.color.r"));
   *
   */
  getProperty: function (obj, key_str) {
    if (!obj || !key_str) {
      return null;
    }
    var _key_array = key_str.split('.');
    if (!_key_array || _key_array.length === 0) {
      return obj;
    }
    var _temp_obj = obj;
    var _array_length = _key_array.length;
    var _ix = 0;
    while (_ix < _array_length) {
      var _key = _key_array[_ix];
      if (_.isUndefined(_temp_obj[_key])) {
        return null;
      }
      _temp_obj = _temp_obj[_key];
      _ix += 1;
    }
    return _temp_obj;
  },
  setProperty: function (obj, key_str, val) {
    if (!obj || !key_str || _.isUndefined(val) || _.isNull(val)) {
      return false;
    }
    var _key_array = key_str.split('.');
    if (!_key_array || _key_array.length === 0) {
      return false;
    }
    var _temp_obj = obj;
    var _array_length = _key_array.length;
    var _ix = 0;
    var _key = _key_array[_ix];
    while (_ix+1 < _array_length) {
      if (_.isUndefined(_temp_obj[_key])) {
        _temp_obj[_key] = {};
      }
      _temp_obj = _temp_obj[_key];
      _ix += 1;
      _key = _key_array[_ix];
    }
    _temp_obj[_key] = val;
    return true;
  },
  normalizeDataFileName: function (name) {
    return name.replace(/\\/g, '/');
  },
  joinDataFileName: function () {
    var join = path.join;
    var _out = join.apply(path, arguments);
    return normalizeDataFileName(_out);  
  },
  getDataFileChunkSize: function (fsize) {
    var default_chunk_size = 255 * 1024;
    var _size = (parseInt(fsize/1024) + 1) * 1024;
    return _size < default_chunk_size ? default_chunk_size : _size;
  }
};


