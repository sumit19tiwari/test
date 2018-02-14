'use strict';

/**
 * Module dependencies
 */
var jobsPolicy = require('../policies/jobs.server.policy'),
  jobs = require('../controllers/jobs.server.controller'),
  path = require('path'),
  users = require(path.resolve('./modules/users/server/controllers/users.server.controller'));

module.exports = function(app) {
  // Jobs Routes
  app.route('/api/jobs').all(jobsPolicy.isAllowed)
    .get(jobs.list)
    .post(jobs.create);

  app.route('/api/jobs/:jobId').all(jobsPolicy.isAllowed)
    .get(jobs.read)
    .put(jobs.update)
    .delete(jobs.delete);

  app.route('/api/:eid/jobs').all(jobsPolicy.isAllowed)
    .get(jobs.list2);

  app.route('/api/ext/saas/jobs').post(jobs.bulk, users.requiresLoginToken);

  app.route('/api/ext/jobs/updateJob').put(jobs.updateCourse , users.requiresLoginToken);
  app.route('/api/jobs/updateJob').all(jobsPolicy.isAllowed)
   .put(jobs.updateCourse); 

  // Finish by binding the Job middleware
  app.param('jobId', jobs.jobByID);
  app.param('eid', jobs.jobByEID);
};
