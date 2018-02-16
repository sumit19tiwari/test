(function () {
  'use strict';

  // Workflows controller
  angular
    .module('workflows')
    .config(function (NodeTemplatePathProvider ,IdleProvider, KeepaliveProvider,TitleProvider) {
      NodeTemplatePathProvider.setTemplatePath('modules/workflows/client/views/node/node.html');
      TitleProvider.enabled(false);
      IdleProvider.idle(10); // 10 minutes idle
      IdleProvider.timeout(false);
      IdleProvider.keepalive(false);
      IdleProvider.autoResume(true); 
      KeepaliveProvider.interval(5);
    })
    .controller('WorkflowsController', WorkflowsController)
    .run(function(Idle){
      Idle.watch();
    });
  WorkflowsController.$inject = ['$scope','$rootScope','$state', '$window', 'Authentication', 'workflowResolve',
    'Modelfactory', 'flowchartConstants', '$modal', '$http', 'WKdraftService','WorkflowsValidationService', '$interval', 'Constants', 'EnterpriseManager'];

  function WorkflowsController($scope, $rootScope, $state, $window, Authentication, workflow,
    Modelfactory, flowchartConstants, $modal, $http, WKdraftService,WorkflowsValidationService, $interval, Constants, EnterpriseManager) {
  
    $scope.user = Authentication.user;
    
    var enterprise = EnterpriseManager.load();
    var nextNodeID = 1,
      nextConnectorID = 1,
      currentDraftID = 0,
      stateCount = 1,
      connectorsMappingList = [],
      edgeMappingList = [],
      stateIdValue = [];


    var vm = this;
 //localStorage.removeItem("state_ids");
    vm.authentication = Authentication;
    vm.workflow = workflow;
    vm.model = {
      nodes: [],
      edges: []
    };
    vm.flowchartselected = [];
    vm.modelservice = new Modelfactory(vm.model, vm.flowchartselected);

    vm.callbacks = {
      edgeAdded: function (edge) {
        edgeMappingList['E' + edge.source] = edge.destination;
      },
      edgeRemoved: function (edge) {
        //edgeMappingList.splice('E' + edge.source, 1);
        delete edgeMappingList['E' + edge.source];
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

    /**
    * Getting the latest draft id from the database
    */
    WKdraftService.current(function (success) { // successCB
      if (success.data && success.data.draftId) {
        currentDraftID = success.data.draftId + 1;
      } else {
        currentDraftID = 1;
      }
    }, function (error) { // failureCB
      console.error(error);
      currentDraftID = 1;
    });

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

    // Save Workflow
    function save(isValid) {
      if (!isValid) {
        //console.log(vm.workflow);
        return false;
      }

        //validation service is called to check workflow validation.
      //console.log('edgeMappingList',edgeMappingList);
      var valid=WorkflowsValidationService.validate(vm.workflow.visualdata,vm.workflow.data,edgeMappingList);

      if(!valid){
       // console.log('valid is called');
        alert('Invalid Workflow');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.workflow._id) {
        vm.workflow.$update(successCallback, errorCallback);
      } else {
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
        delete edgeMappingList['E' + edge.source];
      });
    };

    //delete a selected node
    vm.deleteNode = function() {
      var selectedNodes = vm.modelservice.nodes.getSelectedNodes();
      angular.forEach(selectedNodes, function(node) {
        vm.modelservice.nodes.delete(node);
        stateCount--;
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
     // console.log('add New State state_id',stateIdValue);
      var firststate=1;
      if(stateIdValue.indexOf(firststate)===-1){
        $scope.stateId = 'S' + firststate;
      }
      else{
        var stateIds=stateIdValue;
        var state=2;
        do{
          if(stateIds.indexOf(state) === -1){
            $scope.stateId = 'S' + state;        
            break;
          }
        else{
            $scope.stateId ='S'+stateCount; 
          }
          state++;
        }while(state<=stateIds.length);
      }

      var parentElem = parentSelector ? angular.element($document[0].querySelector('.modal-demo ' + parentSelector)) : undefined,
        modalInstance = $modal.open({
          animation: true,
          ariaLabelledBy: 'modal-title',
          ariaDescribedBy: 'modal-body',
          templateUrl: 'modules/workflows/client/views/modal/add-state.modal.client.view.html',
          controller: 'AddStateModalController',
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
      var k=1;
      do{
        if(stateIds.indexOf(k)===-1){
          nextNode = k;      
          break;
        }
        else{
        //nextNode=nextNodeID++;
          nextNode=k+1;
        }
        k++;
      }while(k<=stateIds.length);


      var nodeId = nextNode,
        bConCount = 1,
        xPos = 200 + (20 * nodeId/2),
        yPos = 100 + (20 * nodeId/2),
        clr = getRandomColor(),
        connClr = shadeColor(clr, 0.5);
      
      if (data.have_assessment) {
        bConCount = 2;
      }
      stateIdValue.push(nodeId);

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


      for (var i = 0; i < bConCount; i++) {
        newNode.connectors.push({
          id: nextConnectorID++,
          type: flowchartConstants.bottomConnectorType,
        });
       
      }

     // console.log('state_id',stateIdValue);

      stateCount++;
      //console.log('stateCount',stateCount);
      vm.model.nodes.push(newNode);
      saveConnectorMapping(newNode);
      //console.log('before saving drafts');
      if(stateCount === 2) {
        //console.log('start saving is called');
        startSavingDrafts();
      }
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
          controller: 'EditStateModalController',
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
      } else {
        var counter = 0,
          tcounter = 0,
          nodeObject = {};
        angular.forEach(vm.model.nodes, function (value, key) {
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
          angular.forEach(bottomConnectorValues, function(value, key){  
            var srcId = value.id,
              destId = edgeMappingList['E' + value.id],
              srcObj = connectorsMappingList['C' + srcId],
              destObj = connectorsMappingList['C' + destId];
              //console.log(srcId,destId);
              //console.log(srcObj,destObj);
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
          data.wkdata = dataPushed;
          data.wktransitions = tcounter;
          callback(data);
        }
      }
    }

    function saveDrafts() {
      console.log('save draft is called');
      if(document.cookie.indexOf('name')>=0){
        var value = document.cookie;
        var cookieValue = value.split(';');
        console.log('cookieValue',cookieValue);
        if (cookieValue.length > 1) {
            //parts = parts.pop().split(";").shift();
          cookieValue = cookieValue[0];
        }
        console.log('cookie',cookieValue);
        console.log('cookie is called');
        var draft = JSON.parse(cookieValue);
        console.log('after jsonparse draft',draft);
        WKdraftService.save(draft, function(sucess){
          document.cookie = 'name' + ':;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          console.log('after deletion cookie value',JSON.stringify(document.cookie));
        },function(error){
          document.cookie = JSON.stringify(draft);
        });
      }
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
            //document.cookie = "draft = {};draft.name = (new Date()).toISOString(); draft.visualdata = vm.model;draft.data = data.wkdata;draft.draftId = currentDraftID;draft.eid = enterprise;"
            document.cookie = JSON.stringify(draft);
            console.log('cookie',document.cookie);
          });
        }
      });
    }
    
    // Saving draft every 1 minute.
    var timeout;    
    function startSavingDrafts() {
      console.log('setTimeOut is called');  
      //saveDrafts();
      //$interval(saveDrafts, 10000);
      /*document.onmousemove = function(){
        clearTimeout(timeout);
        timeout = setTimeout(function(){
          console.log('setTimeOut is called');
          saveDrafts();
        }, 10000);
      }; */
      /*$scope.$on('IdleTimeout', function() {
        console.log('inside idle time out is called');    
        saveDrafts();
        Idle.watch();
      });*/
      $scope.$on('IdleStart', function() {
        console.log('Idle start is called');
        saveDrafts();
       // the user appears to have gone idle
      });
      $scope.$on('IdleEnd', function() {
        console.log('Idle end is called');
      });

    }

     // Saving draft every mouse event happens.
    function startSavingDraftsmouse() {
      //saveDrafts();
      $interval(saveDrafts, 60000);
    }

    // Open modal form to add a new state to the workflow
    vm.saveWorkflowModal = function (size, parentSelector, $document) {
      var parentElem = parentSelector ? angular.element($document[0].querySelector('.modal-demo ' + parentSelector)) : undefined,
        modalInstance = $modal.open({
          animation: true,
          ariaLabelledBy: 'modal-title',
          ariaDescribedBy: 'modal-body',
          templateUrl: 'modules/workflows/client/views/modal/workflow-setting.modal.client.view.html',
          controller: 'WorkflowSettingModalController',
          controllerAs: 'vm',
          backdrop: 'static',
          size: size,
          scope: $scope,
          appendTo: parentElem
        });
    };

    $scope.$on('saveWorkflow', function (evt, data) {
      createWorkflowdDataFromVisualData(function (cdata) {    
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
    .controller('AddStateModalController', AddStateModalController);

  AddStateModalController.$inject = ['$modalInstance', '$scope'];

  function AddStateModalController($modalInstance, $scope) {
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
      //console.log(vm);
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
    .controller('EditStateModalController', EditStateModalController);

  EditStateModalController.$inject = ['$modalInstance', '$scope'];

  function EditStateModalController($modalInstance, $scope) {
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
    .controller('WorkflowSettingModalController', WorkflowSettingModalController);

  WorkflowSettingModalController.$inject = ['$modalInstance', '$scope'];

  function WorkflowSettingModalController($modalInstance, $scope) {
    var vm = this;

    vm.workflow = {};
    vm.error = null;
    vm.form = {};
    vm.cancel = cancel;
    vm.saveWorkflow = save;
    
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
