'use strict';

angular.module('core')
  .factory('EnterpriseManager', ['$window', '$cookies',
    function($window, $cookies) {
      var Manager = {
        data: {},
        load: function () {
          var cookie = $cookies.enterprise, eid;
          if(cookie)
            eid = JSON.parse(atob(cookie));
          if($window.enterprise || eid)
            return $window.enterprise || eid.eid;
        },
        save: function(enterprise) {
          $cookies.enterprise = btoa(JSON.stringify({ eid: enterprise }));
          $window.enterprise = enterprise;
        },
        delete: function() {
          $cookies.enterprise = null;
        }
      };
      return Manager; 
    }
  ]);
