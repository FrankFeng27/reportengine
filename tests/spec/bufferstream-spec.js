
var util = require('util');
var stream = require('stream');
var Writable = stream.Writable;
/// var Buffer = require('')

var BufferStream = require('../../plugins/commutils/bufferstream');

// Implement a writable stream to test BufferStream
var WritableMemoryStream = function () {
  Writable.call(this);
  this.buf = new Buffer('');
};

util.inherits(WritableMemoryStream, Writable);

WritableMemoryStream.prototype._write = function (chunk, enc, cb) {
  var buffer = Buffer.isBuffer(chunk) ? chunk : new Buffer(chunk, enc);

  Buffer.concat(this.buf, buffer);
  cb();
};

WritableMemoryStream.prototype.toString = function () {
  return this.buf.toString();
};

describe('BufferStream', function () {
  it('should test BufferStream', function () {
    var _test_str = "An antipattern is just like a pattern, except that instead of a solution it gives something that looks superficially like a solution but isn't one.-- Andrew Koenig";
    var _buf = new Buffer(_test_str);
    var _bufStream = new BufferStream(_buf);
    var _writeStream = new WritableMemoryStream();
    _bufStream.pipe(_bufStream);
    _writeStream.on('close', function () {
      var _out = _writeStream.toString();
      expect(_out).toBe(_test_str);
    });
  });
});


