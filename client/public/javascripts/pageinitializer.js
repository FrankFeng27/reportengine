
/* This script is used to initialize page: collect field data and pass to server. */

"use strict";

$(function () {
  
  // private function
  var initializePage = function (rptData, $) {
    // initialize image-field
    if (rptData.imageField) {
      $('.image-field').each(function (ix, elem) {
        rptData.imageField.init(elem);
      });
    }
  
    // initialize editable-field
    if (rptData.editableField) {
      $('.editable-field').each(function (ix, elem) {
        rptData.editableField.init(elem);
      });
    }
  };

  initializePage(reportData, jQuery);
  
});

