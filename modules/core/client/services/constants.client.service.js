'use strict';

// Authentication service for user variables
angular.module('core').factory('Constants', ['$window',
  function ($window) {
    var variables = {
      constants: $window.constants
    };

    return variables;
  }
]);
