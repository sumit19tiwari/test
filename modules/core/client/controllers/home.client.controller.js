
'use strict';

angular.module('core').controller('HomeController', ['$scope', '$state', 'Authentication', '$http', '$modal', 'Constants', 'EnterpriseManager', 
  function ($scope, $state, Authentication, $http, $modal, Constants, EnterpriseManager) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
    $scope.entList = [];
    $scope.open = openModal;
    
    var enterprise = EnterpriseManager.load();
    //console.log($state.previous);

    //$http.get("https://adzperform.stage1.qtrain.co/utility/api/v2/get_all_enterprise.php?f_name=get_all_enterprise")
    var url = Constants.constants.host + '/utility/api/v2/get_all_enterprise.php?f_name=get_all_enterprise';
    $http.get(url)
      .then(function (response) {
        if (response.data.status === 'OK') {
          $scope.entList = response.data.data;
        } else {
          // handle error condiotn here 
          console.error('Error while getting the course list.');
        }
      });


    if(! Authentication.user){
      $state.go('authentication.signin');
    }

    if($state.previous.state.name === 'authentication.signin') {
      openModal();
    }

    // Open modal form to select the enterprise to work with
    function openModal (size, parentSelector, $document) {
      var parentElem = parentSelector ? angular.element($document[0].querySelector('.modal-demo ' + parentSelector)) : undefined,
        modalInstance = $modal.open({
          animation: true,
          ariaLabelledBy: 'modal-title',
          ariaDescribedBy: 'modal-body',
          templateUrl: 'modules/core/client/views/modal/entsel.modal.client.view.html',
          controller: 'SelectEnterpriseModalController',
          controllerAs: 'vm',
          size: size,
          scope: $scope,
          appendTo: parentElem,
          backdrop: 'static',
          keyboard  : false
        });
    }
  }
]);

angular.module('core').controller('SelectEnterpriseModalController', SelectEnterpriseModalController);

SelectEnterpriseModalController.$inject = ['$modalInstance', '$scope', 'EnterpriseManager'];

function SelectEnterpriseModalController($modalInstance, $scope, EnterpriseManager) {
  var vm = this;

  vm.menu = {};
  vm.error = null;
  vm.form = {};
  vm.cancel = cancel;
  vm.saveEnterprise = save;
  vm.selectedEnt = EnterpriseManager.load();
  // Save Feature
  function save(isValid) {
    if (!isValid) {
      $scope.$broadcast('show-errors-check-validity', 'vm.form.entSelForm');
      return false;
    }
    EnterpriseManager.save(vm.selectedEnt);
	  //console.log(vm);
	  //$scope.$emit('createStage', vm.state);
    $modalInstance.dismiss('cancel');
  }

  function cancel() {
    $modalInstance.dismiss('cancel');
  }
}
