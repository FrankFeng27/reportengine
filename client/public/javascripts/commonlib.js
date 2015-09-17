
"use strict";

var reportData = {
  "report-name": null,
  "report-path": null,
  state: "invalid", // candidate value: invalid, fillTemplate, runTemplate, viewReport
  imageField: null
};

(function (rptData, us) {
  rptData.utils = {
    validateCallback: function (cb) {
      if (!us.isFunction(cb)) {
        return function () {};
      }
      return cb;
    }
  };
} (reportData, _));

