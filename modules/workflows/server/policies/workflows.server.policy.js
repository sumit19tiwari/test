'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Workflows Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/:eid/workflows',
      permissions: ['get']
    }, {
      resources: '/api/workflows',
      permissions: '*'
    }, {
      resources: '/api/workflows/:workflowId',
      permissions: '*'
    },{
      resources: '/api/workflows/updateWorkflow',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/:eid/workflows',
      permissions: ['get']
    }, {
      resources: '/api/workflows',
      permissions: ['get', 'post']
    }, {
      resources: '/api/workflows/:workflowId',
      permissions: ['get']
    }, {
      resources: '/api/workflows/updateWorkflow',
      permissions: '*'
    }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/:eid/workflows',
      permissions: ['get']
    }, {
      resources: '/api/workflows',
      permissions: ['get']
    }, {
      resources: '/api/workflows/:workflowId',
      permissions: ['get']
    },{
      resources: '/api/workflows/updateWorkflow',
      permissions: '*'
    }]
  }]);
};

/**
 * Check If Workflows Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If an Workflow is being processed and the current user created it then allow any manipulation
  if (req.workflow && req.user && req.workflow.user && req.workflow.user.id === req.user.id) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred
      return res.status(500).send('Unexpected authorization error');
    } else {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'User is not authorized'
        });
      }
    }
  });
};
