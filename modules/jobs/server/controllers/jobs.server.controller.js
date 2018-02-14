'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Job = mongoose.model('Job'),
  ReportLog = mongoose.model('ReportLog'),
  Workflow = mongoose.model('Workflow'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Create a Job
 */
exports.create = function(req, res) {
  var job = new Job(req.body);
  job.user = req.user;
  job.markModified('current');
  job.markModified('data');

  job.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(job);
    }
  });
};

/**
 * Create a bulk Jobs
 */
exports.bulk = function(req, res) {
  
  if(! (req.body && req.body.workflow && req.body.assignedOn && req.body.users && req.body.eid)) {
    return res.status(500).send({
      message: 'Missing Data'
    });
  }

  var workflow = req.body.workflow,
    users = req.body.users,
    errCount = 1,
    newJob;

  //workflows.forEach(function (workflow) {
  users.forEach(function(value) {
    newJob = new Job();
    newJob.markModified('current');
    newJob.markModified('data');

    newJob.userid = value.userid;
    newJob.username = value.username;
    newJob.workflow = workflow;
    newJob.data = workflow.data;
    newJob.assignedOn = req.body.assignedOn;
    newJob.eid = req.body.eid;
    newJob.user = req.user;

    newJob.save(function(err) {
      if (err) {
        errCount++;
      }
    });
    newJob = null;
  });
  //});
  
  if (errCount === 1) {
    return res.status(201).send({
      message: 'Job assigned successfully to all users.'
    });
  } else {
    return res.status(500).send({
      message: 'Job could not be assigned to one or more users.'
    });
  }
  
};

/**
 * Show the current Job
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var job = req.job ? req.job.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  job.isCurrentUserOwner = req.user && job.user && job.user._id.toString() === req.user._id.toString();

  res.jsonp(job);
};

/**
 * Update a Job
 */
exports.update = function(req, res) {
  var job = req.job;

  job = _.extend(job, req.body);
  job.markModified('current');
  job.markModified('data');

  job.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(job);
    }
  });
};



/**
 * Update a course
 */

exports.updateCourse = function(req, res) {
  var oldCourseId=req.body.oldCourseId;
  var oldCourseName=req.body.oldCourseName;
  var newCourseName=req.body.newCourseName;
  var newCourseId=req.body.newCourseId;

  Job.find({ $and:[{ 'data.courseId':oldCourseId },{ 'status':'A' }] },function(err,jobUpdateData){
    if(err){
      console.log(err);
      res.json(err);
    }
     else{
      jobUpdateData.forEach(function(jobData){
        var currentState=jobData.current.stateId;
        var workflowId=jobData.workflow;
        var jobId=jobData._id;
        var state=[];
        jobData.data.forEach(function(stateIdData){
          if(stateIdData.courseId===oldCourseId){
            state.push(stateIdData.stateId);
                //console.log('state',state);
          }
        });

        state.forEach(function(changeState){
             // for(var changeState=0 ; changeState<state.length;changeState++)
             // {
          if(currentState !== changeState){
            Job.update({ 'data.courseId':oldCourseId,workflow :workflowId , _id :jobId },
                  { $set:{
                    'data.$.courseId': newCourseId,
                    'data.$.courseName': newCourseName,
                  }
                  },/*{ arrayFilters:[{'i.stateId':state[changeState] }]}*/function(err,data){
                    if(err){
                      console.error(err);
                    }
                  });
          }
              else if(currentState===changeState){
                Job.update({ 'data.courseId':oldCourseId ,workflow : workflowId ,_id:jobId },
                { $set:{
                  'data.$.courseId':newCourseId,
                  'data.$.courseName':newCourseName,
                  'current.courseId':newCourseId,
                  'current.courseName':newCourseName
                }
                },function(err,data){
                  if(err){
                    console.error(err);
                  }
                });
              }


        });
             // }
      });
      res.jsonp('status :Ok');
    } 
  });   

};

/**
 * Delete an Job
 */
exports.delete = function(req, res) {
  var job = req.job;

  job.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(job);
    }
  });
};

/**
 * List of Jobs
 */
exports.list = function(req, res) {
  Job.find().sort('-created').populate('user', 'displayName').populate('workflow', 'name').exec(function(err, jobs) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(jobs);
    }
  });
};

/**
 * Show the current Job list
 */
exports.list2 = function(req, res) {
  // convert mongoose document to JSON
  var jobs = req.jobsByEid ? req.jobsByEid : {};

  res.jsonp(jobs);
};

/**
 * Job middleware
 */
exports.jobByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Job is invalid'
    });
  }

  Job.findById(id).populate('user', 'displayName').populate('workflow', 'name').exec(function (err, job) {
    if (err) {
      return next(err);
    } else if (!job) {
      return res.status(404).send({
        message: 'No Job with that identifier has been found'
      });
    }
    req.job = job;
    next();
  });
};

/**
 * Job middleware for enterprise id
 */
exports.jobByEID = function(req, res, next, id) {

  if (typeof id !== 'string') {
    return res.status(400).send({
      message: 'Invalid Enterprise ID'
    });
  }

  Job.find({ eid: id }).populate('user', 'displayName').populate('workflow', 'name').sort('-created').exec(function (err, jobs) {
    if (err) {
      return next(err);
    } else if (!jobs) {
      return res.status(404).send({
        message: 'No Job with that identifier has been found'
      });
    }
    req.jobsByEid = jobs;
    next();
  });
};
