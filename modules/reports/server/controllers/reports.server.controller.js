'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  ReportLog = mongoose.model('ReportLog'),
  Job = mongoose.model('Job'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Create a ReportLog
 */
exports.create = function(req, res) {
  var reportLog = new ReportLog(req.body);
  reportLog.user = req.user;
  reportLog.markModified('log');

  reportLog.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(reportLog);
    }
  });
};

/**
 * Show the current ReportLog
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var reportLog = req.reportLog ? req.reportLog.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  reportLog.isCurrentUserOwner = req.user && reportLog.user && reportLog.user._id.toString() === req.user._id.toString();

  res.jsonp(reportLog);
};

/**
 * Update a ReportLog
 */
exports.update = function(req, res) {
  var reportLog = req.reportLog;

  reportLog = _.extend(reportLog, req.body);

  reportLog.markModified('log');

  reportLog.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(reportLog);
    }
  });
};

/**
 * Delete an ReportLog
 */
exports.delete = function(req, res) {
  var reportLog = req.reportLog;

  reportLog.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(reportLog);
    }
  });
};

/**
 * List of ReportLogs
 */
exports.list = function(req, res) {
  ReportLog.find().sort('-created').populate('user', 'displayName').exec(function(err, reportLogs) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(reportLogs);
    }
  });
};

/**
 * Show the current ReportLogs list by Eid
 */
exports.list2 = function(req, res) {
  // convert mongoose document to JSON
  var reportLog = req.reportLog ? req.reportLog : {};

  res.jsonp(reportLog);
};

/**
 * ReportLog middleware
 */
exports.reportByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'ReportLog is invalid'
    });
  }

  ReportLog.findById(id).populate('user', 'displayName').exec(function (err, reportLog) {
    if (err) {
      return next(err);
    } else if (!reportLog) {
      return res.status(404).send({
        message: 'No ReportLog with that identifier has been found'
      });
    }
    req.reportLog = reportLog;
    next();
  });
};

/**
 * Workflow middleware
 */
exports.reportByEID = function(req, res, next, id) {

  if (typeof id !== 'string') {
    return res.status(400).send({
      message: 'Invalid Enterprise ID'
    });
  }
  req.eid = id;
  next();
};



exports.workflowByID = function(req, res, next, id) {

  if (typeof id !== 'string') {
    return res.status(400).send({
      message: 'Invalid workflowID ID'
    });
  }
  req.wid = id;
  next();
};


//totaluser,notstarteduser,ongoinguser
exports.workflowStats = function(req, res) {
  Job.aggregate([
    { $match: { $and: [ { 'eid': req.eid }] } },
    { $group: {
      '_id': { 'workflow': '$workflow' },
      'totalUsers': { $sum:1 },
      'created': { $max: '$created' },
      'modified': { $max: '$modified' },
      'finishedUsers': { 
        '$sum': { 
          '$cond': [ { '$eq': [ '$status', 'F'] }, { $sum: 1 }, 0 ]
        }
      }
    }
    },
    { $sort: { modified: -1 } },
    { $lookup:{ from: 'workflows', localField: '_id.workflow', foreignField: '_id', as: 'workflowData' } },
    { $unwind: '$workflowData' },
    { $project: { 'workflowData.name': 1, '_id': 1, 'totalUsers': 1, 'finished': 1 } }
  ], function(err, jobData) {
    if(err){
      console.err(err);
    }
    else{
      ReportLog.aggregate([
        { $match: { $and: [ { 'eid': req.eid }, { 'type': 'durationLog' }, { 'log.stateId': 'S1' } ] } },
        { $group: {
          '_id': { 'workflow': '$log.workflow', 'state': '$log.stateId' },
          'notStarted': { $sum: '$log.notStarted' },
        },
        },
        { $group: { '_id': { 'workflow': '$_id.workflow' }, 'notStarted': { $sum: '$notStarted' } } }
      ], function(err, notstartedUserData) {
        if(err){
          console.err(err);
        }
        var ongoing = [];
        for(var i=0; i < jobData.length; i++)
        {
          for(var j=0; j < notstartedUserData.length; j++)
          {           
            if(JSON.stringify(jobData[i]._id.workflow) === JSON.stringify(notstartedUserData[j]._id.workflow))
            {
              var object= {
                'id': jobData[i]._id.workflow,
                'OngoingUser': (jobData[i].totalUsers - (notstartedUserData[j].notStarted + jobData[i].finished)),
                'notStartedUser': notstartedUserData[j].notStarted,
                'TotalNoOfUser': jobData[i].totalUsers,
                'finishedUser': jobData[i].finished,
                'createdOn': jobData[i].created,
                'workflowName': jobData[i].workflowData.name
              };
              ongoing.push(object);
            }
          }
        }
        res.jsonp(ongoing);
      });
    }
  });
};


//avg duration of a workflow
exports.workflowDuration = function(req, res) {
  ReportLog.aggregate([
    { $match:{ $and: [ { 'type': 'durationLog' }, { 'eid': req.eid }, { 'log.jobStatus': 'F' }] } },
    { $group:{ '_id': { 'workflow': '$log.workflow', 'job': '$log.jobId' }, 'sum': { $sum: '$log.duration' } } }, 
    { $group:{ '_id': { 'workflow': '$_id.workflow' }, 'avgDuration': { $avg: '$sum' } } }
  ], function(err, durationLogs){
    if (err) {
      console.err(err);
    }
    res.jsonp(durationLogs);
  });

};

//no of user(NotStarted,Ongoing,Finished) for a particular workflow
exports.singleWorkflowStats = function(req, res) {
  ReportLog.aggregate([
    { $match: { $and: [ { 'eid': req.eid }, { 'log.workflow': mongoose.Types.ObjectId(req.wid) }, { 'type': 'durationLog' }] } },
    { $group: {
      '_id': { 'workflow': '$log.workflow', 'state': '$log.stateId' },  
      'notStarted': { $sum: '$log.notStarted' },
      'ongoing': { $sum: '$log.ongoing' },
      'finished': { $sum: '$log.finished' }
    } 
    },
  ], function(err, singleWorkflowStatsData){
    if(err){
      console.err(err);
    }
    res.jsonp(singleWorkflowStatsData);
  });
};


exports.singleWorkflowDuration = function(req, res) {
  ReportLog.aggregate([
    { $match: { $and: [
        { 'eid': req.eid },
        { 'type':'durationLog' },
        { 'log.endDate': { $exists: true } },
        { 'log.workflow': mongoose.Types.ObjectId(req.wid) } ]
      }
    },
    { '$group': {
      '_id': { 'workflowId': '$log.workflow', 'state': '$log.stateId' },
      'avgDuration': { $avg: '$log.duration' }
    }
    }
  ], function(err, singleWorkflowDurationData){
    if(err){
      console.err(err);
    }
    res.json(singleWorkflowDurationData);
  });
};
