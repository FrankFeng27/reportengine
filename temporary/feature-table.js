
"use strict";

var SprintTableCreator = function (_, $) {
    _.templateSettings = {
      interpolate: /\{\{(.+?)\}\}/g
    };
    // -------------------------------------------------------------------------
    // private functions and variables
    var MAX_CHANGESET = 10000000;
    var MIN_CHANGESET = 0;
    var sort_builds = function (build_array) {
      if (!build_array || build_array.length === 0) {
        // return a dummy array
        return [{td: null,
                 build: {id: null, "end-changeset": String(MAX_CHANGESET), time: Date.now(), name: "No Build"},
                 changeset_range: [MIN_CHANGESET, MAX_CHANGESET],
                 is_build_null_id: true}];
      }
      var _sorted_build_arr = _.sortBy(build_array, function (build) {
        return new Date(build.time);
      });
      var _sorted_obj_arr = [];
      var _prev_end_changeset = 0;
      // create cells
      _.each(_sorted_build_arr, function (build) {   
        // td is reserved for later use.  
        _sorted_obj_arr.push({td: null, build: build, changeset_range: [_prev_end_changeset, parseInt(build["end-changeset"])], is_build_null_id: is_build_id_null(build.id)});
        _prev_end_changeset = parseInt(build["end-changeset"]);
      });
      
      // We plan to display with reversed order
      return _sorted_obj_arr.reverse();
    };
    var sort_user_storys = function (user_storys) {
      // So far, we sort user storys in this order: user storys, bugs, invalid user story
      var _ret_array = [];
      var _user_storys = [];
      var _bugs = [];
      var _invalid_us = [];
      _.each(user_storys, function (us) {
        if (us.type === "User Story") {
          _user_storys.push(us);
        } else if (us.type === "Bug") {
          _bugs.push(us);
        } else {
          _invalid_us.push(us);
        }
      });
      _.each(_user_storys, function (item) {
        _ret_array.push(item);
      });
      _.each(_bugs, function (item) {
        _ret_array.push(item);
      });
      _.each(_invalid_us, function (item) {
        _ret_array.push(item);
      });
      return _ret_array;
    };
    
    var is_build_id_null = function (build_id) {
      if (!build_id || String(build_id).length === 0) {
        return true;
      }
      var other_build_pat = /null-\d+/;
      return String(build_id).search(other_build_pat) >= 0;
    };

    var create_first_row = function (sorted_obj_arr) {
      var $tr = $("<tr></tr>");

      // the first cell in the first row
      var $first_cell = $("<td></td>").addClass('table-build-cell table-userstory-cell');
      $tr.append($first_cell);

      if (!sorted_obj_arr || sorted_obj_arr.length === 0) {
        return $tr;
      }
      // template string
      var build_with_id_tpl = _.template(['<td class="table-build-cell"><div class="build-description">',
                                    '<a href="#" data-build="{{build_id}}">{{build_name}}',
                                    '</a>',
                                   '</div></td>'].join(''));
      var build_no_id_tpl = _.template(['<td class="table-build-cell"><div class="build-description">',
                                    '<label>{{build_name}}',
                                    '</label>',
                                   '</div></td>'].join(''));
      _.each(sorted_obj_arr, function (obj) {
        if (obj.is_build_null_id) {
          $tr.append(build_no_id_tpl({build_name: obj.build.name}));
        } else {
          $tr.append(build_with_id_tpl({build_id: obj.build.id, build_name: obj.build.id}));
        }
      });

      return $tr;
    };

    var match_changeset_id_in_build_obj_array = function (cs_id, build_obj_arr, changeset_arr) {
      if (!build_obj_arr || build_obj_arr.length === 0) {
        return null;
      }
      var _id = parseInt(cs_id);
      var _length = build_obj_arr.length;
      var _min_cs_id = Math.min(build_obj_arr[0].changeset_range[0], build_obj_arr[_length-1].changeset_range[0]);
      var _max_cs_id = Math.max(build_obj_arr[0].changeset_range[1], build_obj_arr[_length-1].changeset_range[1]);
      if (_id < _min_cs_id || _id > _max_cs_id) {
        return null;
      }
      var _ix = _.findIndex(build_obj_arr, function (obj) {
        return (_id > obj.changeset_range[0] && _id <= obj.changeset_range[1]);
      });
      if (_ix < 0) {
        return null;
      }
      var _cs = _.find(changeset_arr, function (cs) {
        return String(cs_id) === cs.id;
      });
      return {td_index: _ix, changeset: _cs};
    };

    var get_userstory_work_item_class = function (us) {
      if (!us || !us.type) {
        return "work-item-noassoc-color";
      }
      if (us.type === "Bug") {
        return "work-item-bug-color";
      } else if (us.type === "User Story") {
        return "work-item-userstory-color";
      } else {
        return "work-item-noassoc-color";
      }
    };
    var get_userstory_status_and_class = function (us) {
      if (!us || !us.status) {
        return ["Unknown", "table-userstory-other-cell"];
      }
      if (us.status === "Active") {
        return ["Active", "table-userstory-active-cell"];
      }
      if (us.status === "Resolved") {
        return ["Resolved", "table-userstory-resolved-cell"];
      }
      if (us.status === "Tested") {
        return ["Tested", "table-userstory-tested-cell"];
      }
      if (us.status === "Closed") {
        return ["Closed", "table-userstory-closed-cell"];
      }
      if (us.status === "New") {
        return ["New", "table-userstory-other-cell"];
      }

      return ["unknown", "table-userstory-other-cell"];
    };

    var create_userstory_row = function (us, changeset_arr, build_obj_arr) {
      var $tr = $('<tr></tr>');
      // template string
      var _us_tpl = _.template(['<td class="table-userstory-cell"><div class="userstory-description {{status_class}}">',
        '<a href="#" data-userstory="{{userstory_id}}">',
        '<div class="work-item-color {{work_item_class}}">&nbsp;</div>', 
        '<span class="userstory-id-block">[{{userstory_id}} | {{userstory_status}}]</span><span class="userstory-description-block">{{userstory_description}}</span>',
        '</a></div></td>'].join(''));
      
      var _work_item_class = get_userstory_work_item_class(us);
      var _status_and_class = get_userstory_status_and_class(us);
      var _us_description  = (us.type !== "User Story" && us.type !== "Bug") ? "No User Stroy Associated" : us.description;
      
      // the first cell of this row
      $tr.append(_us_tpl({userstory_id: us.id, 
        userstory_description: _us_description, 
        work_item_class: _work_item_class,
        userstory_status: _status_and_class[0], 
        status_class: _status_and_class[1]}));

      if (!build_obj_arr || build_obj_arr.length === 0) {
        return $tr;
      }

      // create cells
      _.each(build_obj_arr, function (build, ix) {
        var $td = $('<td></td>');
        $td.addClass('table-changeset-cell');
        build_obj_arr[ix].td = $td;
        $tr.append($td);
      });
      
      // insert changesets to cells
      var _cs_id_tpl = _.template(['<div class="changeset-left-div"><div class="changeset-label" title="{{changeset_comment}}">ChangeSet {{changeset_id}}',
        '<div class="changeset-committer" title="{{committer}}">{{committer}}</div>',
        '</div></div>'].join(''));
      var _cs_comment_tpl = _.template(['<div class="changeset-left-div"><div class="changeset-label" title="{{changeset_comment}}">{{changeset_comment}}',
        '<div class="changeset-committer" title="{{committer}}">{{committer}}</div>',
        '</div></div>'].join(''));
      _.each(us.changesets, function (cs_id) {
        var matched_obj = match_changeset_id_in_build_obj_array(cs_id, build_obj_arr, changeset_arr);
        if (!matched_obj) {
          return;
        }
        var _ix = matched_obj.td_index;
        var _cs = matched_obj.changeset;
        if (!_cs) {
          return;
        }
        if (build_obj_arr[_ix].is_build_null_id) {
          build_obj_arr[_ix].td.append(_cs_id_tpl({changeset_id: _cs.id, committer: _cs.committer, changeset_comment: _cs.comment}));
        } else {
          build_obj_arr[_ix].td.append(_cs_comment_tpl({changeset_comment: _cs.comment, committer: _cs.committer}));
        }
      });

      return $tr;
    };

    var create_single_sprint_table = function (cur_sprint_data) {  
        if (!cur_sprint_data) {
          return null;
        }      
        var _sorted_obj_arr = sort_builds(cur_sprint_data.builds);

        var $table = $('<table class="table table-bordered"></table>');
        $table.append(create_first_row(_sorted_obj_arr));
        var _sorted_user_storys = sort_user_storys(cur_sprint_data.userstorys);
        _.each(_sorted_user_storys, function (us) {
          $table.append(create_userstory_row(us, cur_sprint_data.changesets, _sorted_obj_arr));
        });

        return $table;
    };

    // -------------------------------------------------------------------------
    // exposed function
    this.createTable = function (_sprint_data) {
      return create_single_sprint_table(_sprint_data);
    };
};
