// Workflows service used to communicate Workflows REST endpoints
(function () {
  'use strict';
  angular.module('workflows')
    .factory('WKdraftService', WKdraftService);

  WKdraftService.$inject = ['$http','$resource'];

  function WKdraftService($http,$resource) {
    return {
      current: function (successCB, failureCB) {
        return $http.get('/api/workflows/draft/current/id').then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          successCB(response);
        }, function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          failureCB(response);
        });
      },
      query: function (draftId, successCB, failureCB) {
        return $http.get('/api/workflows/draft/'+draftId).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          successCB(response);
        }, function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          failureCB(response);
        });
      },
      save: function (data,successCB, failureCB) {
        return $http.post('/api/workflows/draft',data).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          successCB(response);
        }, function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          failureCB(response);
        });
      },
      getDraftById: function(wkDraftId, successCB ,failureCB){
        //console.log('getdraftApiservice is called');
        //console.log('wkDraftId',wkDraftId);
        return $http.get('/api/workflows/wkdraft/'+wkDraftId).then(function successCallback(response) {
          //console.log(response);
          successCB(response);
        },function errorCallback(response) {

          failureCB(response);
        });
      }
      
    };
  }
}());
