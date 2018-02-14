'use strict';

/**
 * Module dependencies
 */
var wkdraftPolicy = require('../policies/wkdraft.server.policy'),
  wkdraft = require('../controllers/wkdraft.server.controller');

module.exports = function(app) {
  // Workflows Routes
  app.route('/api/workflows/draft').all(wkdraftPolicy.isAllowed)
    .post(wkdraft.create);

  app.route('/api/workflows/draft/:draftId').all(wkdraftPolicy.isAllowed)
    .get(wkdraft.list);

  app.route('/api/workflows/:eid/draft').all(wkdraftPolicy.isAllowed)
    .get(wkdraft.listbyEid);

  app.route('/api/workflows/draft/current/id').all(wkdraftPolicy.isAllowed)
    .get(wkdraft.currentId);

  app.route('/api/workflows/wkdraft/:wkDraftId').all(wkdraftPolicy.isAllowed)
    .get(wkdraft.read);  
 
  // Finish by binding the Workflow middleware
  app.param('draftId', wkdraft.wkdraftById);
  app.param('eid', wkdraft.wkdraftByEid);
  app.param('wkDraftId' ,wkdraft.wkdraftBy_id);
};
