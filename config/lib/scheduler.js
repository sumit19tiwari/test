  'use strict';

  var config = require('../config'),
    schedule = require('node-schedule'),
    mongoose = require('mongoose'),
    chalk = require('chalk'),
    request = require('request'),
    _ = require('lodash');

  var BreakException = {};

  // count days
  function countDays (d1, d2) {
    var diff = d2 - d1;
    //console.info('diff = ', diff);
    if(diff > 864e5) {
      return Math.floor(diff / 864e5);
    }
    else
      return 0;
  }

  // add days to a date
  function addDays(_date, _noOfDays) {
    _date.setDate(_date.getDate() + _noOfDays);
    return _date;
  }

  // return promise to list all the new jobs that are created
  function getNewJobs () {
    return new Promise(function (resolve, reject) {
      var Job = mongoose.model('Job');
      Job.find({
        $and: [
          { status: 'A' },
          { current: { $exists: false } }
        ]
      }).sort('-created').exec(function (err, jobs) {
        if (err) {
          reject(new Error('Failed to load active jobs.'));
        } else {
          resolve(jobs);
        }
      });
    });
  }

  // return promise to list all the ongoing active jobs
  function getActiveJobs () {
    return new Promise(function (resolve, reject) {
      var Job = mongoose.model('Job');
      Job.find({
        $and: [
          { status: 'A' },
          { current: { $exists: true } }
        ]
      }).sort('-created').exec(function (err, jobs) {
        if (err) {
          reject(new Error('Failed to load active jobs.'));
        } else {
          resolve(jobs);
        }
      });
    });
  }

  // return promise to list all the completed jobs
  function getCompletedJobs () {
    return new Promise(function (resolve, reject) {
      var Job = mongoose.model('Job');
      Job.find({
        $and: [
          { status: 'C' },
          { current: { $exists: true } }
        ]
      }).sort('-current.completedOn').exec(function (err, jobs) {
        if (err) {
          reject(new Error('Failed to load active jobs.'));
        } else {
          resolve(jobs);
        }
      });
    });
  }

  //return promise to a course to a user
  function assignCourse(courseId, start, end, userid, eid) {
    return new Promise(function (resolve, reject) {
      var course = [],
        startDate = start.toISOString().replace('T', ' ').replace('Z', ''),
        endDate = end.toISOString().replace('T', ' ').replace('Z', '');
      course.push(courseId);
      //(YYYY-mm-dd hh:mm:ss)
      var postData = {
        courseAssignToUser: true,
        course_id: course,
        userids: userid,
        enterpriseid: eid,
        activation_date: startDate,
        deactivation_date: endDate
      };
      var options = {
        uri: 'https://api.capabiliti.co/utility/api/v2/course_assigner.php',
        method: 'POST',
        responseType: 'buffer',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: postData
      };
      //console.info('sending data = ', postData);
      var req = request(options, function(err, res, body) {
        if(err) {
          reject(err);
        }
        if(res.statusCode === 200 && body) {
          var b = JSON.parse(body);
          //console.log('getCourse Status body',b);
          resolve(b);
        }
      });
    });
  }

  // return a promise to get status of a course for a user
  function getCourseStatus(courseid, userid, eid) {
    return new Promise(function (resolve, reject) {

      var queryString = {
        course_id: courseid,
        user_id: userid,
        eid: eid,
      };
      var options = {
        uri: 'https://api.capabiliti.co/utility/api/v2/courses.php?f_name=get_course_status',
        method: 'GET',
        responseType: 'buffer',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        qs: queryString
      };
      //console.info('sending data = ', postData);
      var req = request(options, function(err, res, body) {
        if(err) {
          reject(err);
        }
        //console.error(res);
        if(res && res.statusCode === 200 && body) {
          var b = JSON.parse(body);
          resolve(b);
        }
      });
    });
  }

  // function to create job logs in the reporting module.
  function createJobLogs(updatedJobData, currentStateData){
    var ReportLog = mongoose.model('ReportLog');
    var jobLog = new ReportLog();
    jobLog.type = 'job';

    updatedJobData.current = currentStateData;

    jobLog.log = updatedJobData.toObject();
    jobLog.eid = updatedJobData.eid;
    
    jobLog.save();
  }

  // function to create duration logs in the reporting module.
  function createDurationLogs(updatedJobData, currentStateData){
    var ReportLog = mongoose.model('ReportLog');
    var durationLog = new ReportLog();
    durationLog.type = 'durationLog';

    var logData ={
      'workflow': updatedJobData.workflow,
      'jobId': updatedJobData._id,
      'userId': updatedJobData.userid,
      'userName': updatedJobData.username,
      'stateId': currentStateData.stateId,
      'startDate': currentStateData.startDate,
      'notStarted': 1,
      'ongoing': 0,
      'finished': 0,
      'jobStatus':'A'
    };

    durationLog.log = logData;
    durationLog.eid = updatedJobData.eid;
    
    durationLog.save();
  }

  // function to update existing duration logs in the reporting module.
  function updateDurationLogs(job, updateObj) {
    var ReportLog = mongoose.model('ReportLog');
    ReportLog.findOneAndUpdate(
      {
        'type': 'durationLog',
        'log.jobId': job._id,
        'log.stateId': job.current.stateId,
        'log.userId': job.userid,
        'log.workflow': job.workflow
      },
      updateObj, function(err, updatedReportLog){
        if(err)
          console.error('Error updating reportLog ->', err);
      });
  }

  // function to update existing duration logs in the reporting module.
  function completeDurationLogs(jobId) {
    var ReportLog = mongoose.model('ReportLog');
    var updateObj = {
      'log.jobStatus': 'F'
    };
    ReportLog.update(
      {
        'type': 'durationLog',
        'log.jobId': jobId,
      },
      updateObj,{ multi: true } ,function(err, updatedReportLog){
        if(err)
          console.error('Error updating reportLog ->', err);
      });
  }

  //setup new jobs
  function setupNewJobs() {
    getNewJobs().then(function (jobs) {
      var Job = mongoose.model('Job');
      var today = new Date(),
        assignDate = '',
        dayCount = 0;
      jobs.forEach(function (job) {
        
        assignDate = job.assignedOn;
        dayCount = countDays(today, assignDate);
        if(dayCount !== 0) {
          return;
        }

        var data = job.data,
          current = _.extend({}, job.current);
        try {
          data.forEach(function (state) {
            if(state.stateId === 'S1') {
              current = state;
              throw BreakException;
            }
          });
        } catch (e) {
          if (e !== BreakException) throw e;
        }
        current.startDate = (new Date());
        current.endDate = addDays(new Date(), current.duration);
        
        job.markModified('current');

        assignCourse(current.courseId, current.startDate, current.endDate, job.userid, job.eid).then(function (res){
          //console.info('assign result', res);
          var ifUpdate = false;
          if(res.status === 'success') {
            ifUpdate = true;
            current.status = 'ASSIGNED';
          }
          if(res.status === 'duplicate') {
            ifUpdate = true;
            current.status = 'RE-ASSIGNED';
          }
          if(ifUpdate) {
            var modDate = new Date();
            
            Job.findOneAndUpdate({ '_id' : new mongoose.Types.ObjectId(job._id) }, { current: current, modified: modDate }, function(err, updatedJob) {
              if(err)
                console.error('Error updating job -> ', err);
              else {
                //creating jobLog
                createJobLogs(updatedJob, current);

                //creating durationLog
                createDurationLogs(updatedJob, current);
              }
            });
          }
        }).catch(function(error){
          if(error){
            console.error('assigncourse promise rejected ->',error);
          }
        });
      });
    }).catch(function (error) {
      if(error)
        console.error('getNewJobs promise rejected -> ', error);
    });
  }

  // check job status and update accordingly
  function processJobs() {
    getActiveJobs().then(function (jobs) {
      var Job = mongoose.model('Job');
      var ReportLog = mongoose.model('ReportLog');
      var today = new Date(),
        dayCount = 0;
      try {
        jobs.forEach(function (job) {
          var current = job.current;
          //console.log(job);
          if(current.status === 'IN-TRANSITION') {
            //console.log('-------------- inside transition -------------');
            var nextId = current.nextId,
              nextDate = current.nextTransitionDate;

            dayCount = countDays(today, nextDate);
            //console.log(job._id, nextDate, dayCount, current.courseId, job.userid, job.eid);          
            if(dayCount !== 0) {
              return;
            }

            var data = job.data;
            current = {};
            try {
              data.forEach(function (state) {
                if(state.stateId === nextId) {
                  current = state;
                  throw BreakException;
                }
              });
            } catch (e) {
              if (e !== BreakException) throw e;
            }
            current.startDate = new Date();
            current.endDate = addDays(new Date(), current.duration);
            job.markModified('current');

            assignCourse(current.courseId, current.startDate, current.endDate, job.userid, job.eid).then(function (res) {
              //console.info('assign result', res);
              var ifUpdate = false;
              if(res.status === 'success') {
                ifUpdate = true;
                current.status = 'ASSIGNED';
              }
              if(res.status === 'duplicate') {
                ifUpdate = true;
                current.status = 'RE-ASSIGNED';
              }
              if(ifUpdate) {
                var modDate = new Date();
                //check and change to findOneAndUpdate for creating logs
                Job.findOneAndUpdate({ '_id' : new mongoose.Types.ObjectId(job._id) }, { current: current, modified: modDate }, function(err, updatedJob) {
                  if(err)
                    console.error('Error updating job -> ', err);
                  else {
                    //creating jobLog
                    createJobLogs(updatedJob, current);

                    //creating durationLog
                    createDurationLogs(updatedJob, current);
                  }
                });
              }
            });
          }
          if(current.status === 'ASSIGNED' || current.status === 'RE-ASSIGNED') {
            //console.log('-------------- inside course result check -------------');
            //console.log(current);
            getCourseStatus(current.courseId, job.userid, job.eid).then(function (res) {
              //console.info('status res = ', res);
              //console.log(job._id, current.courseId, job.userid, job.eid);
              var ifUpdate = false,
                ifCompleted = false;
              if(typeof current.transition.nextState !== 'undefined') {
                if(res.status === 'OK' && res.data.status === 'unattempted') {
                }
              //case when the course has not been completed but started 
                if(res.status === 'OK' && res.data.status === 'attempted') {
                  var updateObj = {
                    'log.notStarted': 0,
                    'log.ongoing': 1,
                    'log.finished': 0
                  };

                  updateDurationLogs(job, updateObj);
                }
                //case when the course has been completed and a score is generated
                if(res.status === 'OK' && res.data.status === 'finished') {

                  if(res.grading === 'D'){
                  //TODO get passing figure - right now considering only pass state
                  //console.log(typeof current.transition.nextState.pass);
                  //console.log(typeof current.transition.nextState.fail);
                    var score = res.data.score;
                    if(typeof current.transition.nextState.pass !== 'undefined' && typeof current.transition.nextState.fail !== 'undefined') {
                      current.status = 'IN-TRANSITION';
                    // the passing condition
                      if(score >= current.transition.condition) {
                        current.nextId = current.transition.nextState.pass;
                      } //the failing condition
                      else {
                        current.nextId = current.transition.nextState.fail;
                      }
                    } else if(typeof current.transition.nextState.pass !== 'undefined' && typeof current.transition.nextState.fail === 'undefined') {
                      if(typeof current.transition.condition !== 'undefined') {
                      // the passing condition
                        if(score >= current.transition.condition) {
                          current.nextId = current.transition.nextState.pass;
                          current.status = 'IN-TRANSITION';
                        }
                      } else {
                        current.nextId = current.transition.nextState.pass;
                        current.status = 'IN-TRANSITION';
                      }
                    }
                    if(current.status === 'IN-TRANSITION') {
                      if(current.transition.transitFlag === 'I') {
                        current.nextTransitionDate = addDays(new Date(), current.transition.timelapse);
                      } else if(current.transition.transitFlag === 'F') {
                        current.nextTransitionDate = addDays(new Date(current.endDate.getTime()), current.transition.timelapse);
                      }
                      ifUpdate = true;
                    }
                  }
                }
              } else {
                if(res.status === 'OK' && res.data.status === 'finished') {
                  current.status = 'COMPLETED';
                  current.completedOn = new Date();
                  ifCompleted = true;
                }
              }
              if(ifUpdate) {
                var modDate = new Date();

                Job.findOneAndUpdate({ '_id' : new mongoose.Types.ObjectId(job._id) }, { current: current, modified: modDate }, function(err, updatedJob) {
                  if(err)
                    console.error('Error updating job -> ', err);
                  else {
                    //creating jobLog
                    createJobLogs(updatedJob, current);
                    var duration = countDays(updatedJob.current.startDate, modDate);
                    
                    var updateObj = {
                      'log.endDate': modDate,
                      'log.duration': duration,
                      'log.notStarted': 0,
                      'log.ongoing': 0,
                      'log.finished': 1
                    };

                    updateDurationLogs(job, updateObj);
                  }
                });
              }
              if(ifCompleted) {
                var compModDate = new Date();

                Job.findOneAndUpdate({ '_id' : new mongoose.Types.ObjectId(job._id) }, { current: current, modified: compModDate, status: 'C' }, function(err, updatedJob) {
                  if(err)
                    console.error('Error updating job -> ', err);
                  else {
                    //creating jobLog
                    createJobLogs(updatedJob, current);

                    var duration=countDays(updatedJob.current.startDate, compModDate);

                    var updateObj = {
                      'log.endDate': compModDate,
                      'log.duration': duration,
                      'log.notStarted': 0,
                      'log.ongoing': 0,
                      'log.finished': 1
                    };

                    updateDurationLogs(job, updateObj);
                  }
                });
              }
            }).catch(function (error) {
              if(error)
                console.error('getCourseStatus promise rejected -> ', error);
            });
          }
        });
      } catch(eo) {
        if (eo !== BreakException) throw eo;
      }
    }).catch(function (error) {
      if(error)
        console.error('getActiveJobs promise rejected -> ', error);
    });
  }

  // check completed jobs and mark them finalized
  function finalizeJobs() {
    getCompletedJobs().then(function (jobs) {
      var Job = mongoose.model('Job');
      var ReportLog = mongoose.model('ReportLog');
      jobs.forEach(function (job) {
        var current=job.current;
        var modDate = new Date();

        Job.findOneAndUpdate({ '_id' : new mongoose.Types.ObjectId(job._id) }, { current:current ,modified: modDate, status: 'F' }, function(err, updatedJob) {
          if(err)
            console.error('Error updating job -> ', err);
          else {
            //creating jobLog
            createJobLogs(updatedJob, current);

            completeDurationLogs(job._id);
          }
        });
      });
    });
  }

  // run the core scheduler logic
  function run() {
    //setup new jobs if any
    setupNewJobs();

    //process all other active jobs
    processJobs();

    //finalize completed jobs
    finalizeJobs();
  }

  module.exports.start = function start() {
    //console.log('called start');
    //run();
    schedule.scheduleJob(config.scheduler.recurrance, function() {
      console.log(chalk.bold.red('Running scheduler at '+(new Date()).toString()));
      run();
    });
  };
