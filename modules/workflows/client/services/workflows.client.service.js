// Workflows service used to communicate Workflows REST endpoints
(function () {
  'use strict';

  angular
    .module('workflows')
    .factory('WorkflowsService', WorkflowsService);

  WorkflowsService.$inject = ['$resource'];

  function WorkflowsService($resource) {
    return $resource('api/workflows/:workflowId', {
      workflowId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
