'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Job Schema
 */
var JobSchema = new Schema({
  userid: {
    type: String,
    required: 'Please fill User Id',
    trim: true
  },
  username: {
    type: String,
    required: 'Please fill User Name',
    trim: true
  },
  eid: {
    type: String,
    required: 'Please fill Enterprise Id',
    default: '1',
    trim: true
  },
  workflow: {
    type: Schema.ObjectId,
    ref: 'Workflow'
  },
  current:{
    type: Schema.Types.Mixed
  },
  data: [Schema.Types.Mixed],
  status: {
    type: String,
    default: 'A',
    trim: true
  },
  assignedOn: {
    type: Date,
    default: Date.now
  },
  created: {
    type: Date,
    default: Date.now
  },
  modified: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

mongoose.model('Job', JobSchema);
