(function () {
  'use strict';
  // Workflows controller
  angular
    .module('workflows')
    .config(function (NodeTemplatePathProvider,IdleProvider, KeepaliveProvider,TitleProvider ) {
      NodeTemplatePathProvider.setTemplatePath('modules/workflows/client/views/node/node.html');
    }).controller('WorkflowEditDraftController', WorkflowEditDraftController);

  WorkflowEditDraftController.$inject = ['$scope', '$state' ,'$window', 'Authentication', 'workflowResolve',
    'Modelfactory', 'flowchartConstants', '$modal', '$http', 'WKdraftService','WorkflowsValidationService', '$interval', 'Constants', 'EnterpriseManager'];

  function WorkflowEditDraftController($scope, $state , $window, Authentication, workflow,
    Modelfactory, flowchartConstants, $modal, $http, WKdraftService,WorkflowsValidationService, $interval, Constants, EnterpriseManager) {
  
    $scope.user = Authentication.user;
    var enterprise = EnterpriseManager.load();  
    var vm = this;
    var IDLE_TIMEOUT = 60;
    var stateIdValue=[];

    vm.authentication = Authentication;
    vm.workflow = workflow;
    console.log('workflow',vm.workflow );
    
    vm.model = vm.workflow.data.visualdata;
    //console.log('---------vm.model',vm.model);
    //console.log('---------vm.workflow',vm.workflow);
    stateIdValue.splice(0,stateIdValue.length);
  
    var largestNodeId = 0;
    for(var i = 0;i < vm.model.nodes.length;i++){
      stateIdValue.push(vm.model.nodes[i].id);

      for(var j = 0;j < vm.model.nodes[i].connectors.length;j++){
        if(vm.model.nodes[i].connectors[j].id > 0)
          largestNodeId=vm.model.nodes[i].connectors[j].id;
      }  
    }
    var nextNodeID = 0,
     // var nextNodeID = workflow.data.length + 1,
      nextConnectorID = largestNodeId+1,
      currentDraftID = workflow.data.draftId,
      connectorsMappingList = [],
      edgeMappingList = [];
    var stateCount = workflow.data.data.length + 1;

    vm.flowchartselected = [];
    vm.modelservice = new Modelfactory(vm.model, vm.flowchartselected);
    
    //function for mapping
    reloadModel(); 
  
    vm.callbacks = {
      edgeAdded: function (edge) {
        edgeMappingList['E' + edge.source] = edge.destination;
        //console.log('ea->eml', edgeMappingList);
      },
      edgeRemoved: function (edge) {
         //edgeMappingList.splice('E' + edge.source, 1);
        delete edgeMappingList['E' + edge.source];
        //console.log('er->eml', edgeMappingList);
      },
      isValidEdge: function (source, destination) {
        return source.type === flowchartConstants.bottomConnectorType && destination.type === flowchartConstants.topConnectorType;
      },
      nodeRemoved: function(node) {
        stateCount--;
      },
      nodeCallbacks: {
        'doubleClick': function (event) {
          var selectedNodes = vm.modelservice.nodes.getSelectedNodes(vm.model);
          editStage();
        }
      }
    };

    var url = Constants.constants.host + '/common/opcontroller/index.php?c=api&type=tag_fetch&eid=' + enterprise;
    console.log(url);
    $http.get(url)
      .then(function (response) {
        if (response.data.status === 'OK') {
          $scope.course_list = response.data.data;
        } else {
          // handle error condiotn here 
          console.error('Error while getting the course list.');
        }
      });


    function reloadModel() {
      angular.forEach(vm.model.nodes, function(value) {
        saveConnectorMapping(value);  
      });

      angular.forEach(vm.model.edges, function(value){
        edgeMappingList['E' + value.source] = value.destination;
      });
      startSavingDrafts();
    }

    // Save Workflow
    function save(isValid) {
        console.log('save is called');
      if (!isValid) {
        //console.log(vm.workflow);
        return false;
      }
      //validation service is called to check workflow validation.
      var valid=WorkflowsValidationService.validate(vm.workflow.visualdata,vm.workflow.data,edgeMappingList);

      if(!valid){
        alert('Invalid Workflow ');
        return false;
      }
      console.log('vm.workflow',vm.workflow);
      // TODO: move create/update logic to service
      if (vm.workflow.data._id) {
        console.log('if is called');
        vm.workflow.$update(successCallback, errorCallback);
      } else {
        console.log('else is called');

        vm.workflow.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('workflows.list');
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }

    // generate random node colors
    function getRandomColor() {
      var letters = '0123456789ABCDEF';
      var color = '#';
      for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }

    // for lightening the node color to be used for connectors
    function shadeColor(color, percent) {   
      var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
      return '#'+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
    }

    //delete a selected edge
    vm.deleteEdge = function() {
      var selectedEdges = vm.modelservice.edges.getSelectedEdges();
      angular.forEach(selectedEdges, function(edge) {
        vm.modelservice.edges.delete(edge);
       // edgeMappingList.splice('E' + edge.source, 1);
        delete edgeMappingList['E' + edge.source];
 
      });
    };

    //delete a selected node
    vm.deleteNode = function() {
      var selectedNodes = vm.modelservice.nodes.getSelectedNodes();
      stateCount--;
      angular.forEach(selectedNodes, function(node) {
        vm.modelservice.nodes.delete(node);
        var stateIds=stateIdValue;
        stateIds.splice(stateIds.indexOf(node.id) , 1);
        stateIds=stateIds;
      });
    };

    //show activated edges
    vm.activateWorkflow = function() {
      angular.forEach(vm.model.edges, function(edge) {
        edge.active = !edge.active;
      });
    };

    // Open modal form to add a new state to the workflow
    vm.addNewStage = function (size, parentSelector, $document) {
      var stateIds=stateIdValue;
     // console.log('addstage',stateIds);
      var state=1;
      do{
        if(stateIds.indexOf(state) === -1){
          $scope.stateId = 'S' + state;      
          break;
        }
        else{
          $scope.stateId ='S'+stateCount;
               //break;
        }
        state++;
      }while(state<=stateIds.length);

      var parentElem = parentSelector ? angular.element($document[0].querySelector('.modal-demo ' + parentSelector)) : undefined,
        modalInstance = $modal.open({
          animation: true,
          ariaLabelledBy: 'modal-title',
          ariaDescribedBy: 'modal-body',
          templateUrl: 'modules/workflows/client/views/modal/add-state.modal.client.view.html',
          controller: 'AddStateEditModalController',
          controllerAs: 'vm',
          backdrop: 'static',
          size: size,
          scope: $scope,
          appendTo: parentElem
        });
          
    };

    $scope.$on('createStage', function (evt, data) {
      createStage(data);
    });

    function createStage(data) {
      var stateIds=stateIdValue;
      var nextNode;
      var i=1;
      do{
        if(stateIds.indexOf(i)===-1){
          nextNode = i;        
          break;
        }
        else{
        //nextNode=nextNodeID++;
          nextNode=i+1;
        }
        i++;
      }while(i<=stateIds.length);


      var nodeId = nextNode,
        bConCount = 1,
        xPos = 200 + (20 * nodeId/2),
        yPos = 100 + (20 * nodeId/2),
        clr = getRandomColor(),
        connClr = shadeColor(clr, 0.5);

      stateIdValue =stateIds.concat(nodeId);

     // console.log('nodeId',nodeId);
     // console.log('stateCount',stateCount);
      if (data.have_assessment) {
        bConCount = 2;
      }

      var newNode = {
        name: data.stateId,
        sudo: data.stateName,
        config_data: data,
        id: nodeId,
        x: xPos,
        y: yPos,
        color: clr,
        connColor: connClr,
        connectors: []
      };

      if (stateCount !== 1 && nodeId!==1) {
        newNode.connectors.push({
          id: nextConnectorID++,
          type: flowchartConstants.topConnectorType
        });
      }

      for (var k = 0; k < bConCount; k++) {
        newNode.connectors.push({
          id: nextConnectorID++,
          type: flowchartConstants.bottomConnectorType
        });
      }

      stateCount++;
      vm.model.nodes.push(newNode);
      saveConnectorMapping(newNode);
    }

    function editStage(size, parentSelector, $document) {
      $scope.state = {};
      $scope.state = vm.flowchartselected[0].config_data;

      var parentElem = parentSelector ? angular.element($document[0].querySelector('.modal-demo ' + parentSelector)) : undefined,
        modalInstance = $modal.open({
          animation: true,
          ariaLabelledBy: 'modal-title',
          ariaDescribedBy: 'modal-body',
          templateUrl: 'modules/workflows/client/views/modal/add-state.modal.client.view.html',
          controller: 'EditStateEditModalController',
          controllerAs: 'vm',
          backdrop: 'static',
          size: size,
          scope: $scope,
          appendTo: parentElem
        });
    }

    $scope.$on('updateState', function (evt, data) {
      updateState(data);
    });

    function updateState(data) {
      angular.forEach(vm.model.nodes, function (value, key) {
        if (value.name === data.stateId) {
          vm.model.nodes[key].sudo=data.stateName;
          vm.model.nodes[key].config_data = data;
          
          return;
        }
      });
      startSavingDrafts();
    }

    function saveConnectorMapping (newState) {
      var isPfEdge = true,
        connId = -1,
        connLen = newState.connectors.length;
      
      for (var i = 0; i < connLen; i++) {
        connId = 'C' + newState.connectors[i].id;
        connectorsMappingList[connId] = {};
        connectorsMappingList[connId].stateId = newState.name;
        connectorsMappingList[connId].edgeType = 'I';
        
        if (newState.connectors[i].type === 'bottomConnector') {
          if (isPfEdge) {
            isPfEdge = false;
            connectorsMappingList[connId].edgeType = 'P';
          } else {
            //isPfEdge = true;
            connectorsMappingList[connId].edgeType = 'F';
          }
        }
      }
    }

    // Function to create the workflow data from the visual data
    function createWorkflowdDataFromVisualData(callback) {
      var data = {},
        dataPushed = [];
      if (vm.model.nodes.length === 0) {
        data.wkdata = dataPushed;
        callback(data);
      }else {
        var counter = 0,
          tcounter = 0,
          nodeObject = {};
        angular.forEach(vm.model.nodes, function (value, key) {
         // angular.forEach(vm.workflow.visualdata.nodes, function(value,key){
          nodeObject = {};
          nodeObject.stateId = value.name;
          nodeObject.stateName = value.config_data.stateName;
          nodeObject.stateDesc = value.config_data.stateDesc;
          nodeObject.courseId = value.config_data.course;
          nodeObject.courseName = value.config_data.coursename;
          nodeObject.duration = value.config_data.duration;
          nodeObject.transition = {};
          nodeObject.transition.timelapse = value.config_data.next_state_period;
          nodeObject.transition.transitFlag = value.config_data.transitFlag;
          if (value.config_data.hasOwnProperty('passing_percentage')) {
            nodeObject.transition.condition = value.config_data.passing_percentage;
          }
          var bottomConnectorValues = value.connectors.filter(function (value) {
            return value.type === 'bottomConnector';
          });
          nodeObject.transition.nextState = {};
          //console.log('edgeMappingList',edgeMappingList);
          //console.log('connectorsMappingList',connectorsMappingList);
          angular.forEach(bottomConnectorValues, function(value, key){  

            var srcId = value.id,
              destId = edgeMappingList['E' + value.id],
              srcObj = connectorsMappingList['C' + srcId],
              destObj = connectorsMappingList['C' + destId];
           // console.log(srcId,destId);
            if(destObj) {
              if (srcObj.edgeType === 'P') {
                nodeObject.transition.nextState.pass = destObj.stateId;
              } else if (srcObj.edgeType === 'F') {
                nodeObject.transition.nextState.fail = destObj.stateId;
              }
            }
            tcounter++;
          });
          //check whether nodeobject is empty or not
          if(Object.keys(nodeObject.transition.nextState).length === 0 && nodeObject.transition.nextState.constructor === Object){
            delete nodeObject.transition.nextState;
          }
          dataPushed.push(nodeObject);
          counter++;
        });
        if (vm.model.nodes.length === counter) {
          //if (vm.workflow.visualdata.nodes.length === counter) {
          data.wkdata = dataPushed;
          data.wktransitions = tcounter;
          console.log('@@@@@@@@@@@@@@@@@@data',data);
          callback(data);
        }
      }
    }

    function saveDrafts() {
      //console.log('edit save draft is called');

      createWorkflowdDataFromVisualData(function (data) {    
        //console.log(data.wkdata);
        if (data.wkdata.length > 0) {
          console.log('data is greater');
          var draft = {};
          draft.name = (new Date()).toISOString();
          draft.visualdata = vm.model;
          draft.data = data.wkdata;
          draft.draftId = currentDraftID;
          draft.eid = enterprise;
          
          WKdraftService.save(draft, function (success) { // successCB
            //console.log(success);
          }, function (error) { // failureCB
            console.log(error);
            console.log('error is called');
            console.log('draft',draft);
          });
        }
      });
    }    
    // Saving draft every 1 minute.
    function startSavingDrafts() {

    }

    // Saving draft every mouse event happens
    function startSavingDraftsmouse() {
      //saveDrafts();
      $interval(saveDrafts, 60000);
    }

    // Open modal form to add a new state to the workflow
    vm.saveWorkflowModal = function (size, parentSelector, $document,workflow) {
      $scope.workflow = vm.workflow;
      var parentElem = parentSelector ? angular.element($document[0].querySelector('.modal-demo ' + parentSelector)) : undefined,
        modalInstance = $modal.open({
          animation: true,
          ariaLabelledBy: 'modal-title',
          ariaDescribedBy: 'modal-body',
          templateUrl: 'modules/workflows/client/views/modal/wkdraft-setting.modal.client.view.html',
          controller: 'WkDraftEditSettingModalController',
          controllerAs: 'vm',
          backdrop: 'static',
          size: size,
          scope: $scope,
          appendTo: parentElem

        });
       
    };

    $scope.$on('saveWorkflow', function (evt, data) {
      createWorkflowdDataFromVisualData(function (cdata) {   
      console.log('saveWorkflow is called');
      console.log('vm.model',vm.model);
      console.log('cdata',cdata);
      console.log('data',data);
      console.log('currentDraftID',currentDraftID); 
        if(vm.model.edges.length > 0 && cdata.wktransitions > 0 && cdata.wkdata.length > 0) {
          vm.workflow.name = data.name;
          vm.workflow.visualdata = vm.model;
          vm.workflow.data = cdata.wkdata;
          vm.workflow.draftId = currentDraftID;
          vm.workflow.eid = enterprise;
        }
        vm.workflow.data=cdata.wkdata;
        vm.workflow.visualdata = vm.model;
        save(true);
      });
    });

  }

  angular
    .module('workflows')
    .controller('AddStateEditModalController', AddStateEditModalController);

  AddStateEditModalController.$inject = ['$modalInstance', '$scope'];

  function AddStateEditModalController($modalInstance, $scope) {
    var vm = this;

    vm.menu = {};
    vm.error = null;
    vm.form = {};
    vm.cancel = cancel;
    vm.saveState = save;
    vm.state = {};
    vm.state.stateId = $scope.stateId;
    vm.state.have_assessment = 0;
    vm.state.coursename = '';
    vm.state.transitFlag = 'F';
    // Save Feature
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.stateForm');
        return false;
      }
      console.log(vm);
      $scope.$emit('createStage', vm.state);
      $modalInstance.dismiss('cancel');
    }

    function cancel() {
      $modalInstance.dismiss('cancel');
    }

    vm.course_change = function (current) {
      //console.log($scope.course_list[current]);
      vm.state.coursename = $scope.course_list[current].title;
      if ($scope.course_list[current].interaction > 0) {
        vm.state.have_assessment = 1;
      } else {

        vm.state.have_assessment = 0;
      }
    };

  }

  angular
    .module('workflows')
    .controller('EditStateEditModalController', EditStateEditModalController);

  EditStateEditModalController.$inject = ['$modalInstance', '$scope'];

  function EditStateEditModalController($modalInstance, $scope) {
    var vm = this;

    vm.state = $scope.state;
    vm.error = null;
    vm.form = {};
    vm.cancel = cancel;
    vm.saveState = save;
    vm.edit = true;
    vm.showTopConnectors = (vm.edit && vm.state.stateId !== 'S1') ? true : false;
    // Save Feature
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.stateForm');
        return false;
      }
      $scope.$emit('updateState', vm.state);
      $modalInstance.dismiss('cancel');
    }

    function cancel() {
      $modalInstance.dismiss('cancel');
    }

    vm.course_change = function (current) {
      //console.log($scope.course_list[current]);
      vm.state.coursename = $scope.course_list[current].title;
      if ($scope.course_list[current].interaction > 0) {
        vm.state.have_assessment = 1;
      } else {

        vm.state.have_assessment = 0;
      }
    };

  }

  angular
    .module('workflows')
    .controller('WkDraftEditSettingModalController', WkDraftEditSettingModalController);

  WkDraftEditSettingModalController.$inject = ['$modalInstance', '$scope'];

  function WkDraftEditSettingModalController($modalInstance, $scope,workflow) {
    var vm = this;

    vm.workflow = $scope.workflow;
    vm.error = null;
    vm.form = {};
    vm.cancel = cancel;
    vm.saveWorkflow = save;
    vm.edit=true;
    //console.log($scope.workflow);
 
    // Save Feature
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.workflowForm');
        return false;
      }
      //console.log(vm);
    
      $scope.$emit('saveWorkflow', vm.workflow);
      $modalInstance.dismiss('cancel');
    }

    function cancel() {
      $modalInstance.dismiss('cancel');
    }

  }

}());
