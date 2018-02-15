(function () {
  'use strict';

  angular
    .module('workflows')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('workflows', {
        abstract: true,
        url: '/workflows',
        template: '<ui-view/>'
      })
      .state('wkdraft',{
        abstract: true,
        url: '/wkdrafts',
        template: '<ui-view/>'
      })
      .state('workflows.list', {
        url: '',
        templateUrl: 'modules/workflows/client/views/list-workflows.client.view.html',
        controller: 'WorkflowsListController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Workflows List'
        }
      })
      .state('workflows.create', {
        url: '/create',
        templateUrl: 'modules/workflows/client/views/form-workflow.client.view.html',
        controller: 'WorkflowsController',
        controllerAs: 'vm',
        resolve: {
          workflowResolve: newWorkflow
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Workflows Create'
        }
      })
      .state('workflows.edit', {
        url: '/:workflowId/edit',
        templateUrl: 'modules/workflows/client/views/edit-workflow.client.view.html',
        controller: 'WorkflowsEditController',
        controllerAs: 'vm',
        resolve: {
          workflowResolve: getWorkflow
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Edit Workflow {{ workflowResolve.name }}'
        }
      })
      .state('workflows.view', {
        url: '/:workflowId',
        templateUrl: 'modules/workflows/client/views/view-workflow.client.view.html',
        controller: 'WorkflowsViewController',
        controllerAs: 'vm',
        resolve: {
          workflowResolve: getWorkflow
        },
        data: {
          pageTitle: 'Workflow {{ workflowResolve.name }}'
        }
      })
      .state('wkdraft.list',{
        url:'/draft',
        templateUrl: 'modules/workflows/client/views/list-draft.client.view.html',
        controller: 'WorkflowsListDraftController',
        controllerAs: 'vm'
      })
      .state('wkdraft.edit',{
        url:'/draft/edit/:wkDraftId',
        templateUrl:'modules/workflows/client/views/edit-draft.client.view.html',
        controller:'WorkflowEditDraftController',
        controllerAs:'vm',
         resolve: {
          workflowResolve: getDraft
        }
      });
  }

  getWorkflow.$inject = ['$stateParams', 'WorkflowsService'];

  function getWorkflow($stateParams, WorkflowsService) {
    return WorkflowsService.get({
      workflowId: $stateParams.workflowId
    }).$promise;
  }

  newWorkflow.$inject = ['WorkflowsService'];

  function newWorkflow(WorkflowsService) {
    return new WorkflowsService();
  }

  getDraft.$inject = ['$stateParams', 'WKdraftService'];

  /*function getDraft($stateParams, WKdraftService){
    console.log('getDraft is called');  
    console.log('$stateParams.wkDraftId',$stateParams.wkDraftId);
    var wkdraftId=$stateParams.wkDraftId;
     return WKdraftService.get(wkdraftId).$promise;
  }*/
    /*function getDraft($stateParams, WKdraftService){
    console.log('getDraft is called');  
    console.log('$stateParams.wkDraftId',$stateParams.wkDraftId);
    var wkdraftId=$stateParams.wkDraftId;
    return WKdraftService.getDraftById(wkdraftId,function(successCB){
      console.log('successCB',successCB)
      return successCB;
    }) 
  }*/
  function getDraft($stateParams,WKdraftService){

   var wkdraftId=$stateParams.wkDraftId;
    var promise = new Promise(function(resolve, reject) {
        WKdraftService.getDraftById(wkdraftId,function(successCB){
        console.log('successCB',successCB)
        resolve(successCB);
        }); 
     });
    return promise;
  }

}());
