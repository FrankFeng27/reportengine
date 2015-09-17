
"use strict";

// add editable-field to reportData
(function (rptData, $) {
  // class EditableField
  var EditableField = function () {
    // -------------------------------------------------------------------------
    // private functions
    var _initialized = false;

    /* function: expandClickBehavior
     * Description: expand editable-field click behavior
     */
    var expandClickBehavior = function (element, outClickCb) {
      outClickCb = rptData.utils.validateCallback(outClickCb);
      var _clicked = false;
      var _need_unregister = true;

      // document click callback
      var docClickCallback = function (event) {
        if (_clicked) {
          // not handled by element click callback, that is, click outside element
          if (_need_unregister) {
            $(document).off('click', docClickCallback);
          }
          outClickCb(element, event);
          _initialized = false;
        }
        _clicked = false;
      };

      $(element).on('click', function () {
        _clicked = true;
        if (!_initialized) {
          $(document).on('click', docClickCallback);
          _initialized = true;
        }
      });
    };

    var getEditableFieldData = function () {};

  };

  rptData.editableField = new EditableField();

} (reportData, jQuery));


