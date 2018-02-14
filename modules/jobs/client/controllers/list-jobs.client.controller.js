(function () {
  'use strict';

  angular
    .module('jobs')
    .controller('JobsListController', JobsListController);

  JobsListController.$inject = ['$http', '$scope', 'Constants', 'EnterpriseManager'];

  function JobsListController($http, $scope, Constants, EnterpriseManager) {
    var vm = this;

    var enterprise = EnterpriseManager.load(),
      url = 'api/'+enterprise+'/jobs';

    $http.get(url).then(function (response) {
      vm.jobs = response.data;
    }, function (error) { // failureCB
      console.error(error);
    });

  }
}());
