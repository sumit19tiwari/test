'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Workflow Schema
 */
var WorkflowSchema = new Schema({
  name: {
    type: String,
    default: '',
    required: 'Please fill Workflow name',
    trim: true
  },
  eid: {
    type: String,
    required: 'Please fill Enterprise Id',
    default: '1',
    trim: true
  },
  visualdata: {
    type: Schema.Types.Mixed
  },
  data: [Schema.Types.Mixed],
  draftId: {
    type: Number,
    required: 'Please provide a draft id.'
  },
  created: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

mongoose.model('Workflow', WorkflowSchema);
