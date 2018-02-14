'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Workflow = mongoose.model('Workflow'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  workflow;

/**
 * Workflow routes tests
 */
describe('Workflow CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new Workflow
    user.save(function () {
      workflow = {
        name: 'Workflow name'
      };

      done();
    });
  });

  it('should be able to save a Workflow if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Workflow
        agent.post('/api/workflows')
          .send(workflow)
          .expect(200)
          .end(function (workflowSaveErr, workflowSaveRes) {
            // Handle Workflow save error
            if (workflowSaveErr) {
              return done(workflowSaveErr);
            }

            // Get a list of Workflows
            agent.get('/api/workflows')
              .end(function (workflowsGetErr, workflowsGetRes) {
                // Handle Workflows save error
                if (workflowsGetErr) {
                  return done(workflowsGetErr);
                }

                // Get Workflows list
                var workflows = workflowsGetRes.body;

                // Set assertions
                (workflows[0].user._id).should.equal(userId);
                (workflows[0].name).should.match('Workflow name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Workflow if not logged in', function (done) {
    agent.post('/api/workflows')
      .send(workflow)
      .expect(403)
      .end(function (workflowSaveErr, workflowSaveRes) {
        // Call the assertion callback
        done(workflowSaveErr);
      });
  });

  it('should not be able to save an Workflow if no name is provided', function (done) {
    // Invalidate name field
    workflow.name = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Workflow
        agent.post('/api/workflows')
          .send(workflow)
          .expect(400)
          .end(function (workflowSaveErr, workflowSaveRes) {
            // Set message assertion
            (workflowSaveRes.body.message).should.match('Please fill Workflow name');

            // Handle Workflow save error
            done(workflowSaveErr);
          });
      });
  });

  it('should be able to update an Workflow if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Workflow
        agent.post('/api/workflows')
          .send(workflow)
          .expect(200)
          .end(function (workflowSaveErr, workflowSaveRes) {
            // Handle Workflow save error
            if (workflowSaveErr) {
              return done(workflowSaveErr);
            }

            // Update Workflow name
            workflow.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Workflow
            agent.put('/api/workflows/' + workflowSaveRes.body._id)
              .send(workflow)
              .expect(200)
              .end(function (workflowUpdateErr, workflowUpdateRes) {
                // Handle Workflow update error
                if (workflowUpdateErr) {
                  return done(workflowUpdateErr);
                }

                // Set assertions
                (workflowUpdateRes.body._id).should.equal(workflowSaveRes.body._id);
                (workflowUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Workflows if not signed in', function (done) {
    // Create new Workflow model instance
    var workflowObj = new Workflow(workflow);

    // Save the workflow
    workflowObj.save(function () {
      // Request Workflows
      request(app).get('/api/workflows')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Workflow if not signed in', function (done) {
    // Create new Workflow model instance
    var workflowObj = new Workflow(workflow);

    // Save the Workflow
    workflowObj.save(function () {
      request(app).get('/api/workflows/' + workflowObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', workflow.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Workflow with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/workflows/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Workflow is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Workflow which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Workflow
    request(app).get('/api/workflows/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Workflow with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Workflow if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Workflow
        agent.post('/api/workflows')
          .send(workflow)
          .expect(200)
          .end(function (workflowSaveErr, workflowSaveRes) {
            // Handle Workflow save error
            if (workflowSaveErr) {
              return done(workflowSaveErr);
            }

            // Delete an existing Workflow
            agent.delete('/api/workflows/' + workflowSaveRes.body._id)
              .send(workflow)
              .expect(200)
              .end(function (workflowDeleteErr, workflowDeleteRes) {
                // Handle workflow error error
                if (workflowDeleteErr) {
                  return done(workflowDeleteErr);
                }

                // Set assertions
                (workflowDeleteRes.body._id).should.equal(workflowSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Workflow if not signed in', function (done) {
    // Set Workflow user
    workflow.user = user;

    // Create new Workflow model instance
    var workflowObj = new Workflow(workflow);

    // Save the Workflow
    workflowObj.save(function () {
      // Try deleting Workflow
      request(app).delete('/api/workflows/' + workflowObj._id)
        .expect(403)
        .end(function (workflowDeleteErr, workflowDeleteRes) {
          // Set message assertion
          (workflowDeleteRes.body.message).should.match('User is not authorized');

          // Handle Workflow error error
          done(workflowDeleteErr);
        });

    });
  });

  it('should be able to get a single Workflow that has an orphaned user reference', function (done) {
    // Create orphan user creds
    var _creds = {
      username: 'orphan',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create orphan user
    var _orphan = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'orphan@test.com',
      username: _creds.username,
      password: _creds.password,
      provider: 'local'
    });

    _orphan.save(function (err, orphan) {
      // Handle save error
      if (err) {
        return done(err);
      }

      agent.post('/api/auth/signin')
        .send(_creds)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var orphanId = orphan._id;

          // Save a new Workflow
          agent.post('/api/workflows')
            .send(workflow)
            .expect(200)
            .end(function (workflowSaveErr, workflowSaveRes) {
              // Handle Workflow save error
              if (workflowSaveErr) {
                return done(workflowSaveErr);
              }

              // Set assertions on new Workflow
              (workflowSaveRes.body.name).should.equal(workflow.name);
              should.exist(workflowSaveRes.body.user);
              should.equal(workflowSaveRes.body.user._id, orphanId);

              // force the Workflow to have an orphaned user reference
              orphan.remove(function () {
                // now signin with valid user
                agent.post('/api/auth/signin')
                  .send(credentials)
                  .expect(200)
                  .end(function (err, res) {
                    // Handle signin error
                    if (err) {
                      return done(err);
                    }

                    // Get the Workflow
                    agent.get('/api/workflows/' + workflowSaveRes.body._id)
                      .expect(200)
                      .end(function (workflowInfoErr, workflowInfoRes) {
                        // Handle Workflow error
                        if (workflowInfoErr) {
                          return done(workflowInfoErr);
                        }

                        // Set assertions
                        (workflowInfoRes.body._id).should.equal(workflowSaveRes.body._id);
                        (workflowInfoRes.body.name).should.equal(workflow.name);
                        should.equal(workflowInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Workflow.remove().exec(done);
    });
  });
});
