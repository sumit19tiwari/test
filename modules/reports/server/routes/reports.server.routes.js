'use strict';

/**
 * Module dependencies
 */
var reportsPolicy = require('../policies/reports.server.policy'),
  reports = require('../controllers/reports.server.controller'),
  path = require('path'),
  users = require(path.resolve('./modules/users/server/controllers/users.server.controller'));

module.exports = function(app) {
  // Reports Routes

  app.route('/api/reports/:eid').all(reportsPolicy.isAllowed)
    .get(reports.list2);

  app.route('/api/ext/reports/ojt/:eid/stats').get(reports.workflowStats, users.requiresLoginToken);

  app.route('/api/ext/reports/ojt/:eid/duration').get(reports.workflowDuration, users.requiresLoginToken);

  app.route('/api/ext/reports/ojt/:eid/:workflowId/stats').get(reports.singleWorkflowStats, users.requiresLoginToken);

  app.route('/api/ext/reports/ojt/:eid/:workflowId/duration').get(reports.singleWorkflowDuration, users.requiresLoginToken);
  
  app.route('/api/reports/ojt/:eid/stats').all(reportsPolicy.isAllowed).get(reports.workflowStats);

  app.route('/api/reports/ojt/:eid/duration').all(reportsPolicy.isAllowed).get(reports.workflowDuration);

  app.route('/api/reports/ojt/:eid/:workflowId/stats').all(reportsPolicy.isAllowed).get(reports.singleWorkflowStats);
 
  app.route('/api/reports/ojt/:eid/:workflowId/duration').all(reportsPolicy.isAllowed).get(reports.singleWorkflowDuration);

  // Finish by binding the Report middleware
  app.param('eid', reports.reportByEID);
  app.param('workflowId', reports.workflowByID);
};
