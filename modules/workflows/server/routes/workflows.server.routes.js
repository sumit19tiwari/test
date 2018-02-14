'use strict';

/**
 * Module dependencies
 */
var workflowsPolicy = require('../policies/workflows.server.policy'),
  workflows = require('../controllers/workflows.server.controller'),
  path = require('path'),
  users = require(path.resolve('./modules/users/server/controllers/users.server.controller'));

module.exports = function(app) {
  // Workflows Routes
  app.route('/api/workflows').all(workflowsPolicy.isAllowed)
    .get(workflows.list)
    .post(workflows.create);

  app.route('/api/workflows/:workflowId').all(workflowsPolicy.isAllowed)
    .get(workflows.read)
    .put(workflows.update)
    .delete(workflows.delete);

  app.route('/api/:eid/workflows').all(workflowsPolicy.isAllowed)
    .get(workflows.list2);

  app.route('/api/ext/workflows/:eid').get(workflows.list2, users.requiresLoginToken);

  app.route('/api/ext/workflows/updateWorkflow').put(workflows.updateCourse , users.requiresLoginToken);
  app.route('/api/workflows/updateWorkflow').all(workflowsPolicy.isAllowed)
   .put(workflows.updateCourse);  
  // Finish by binding the Workflow middleware
  app.param('workflowId', workflows.workflowByID);
  app.param('eid', workflows.workflowByEID);
};
