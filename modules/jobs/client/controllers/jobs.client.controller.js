(function () {
  'use strict';

  // Jobs controller
  angular
    .module('jobs')
    .controller('JobsController', JobsController);

  JobsController.$inject = ['$scope', '$state', '$window', 'Authentication', 'jobResolve',
    'JobsService', '$http', '$filter', 'Constants', 'EnterpriseManager'];

  function JobsController ($scope, $state, $window, Authentication, job,
    JobsService, $http, $filter, Constants, EnterpriseManager) {
    var vm = this,
      enterprise = EnterpriseManager.load();

    vm.authentication = Authentication;
    vm.job = job;
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;
    vm.userList = $scope.searchableList = [];
    $scope.isAllSelected = false;
    $scope.searchUser = '';

    //vm.job.assignedOn = $filter('date')(new Date(), "yyyy-MM-dd");
    
    $scope.popup = false;
    $scope.openDate = function(e) {
      e.stopPropagation();
      $scope.popup = true;
    };
    $scope.formats = [ 'yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate' ];
    $scope.format = $scope.formats[1];

    $scope.dateOptions = {
      minDate: new Date(),
      showWeeks: true,
      startingDay: 1
    };
    
    var url = 'api/'+enterprise+'/workflows';

    $http.get(url).then(function (response) {
      $scope.workflows = response.data;
    }, function (error) { // failureCB
      console.error(error);
    });

    url = Constants.constants.host + '/utility/api/v2/fetch_user_data.php?ent_id=' + enterprise;
    $http.get(url)
      .then(function (response) {
        if (response.statusText === 'OK') {
          var obj = {};
          vm.userList = response.data.data;
          angular.forEach(vm.userList, function(value){
            obj.userid = value[0];
            obj.username = value[1];
            obj.email = value[2];
            obj.mobile = value[3];
            obj.location = value[4];
            obj.vertical = value[5];
            obj.subdate = Date.parse(value[6].replace(' ', 'T'));
            obj.selected = false;

            $scope.searchableList.push(obj);
            obj = {};
          });
        } else {
          // handle error condiotn here 
          console.error('Error while getting the course list.');
        }
      });

    $scope.toggleAll = function() {
      var toggleStatus = $scope.isAllSelected;
      angular.forEach($scope.searchableList, function(itm){ itm.selected = toggleStatus; });
      vm.error = null;
    };
  
    $scope.optionToggled = function() {
      $scope.isAllSelected = $scope.searchableList.every(function(itm){ return itm.selected; });
      vm.error = null;
    };

    // Remove existing Job
    function remove() {
      if ($window.confirm('Are you sure you want to delete?')) {
        vm.job.$remove($state.go('jobs.list'));
      }
    }

    // Save Job
    function save(isValid) {
      var count = 1,
        assignedOn = $filter('date')(vm.job.assignedOn, 'yyyy-MM-dd') + 'T' + $filter('date')((new Date()), 'HH:mm:ss'),
        selectedUsers = $scope.searchableList.filter(function (value) {
          return value.selected === true;
        });

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.jobForm');
        return false;
      }
      if(selectedUsers.length === 0) {
        vm.error = 'Please select users to assign the job';
        return false;
      }

      vm.error = null;
      var newJob = {};      

      angular.forEach(selectedUsers, function(value){
        count++;
        newJob = new JobsService();
        newJob.userid = value.userid;
        newJob.username = value.username;
        newJob.workflow = vm.job.workflow;
        newJob.data = vm.job.workflow.data;
        newJob.assignedOn = assignedOn;
        newJob.eid = enterprise;

        newJob.$save(function(res){}, function(res){});

        newJob = {};
      });

      $state.go('jobs.list');
    }
  }
}());
