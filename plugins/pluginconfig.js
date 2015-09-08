
/* hshint node: true */
"use strict";

var path = require('path');

// -----------------------------------------------------------------------------
// plugin structure:
// 
//           datastorage          tfsdataaccessor
//                /|\                   /|\
//                 |                     |
//                 |----------------tfsdatasync
//                 |                 /|\  
//                 |                  |
//                 |-datamanipulator--|
// -----------------------------------------------------------------------------

module.exports = [
  {packagePath: './config', 'config-path': path.join(__dirname, '../config.json')},
  './commutils',
  './datastorage'
]


