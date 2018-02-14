'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Workflow = mongoose.model('Workflow'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Create a Workflow
 */
exports.create = function(req, res) {
  var workflow = new Workflow(req.body);
  workflow.user = req.user;
  workflow.markModified('visualdata');
  workflow.markModified('data');

  workflow.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(workflow);
    }
  });
};

/**
 * Show the current Workflow
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var workflow = req.workflow ? req.workflow.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  workflow.isCurrentUserOwner = req.user && workflow.user && workflow.user._id.toString() === req.user._id.toString();

  res.jsonp(workflow);
};

/**
 * Update a Workflow
 */
exports.update = function(req, res) {
  var workflow = req.workflow;

  workflow = _.extend(workflow, req.body);
  workflow.markModified('visualdata');
  workflow.markModified('data');

  workflow.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(workflow);
    }
  });
};

/**
 * Update a WorkflowCourse
 */
exports.updateCourse = function(req, res) {
  //var workflow = req.workflow;
  var oldCourseId=req.body.oldCourseId;
  var oldCourseName=req.body.oldCourseName;
  var newCourseName=req.body.newCourseName;
  var newCourseId=req.body.newCourseId;
  //workflow list which contain oldcourse(i.e courses that are changes)
  Workflow.find({ 'visualdata.nodes.config_data.course':oldCourseId },function(err,workflow){
    if(err){
      console.log(err);
      res.json(err);
    }
   else{
      workflow.forEach(function(workflowData){
        workflowData.visualdata.nodes.forEach(function(workflowVisualData){
          var visualdata_stateId = workflowVisualData.config_data.stateId;
          if(workflowVisualData.config_data.course === oldCourseId){
            Workflow.update({ 'visualdata.nodes.config_data.course':oldCourseId ,'visualdata.nodes.config_data.stateId':visualdata_stateId,'data.stateId':visualdata_stateId },
            { $set:{
              'visualdata.nodes.$.config_data.course': newCourseId,
              'visualdata.nodes.$.config_data.coursename':newCourseName,
              'data.$.courseId':newCourseId,
              'data.$.courseName':newCourseName
            }
          },function(err,data){
            if(err){
              console.log(err);
              res.json(err);
            }
          });

          }
        });

      });
      res.jsonp('status : Ok');
    }

  });
};

 

/**
 * Delete an Workflow
 */
exports.delete = function(req, res) {
  var workflow = req.workflow;

  workflow.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(workflow);
    }
  });
};

/**
 * List of Workflows
 */
exports.list = function(req, res) {
  Workflow.find().sort('-created').populate('user', 'displayName').exec(function(err, workflows) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(workflows);
    }
  });
};

/**
 * Show the list of Workflow's by enterprise
 */
exports.list2 = function(req, res) {
  // convert mongoose document to JSON
  var workflows = req.wfByEid ? req.wfByEid : {};

  res.jsonp(workflows);
};

/**
 * Workflow middleware
 */
exports.workflowByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Workflow is invalid'
    });
  }

  Workflow.findById(id).populate('user', 'displayName').exec(function (err, workflow) {
    if (err) {
      return next(err);
    } else if (!workflow) {
      return res.status(404).send({
        message: 'No Workflow with that identifier has been found'
      });
    }
    req.workflow = workflow;
    next();
  });
};

/**
 * Workflow middleware
 */
exports.workflowByEID = function(req, res, next, id) {

  if (typeof id !== 'string') {
    return res.status(400).send({
      message: 'Invalid Enterprise ID'
    });
  }

  Workflow.find({ eid: id }).populate('user', 'displayName').sort('-created').exec(function (err, workflows) {
    if (err) {
      return next(err);
    } else if (!workflows) {
      return res.status(404).send({
        message: 'No Workflows with that identifier has been found'
      });
    }
    req.wfByEid = workflows;
    next();
  });
};


