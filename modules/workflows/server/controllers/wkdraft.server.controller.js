'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Wkdraft = mongoose.model('Wkdraft'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Create a Wkdraft
 */
exports.create = function(req, res) {
  var wkdraft = new Wkdraft(req.body);
  wkdraft.user = req.user;
  wkdraft.markModified('visualdata');
  wkdraft.markModified('data');

  wkdraft.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(wkdraft);
    }
  });
};

/**
 * List of Wkdrafts
 */
exports.list = function(req, res) {
  //var draftList = req.draftList ? req.draftList : {};

  var id = req.draftId;

  Wkdraft.find({ draftId: id }).sort('-created').exec(function (err, list) {
    if (err) {
      console.log(err);
    } else if (!list) {
      return res.status(404).send({
        message: 'No Wkdraft List with that identifier has been found'
      });
    }
    res.jsonp(list);
  });
  
};


exports.listbyEid = function(req, res) {
  //var eidDraftList = req.eidDraftList ? req.eidDraftList : {};

  var eid = req.eid;
  console.log('eiddddd',eid);
  Wkdraft.aggregate([
     { $match:{ 'eid':eid } },
    {
      $group : { 
        _id : '$draftId', 
        total : { $sum : 1 },
        'cdt': { $max: '$created' }  
      }
    },{ $sort:{ '_id':-1 } }
  ],function(err,data){
    if(err){
      console.log(err);
    }
      else{
        //console.log('dataaa',data);
      res.jsonp(data);
    }
  });
   
};

exports.read = function(req,res){
  //console.log('req.workflow',req.wkDraft);
  var workflow = req.wkDraft ? req.wkDraft.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  workflow.isCurrentUserOwner = req.user && workflow.user && workflow.user._id.toString() === req.user._id.toString();

  res.jsonp(workflow);
};

/**
 * List of Wkdrafts
 */
exports.currentId = function(req, res) {
  Wkdraft.findOne().sort('-draftId').exec(function(err, current) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(current);
    }
  });
};

/**
 * Wkdraft middleware
 */
exports.wkdraftById = function(req, res, next, id) {
  console.log('String',typeof(id));
  if (typeof id !== 'string') {
    return res.status(400).send({
      message: 'Invalid draft ID'
    });
  }
  req.draftId = id;
  next();
};

/**
 * Wkdraft middleware
 */
exports.wkdraftByEid = function(req, res, next, id) {

  if (typeof id !== 'string') {
    return res.status(400).send({
      message: 'Invalid Enterprise ID'
    });
  }
  req.eid = id;
  next();

};


/**
 * Wkdraft middleware
 */
exports.wkdraftBy_id = function(req, res, next , id){
  console.log('id',id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Invalid draft ID'
    });
  }
  Wkdraft.findById(id).populate('user', 'displayName').exec(function (err, wkDraft) {
    if (err) {
      return next(err);
    } else if (!wkDraft) {
      return res.status(404).send({
        message: 'No wkDraft with that identifier has been found'
      });
    }
    req.wkDraft = wkDraft;
    next();
  });
};