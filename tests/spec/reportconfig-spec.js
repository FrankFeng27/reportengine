
var setup = require('../../plugins/config/reportconfig');
var path = require('path');

describe('reportConfig', function () {
  var reportConfig = null;
  
  beforeAll(function (done) {
    setup({'config-path': path.join(__dirname, '../../config.json')}, null, function (opts, regObj) {
      reportConfig = regObj.reportConfig;
      done();
    });
  });

  it('should test reportConfig.get/set', function (done) {
    var _mongodbCfg = reportConfig.get('mongodb');
    expect(_mongodbCfg.host).toBe('localhost');
    expect(_mongodbCfg.port).toBe(27017);
    expect(_mongodbCfg.dbname).toBe('ReportEngine');
    reportConfig.set('')
    done();
  });

});


