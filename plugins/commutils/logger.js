
var winston = require('winston');
winston.emitErrs = true;

var logger = new winston.Logger({
  transports: [
    new winston.transports.File({
      name: 'info-file',
      level: 'info',
      filename: './logs.log',
      handleExceptions: true,
      json: true,
      maxsize: 5242880, //5MB
      maxFiles: 5,
      colorize: false
    }),
    new winston.transports.Console({
      name: 'debug-console',
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true,
      prettyPrint: true
    })
  ],
  exitOnError: false
});

module.exports = logger;


