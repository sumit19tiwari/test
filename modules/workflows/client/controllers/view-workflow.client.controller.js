(function () {
  'use strict';

  // Workflows controller
  angular
    .module('workflows')
    .config(function (NodeTemplatePathProvider) {
      NodeTemplatePathProvider.setTemplatePath('modules/workflows/client/views/node/node.html');
    })
    .controller('WorkflowsViewController', WorkflowsViewController);

  WorkflowsViewController.$inject = ['$scope', '$state', '$window', 'Authentication', 'workflowResolve', 'Modelfactory', 'flowchartConstants', '$sce','WKdraftService'];

  function WorkflowsViewController($scope, $state, $window, Authentication, workflow, Modelfactory, flowchartConstants, $sce,WKdraftService) {
    var currentDraftID = workflow.draftId;
    $scope.user = Authentication.user;

    $scope.safe = $sce.trustAsHtml;
    var vm = this;

    vm.authentication = Authentication;
    vm.workflow = workflow;
    
    vm.model = vm.workflow.visualdata;
    vm.flowchartselected = [];
    vm.modelservice = new Modelfactory(vm.model, vm.flowchartselected);

    vm.callbacks = {
      edgeAdded: function (edge) {
        //edgeMappingList['E' + edge.source] = edge.destination;
      },
      edgeRemoved: function (edge) {
        //edgeMappingList.splice('E' + edge.source, 1);
      },
      isValidEdge: function (source, destination) {
        return source.type === flowchartConstants.bottomConnectorType && destination.type === flowchartConstants.topConnectorType;
      },
      nodeRemoved: function(node) {
        //stateCount--;
      },
      nodeCallbacks: {
        'doubleClick': function (event) {
          var selectedNodes = vm.modelservice.nodes.getSelectedNodes(vm.model);
        }
      }
    };

    //show activated edges
    vm.activateWorkflow = function() {
      angular.forEach(vm.model.edges, function(edge) {
        edge.active = !edge.active;
      });
      console.log('edges');
    };

    WKdraftService.query(workflow.draftId,function (success) { 
      // successCB
      if(success.data && success.data.length >0) {
        vm.drafts = success.data;
        //console.log(vm.drafts);
      } else {
        vm.drafts = [];
      }
    }, function (error) { // failureCB
      console.error(error);
      vm.drafts = [];
    });

    vm.draftWorkflow = function(drafteVal) {
      console.log(drafteVal);
      vm.model=drafteVal.visualdata;
    };
  }

  
}());
