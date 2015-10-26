
"use strict";

var reportData = {
  "report-name": null,
  "report-path": null,
  state: "invalid", // candidate value: invalid, fillTemplate, runTemplate, viewReport
  utils: null,
  imageField: null,
  editableField: null
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

