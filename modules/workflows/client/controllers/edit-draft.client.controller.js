(function (){
 'use strict';
  angular
    .module('workflows')
    .config(function (NodeTemplatePathProvider){
       NodeTemplatePathProvider.setTemplatePath('modules/workflows/client/views/node/node.html');
    }).controller('WorkflowEditDraftController', WorkflowEditDraftController)

    WorkflowEditDraftController.$inject = ['$scope', '$state' ,'$window', 'Authentication', 'workflowResolve',
    'Modelfactory', 'flowchartConstants', '$modal', '$http', 'WKdraftService','WorkflowsValidationService', '$interval', 'Constants', 'EnterpriseManager'];

    function WorkflowEditDraftController($scope, $state , $window, Authentication, workflow,
    Modelfactory, flowchartConstants, $modal, $http, WKdraftService,WorkflowsValidationService, $interval, Constants, EnterpriseManager) {


    console.log('edit draft controller is called');	
    console.log('workflow',workflow);
    $scope.user = Authentication.user;
    var enterprise = EnterpriseManager.load();  
    var vm = this;
    var IDLE_TIMEOUT = 60;
    var stateIdValue=[];

    vm.authentication = Authentication;
    vm.workflow = workflow;
    
    vm.model = vm.workflow.visualdata;

    console.log('vm.model',vm.model);
    }
})();