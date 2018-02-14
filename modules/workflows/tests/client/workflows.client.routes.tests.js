(function () {
  'use strict';

  describe('Workflows Route Tests', function () {
    // Initialize global variables
    var $scope,
      WorkflowsService;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _WorkflowsService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      WorkflowsService = _WorkflowsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('workflows');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/workflows');
        });

        it('Should be abstract', function () {
          expect(mainstate.abstract).toBe(true);
        });

        it('Should have template', function () {
          expect(mainstate.template).toBe('<ui-view/>');
        });
      });

      describe('View Route', function () {
        var viewstate,
          WorkflowsController,
          mockWorkflow;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('workflows.view');
          $templateCache.put('modules/workflows/client/views/view-workflow.client.view.html', '');

          // create mock Workflow
          mockWorkflow = new WorkflowsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Workflow Name'
          });

          // Initialize Controller
          WorkflowsController = $controller('WorkflowsController as vm', {
            $scope: $scope,
            workflowResolve: mockWorkflow
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:workflowId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.workflowResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            workflowId: 1
          })).toEqual('/workflows/1');
        }));

        it('should attach an Workflow to the controller scope', function () {
          expect($scope.vm.workflow._id).toBe(mockWorkflow._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('modules/workflows/client/views/view-workflow.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          WorkflowsController,
          mockWorkflow;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('workflows.create');
          $templateCache.put('modules/workflows/client/views/form-workflow.client.view.html', '');

          // create mock Workflow
          mockWorkflow = new WorkflowsService();

          // Initialize Controller
          WorkflowsController = $controller('WorkflowsController as vm', {
            $scope: $scope,
            workflowResolve: mockWorkflow
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.workflowResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/workflows/create');
        }));

        it('should attach an Workflow to the controller scope', function () {
          expect($scope.vm.workflow._id).toBe(mockWorkflow._id);
          expect($scope.vm.workflow._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('modules/workflows/client/views/form-workflow.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          WorkflowsController,
          mockWorkflow;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('workflows.edit');
          $templateCache.put('modules/workflows/client/views/form-workflow.client.view.html', '');

          // create mock Workflow
          mockWorkflow = new WorkflowsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Workflow Name'
          });

          // Initialize Controller
          WorkflowsController = $controller('WorkflowsController as vm', {
            $scope: $scope,
            workflowResolve: mockWorkflow
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:workflowId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.workflowResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            workflowId: 1
          })).toEqual('/workflows/1/edit');
        }));

        it('should attach an Workflow to the controller scope', function () {
          expect($scope.vm.workflow._id).toBe(mockWorkflow._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('modules/workflows/client/views/form-workflow.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
}());
