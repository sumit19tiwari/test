(function () {
  'use strict';

  angular
    .module('workflows')
    .controller('WorkflowsListDraftController', WorkflowsListDraftController);

  WorkflowsListDraftController.$inject = ['$http', '$scope','$location', '$modal', 'Constants', 'EnterpriseManager'];

  function WorkflowsListDraftController($http, $scope, $location ,$modal, Constants, EnterpriseManager) {

    var vm = this;
    var enterprise = EnterpriseManager.load(),

      //url = 'api/'+enterprise + draftId +'/workflows';

    url = '/api/workflows/'+enterprise +'/draft';
      
    $http.get(url).then(function (response) {
      vm.workflows = response.data;
    }, function (error) { // failureCB
      console.error(error);
    });

    $scope.getDraftId = function(draftId) {
      var draftIdurl = '/api/workflows/draft/'+draftId;

      $http.get(draftIdurl).then(function (response) {
        vm.DraftIdData = response.data;
      }, function (error) { // failureCB
        console.error(error);
      });

    };

    vm.showMessage = function (size, parentSelector, $document) {
      var parentElem = parentSelector ? angular.element($document[0].querySelector('.modal-demo ' + parentSelector)) : undefined,
        modalInstance = $modal.open({
          animation: true,
          ariaLabelledBy: 'modal-title',
          ariaDescribedBy: 'modal-body',
          templateUrl: 'modules/workflows/client/views/modal/show-draft-message.modal.client.view.html',
          controller: 'ShowDraftMessageModalController',
          controllerAs: 'vm',
          backdrop: 'static',
          size: size,
          scope: $scope,
          appendTo: parentElem
        });
    }
  }

   angular
    .module('workflows')
    .controller('ShowDraftMessageModalController', ShowDraftMessageModalController);

  ShowDraftMessageModalController.$inject = ['$modalInstance', '$scope','$state'];

  function ShowDraftMessageModalController($modalInstance, $scope ,$state) {

    $scope.ok = function() {
      $modalInstance.dismiss('ok');
       //$state.go('workflows.list');
    }

    $scope.cancel = function() {
      $modalInstance.dismiss('cancel');
    }
  }

}());