
"use strict";

// add image-field to reportData
(function (rptData, $, async) {
  // class ImageField
  var ImageField = function () {
    // -------------------------------------------------------------------------
    // private functions
    
    /*  function: isImageFieldExist
     *  Description: 
     */
    var isImageFieldExisted = function (element, cb) {
      var _rpt_name = rptData.reportName;
      var _rpt_path = rptData.reportPath;
      var _id = $(element).attr('id');

      $.ajax({url: '/api/imageFieldExist',
              method: 'GET',
              datatype: 'json',
              data: {'report-path': _rpt_path,
                     'report-name': _rpt_name,
                     'element-id': _id},
              success: function (exists) {
                cb(null, exists);
              },
              error: function () {
                cb(new Error('ajax error.'));
              }
      });
    };

    /*
     *  Function getImageFieldData
     *  Description:
     *    This function get image-field data from database.
     */
    var getImageFieldData = function (element, cb) {
      var _rpt_name = rptData.reportName;
      var _rpt_path = rptData.reportPath;
      var _id = $(element).attr('id');

      $.ajax({url: '/api/imageField',
              method: 'GET',
              datatype: 'json',
              data: {'report-path': _rpt_path,
                     'report-name': _rpt_name,
                     'element-id': _id},
              success: function (dat) {
                if (!dat) {
                  cb();
                  return;
                }
                if (dat.name) {
                  element.dataset.name = dat.name;
                }
                if (dat.path) {
                  element.dataset.path = dat.path;
                }
                cb();
              },
              error: function () {
                cb();
              }
      });
    };

    var setImageFieldData = function (element, cb) {
      var _rpt_name = rptData.reportName;
      var _rpt_path = rptData.reportPath;
      var _name = element.dataset.name;
      var _path = element.dataset.path;
      var _app  = element.dataset.app;
      var _macro = element.dataset.macro;
      var _id = $(element).attr('id');
      $.ajax({url: '/api/imageField',
        method: 'POST',
        datatype: 'json',
        data: {'report-path': _rpt_path,
               'report-name': _rpt_name,
               'element-id': _id,
               app: _app,
               name: _name,
               path: _path,
               macro: _macro
           },
        success: function () {
          cb();
        },
        error: function () {
          cb();
        }
      });
    };

    var initByState = {
      "fillTemplate": function (elem) {
        // add class 'field-marker'
        $(elem).addClass('field-marker');

        // register event callback
        $(elem).on('click', function () {
          $('.active-image-field').removeClass('active-image-field');
          $(this).addClass('active-image-field');
          $('#image_field_model').modal({keyboard: true}, elem);
        });
      },
      "runTemplate": function (elem) {},
      "viewReport": function (elem) {}
    };

    // -------------------------------------------------------------------------
    // public functions 

    /*
     *   Function: initImageField
     *   Description:
     *     This funciton is used to initialize image-field (element):
     *     (1). Pass name, path, app, element-id and macro to database.
     *     (2). If database dose not exist the image-field, these data will be inserted to database, otherwise,
     *         database will send back image-field data saved in database, then we will populate the data to 
     *         image-field
     *     This logic is effective to the three state: fillTemplate, runTemplate and viewReport. 
     */
    this.init = function (element, cb) {
      cb = rptData.utils.validateCallback(cb);
      var _state = rptData.state;
      async.waterfall([function image_field_exist (callback) {
        isImageFieldExisted(element, callback);
      }, function update_image_field (exists, callback) {
        if (exists) {
          getImageFieldData(element, callback);
        } else {
          setImageFieldData(element, callback);
        }
      }, function init_by_state (callback) {
        initByState[_state](element);
        callback();
      }], cb);
    };
  };

  rptData.imageField = new ImageField();

} (reportData, jQuery, async));

