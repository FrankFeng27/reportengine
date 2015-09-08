
/* jshint node: true */
"use strict";

module.exports = function setup (options, imports, register) {
  var Convict = require('convict');

  var cfg_path = options['config-path'];
  var config = require(cfg_path);
  
  // ---------------------------------------------------------------------------
  // class ReportConfig
  var ReportConfig = function (cfg) {
    this.conf = new Convict({root: "", app: "", 'template-root': "templates"});
    this.conf.load(cfg);
    if (process.env.PORT) {
      this.set('port', process.env.PORT);
    }
    if (process.env.nodb) {
      this.set('nodb', process.env.nodb);
    }
  };
  ReportConfig.prototype.get = function (name) {
    return this.conf.get(name);
  };
  ReportConfig.prototype.set = function (name, val) {
    this.conf.set(name, val);
  };

  var _report_config = new ReportConfig(config);

  var api = {
    get: function (name) {
      try {
        return _report_config.get(name);
      } catch (e) {
        return null;
      }
    },
    set: function (name, val) {
      _report_config.set(name, val);
    }
  };

  register(null, {
    reportConfig: api
  });
};



