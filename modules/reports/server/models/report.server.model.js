'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Report Schema
 */
var ReportLogSchema = new Schema({
  type: {
    type: String,
    default: '',
    required: 'Please fill Report Log Type',
    trim: true
  },
  log: {
    type: Schema.Types.Mixed
  },
  eid: {
    type: String,
    required: 'Please fill Enterprise Id',
    default: '1',
    trim: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number
  }
});

mongoose.model('ReportLog', ReportLogSchema);
