
/* This script is used to initialize page: collect field data and pass to server. */

"use strict";

$(function () {
  // global variables
  var _rptData = reportData;

  // initialize image-field
  $('.image-field').each(function (ix, elem) {
    _rptData.imageField.init(elem);
  });

  // initialize editable-field
  $('.editable-field').each(function (ix, elem) {
    _rptData.editableField.init(elem);
  });
});

