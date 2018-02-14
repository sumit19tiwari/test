//This service is used to find Invalid workflow but not find which path is invalid(means which path is not connected to end node)

(function(){
  'use strict';
  angular.module('workflows')
    .factory('WorkflowsValidationService',WorkflowsValidationService);   

  function WorkflowsValidationService() {
    return {
      validate: function (wkVisualModel, wkModel,edgeMappingList) {
        var counter=0;
        var startNode;
        var endNode;
        var bottomEdgeCount;
        var topEdgeCount;
        var edgeMappingListLength=Object.keys(edgeMappingList).length;
 
        //loop to find start and end node 
        for(var i=0; i < wkModel.length; i++){
          if(wkModel[i].stateId==='S1'){
            startNode=wkModel[i].stateId;
          }
          if(!wkModel[i].transition.hasOwnProperty('nextState')){
            counter++;
            endNode=wkModel[i].stateId;
          } 
        }

        var midNodeCount=0;
        for(var j=0 ; j < wkVisualModel.nodes.length;j++){
          bottomEdgeCount=0;
          topEdgeCount=0;
          for(var k=0 ; k<wkVisualModel.nodes[j].connectors.length; k++){
        			
            if(wkVisualModel.nodes[j].connectors[k].type==='bottomConnector'){	
        				//if('E'+edgeMappingList[ 'E'+ wkVisualModel.nodes[j].connectors[k].id ]  !== 'undefined'  && 'E'+edgeMappingList[ 'E'+ wkVisualModel.nodes[j].connectors[k].id ] !== ""){
                  
                //check whether key is exist(for valid bottom connector)
              if(edgeMappingList.hasOwnProperty('E'+wkVisualModel.nodes[j].connectors[k].id)){
                bottomEdgeCount++;
              }
            }
          else if(wkVisualModel.nodes[j].connectors[k].type==='topConnector'){

          //check whether value is exist(for valid top connector)
            if (Object.values(edgeMappingList).indexOf(wkVisualModel.nodes[j].connectors[k].id) > -1) {
              topEdgeCount++;
            }
          }
        			
          }
          //condition for nodes except first and last node.
          if(bottomEdgeCount>0 && topEdgeCount>0){
            midNodeCount++;
          }		

        } 
        //check condition for 
        if(midNodeCount!==(wkVisualModel.nodes.length-2) || edgeMappingListLength===0 || typeof startNode==='undefined'){
          return false;
        }
        return true;
      }

    };
  }

}());
