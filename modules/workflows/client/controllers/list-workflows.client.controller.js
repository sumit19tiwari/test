(function () {
  'use strict';

  angular
    .module('workflows')
    .controller('WorkflowsListController', WorkflowsListController);

  WorkflowsListController.$inject = ['$http', '$scope', 'Constants', 'EnterpriseManager'];

  function WorkflowsListController($http, $scope, Constants, EnterpriseManager) {
    
    var vm = this;
    
    var enterprise = EnterpriseManager.load(),
      url = 'api/'+enterprise+'/workflows';
      
    $http.get(url).then(function (response) {
      vm.workflows = response.data;
    }, function (error) { // failureCB
      console.error(error);
    });

  }
}());
