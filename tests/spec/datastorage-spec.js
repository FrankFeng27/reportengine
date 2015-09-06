
var setup = require('../../plugins/datastorage/datastorage');
var stream = require('stream');
var util = require('util');

// mock BufferStream
var ReadableStream = function (buf) {
  this._buf = buf;
  this._length = buf.length;
  
  this.on('end', this._destroy.bind(this));
};  

util.inherits(ReadableStream, stream.Readable);

ReadableStream.prototype._read = function (size) {
  if (this._length === 0) {
    this.push(null);
    return;
  }
  this.push(this._buf.slice());
  this._length = 0;
};

ReadableStream.prototype._destroy = function () {
  this._buf = null;
  this._length = null;
}

// mock-up
var mockup_imports = {
  commUtils: {
    handleError: function (err) {},
    validateCallback: function (cb) { return cb ? cb : function () {}; },
    outputMessage: function (msg) { console.log(String(msg)); },
    BufferStream: ReadableStream
  },
  reportConfig: {
    get: function (name) {
      if (name === 'mongodb') {
        return {host: 'localhost', port: 27017, dbname: "testReportEngineDB"};
      } else {
        return null;
      }
    }
  }
};

describe('dataStorage', function () {
  var dataStorage = null;
  var originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 1500000; // extend timeout

  beforeAll(function (done) {
    setup(null, mockup_imports, function (options, regObj) {
      dataStorage = regObj.dataStorage;      
      done();
    });
  });

  afterAll(function (done) {
    dataStorage.disconnect();
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    done();
  });

  it('should test isReportDocumentExisted()', function (done) {
    var _weired_name = '_@@~~foo~~@@_';
    dataStorage.isReportDocumentExisted(_weired_name, _weired_name, function (err, exists) {
      expect(exists).toBe(false);
      done();
    });
  });

  it('should test createReportDocument()', function (done) {
    var _path = "/temp/test";
    var _name = "foo1.tpl";
    dataStorage.createReportDocument(_path, _name, function (err, doc) {
      expect(doc['report-path']).toBe('/temp/test/');
      expect(doc['report-name']).toBe('foo1.tpl');
    });
  });

});


