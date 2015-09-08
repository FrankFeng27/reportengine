
var setup = require('../../plugins/commutils/commutils');
var _ = require('underscore');
var path = require('path');

describe('commUtils', function () {
  var commUtils = null;

  beforeAll(function (done) {
    setup(null, null, function (opts, regObj) {
      commUtils = regObj.commUtils;
      done();
    });
  });

  it('should test validateCallback', function () {
    var _cb = null;
    _cb = commUtils.validateCallback(_cb);
    expect(_.isFunction(_cb)).toBe(true);
  });

  it('should test outputMessage', function () {
    expect(_.isFunction(commUtils.outputMessage)).toBe(true);
    commUtils.outputMessage({type: 'debug', message: 'Passed.'});
  });

  it('should test collectFolders', function () {
    var _test_path = path.join(__dirname, '../');
    commUtils.collectFolders(_test_path, function (err, folders) {
      expect(err).not.toBe(true);
      expect(folders.length).toBeGreaterThan(0);
    });
  });

});


