
var architect = require('architect');
var path = require('path');

var PluginManager = function () {
  var _config_path = path.join(__dirname, "./pluginconfig.js");
  var _config      = architect.loadConfig(_config_path);
  this.pluginMgr = null;

  this.initialize = function (cb) {
    this.pluginMgr = architect.createApp(_config, function (err) { 
      cb();
    });
  };
};

PluginManager.prototype.getPlugin = function (plugin_name) {
  return this.pluginMgr.getService(plugin_name);
};

module.exports = PluginManager;

