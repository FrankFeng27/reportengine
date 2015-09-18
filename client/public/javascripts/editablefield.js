
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

    var getEditableFieldData = function (element, cb) {
      var _rpt_name = rptData.reportName;
      var _rpt_path = rptData.reportPath;
      var _id = $(element).attr('id');
      $.ajax({url: '/api/editableFieldData',
        method: 'GET',
        datatype: 'json',
        data: {'element-id': _id, 'report-name': _rpt_name, 'report-path': _rpt_path},
        success: function (dat) {
          if (dat && dat.content) {
            $(element).html(dat.content);
          }
          cb();
        },
        error: function () {
          cb(new Error('ajax error.'));
        }
      });
    };

    var setEditableFieldData = function (element, cb) {
      var _rpt_name = rptData.reportName;
      var _rpt_path = rptData.reportPath;
      var _id = $(element).attr('id');
      var _content = $(element).code();

      $.ajax({url: '/api/editableFieldData',
        method: 'POST',
        datatype: 'json',
        data: { 'report-path': _rpt_path, 'report-name': _rpt_name,
          'element-id': _id, 'element-content': _content },
        success: function () {
          cb();
        },
        error: function() {
          cb(new Error('ajax error.'));
        }
      });
    };

    // -------------------------------------------------------------------------
    // public functions
    this.init = function (element, cb) {
      cb = rptData.utils.validateCallback(cb);
      var _parent = $(element).parent();
      
      // register event callback to editable-field element
      $(element).on('click', function () {
        // enable summer-note plugin
        $(element).summernote({focus: true, width: $(element).width(), height: $(element).height()});
        // expand click event to element's parent, so that we can exit editable mode when click outside.
        expandClickBehavior(_parent, function existCallback() {
          _parent.off('click');
          // save content
          setEditableFieldData(element, function () {
            // disable summer-note plugin
            $(element).destroy();
          });
        });
      });

      // get field data
      getEditableFieldData(element, cb);

    };

  };

  rptData.editableField = new EditableField();

} (reportData, jQuery));


