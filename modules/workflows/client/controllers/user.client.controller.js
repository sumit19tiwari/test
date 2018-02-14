(function () {
  'use strict';
  angular
    .module('workflows')
    .controller('UserAssignModalController', UserAssignModalController);

  UserAssignModalController.$inject = ['$modalInstance', '$scope'];

  function UserAssignModalController($modalInstance, $scope) {
    var vm = this;

    vm.state = $scope.state;

    vm.error = null;
    vm.form = {};
    vm.cancel = cancel;
    vm.saveMenu = save;
    vm.edit = true;

    // Save Feature
    function save(isValid) {

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.menusForm');
        return false;
      }

      $scope.$emit('editStageConf', vm.state);
      $modalInstance.dismiss('cancel');
    }

    function cancel() {
      $modalInstance.dismiss('cancel');
    }

  }

}());    
