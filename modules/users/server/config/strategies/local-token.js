'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  User = require('mongoose').model('User'),
  jwt = require('jsonwebtoken'),
  path = require('path'),
  config = require(path.resolve('./config/config'));

module.exports = function() {
  // Use local strategy
  passport.use('local-token', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  },
  function(username, password, done) {
    User.findOne({
      username: username
    }, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, {
          message: 'Unknown user'
        });
      }
      if (!user.authenticate(password)) {
        return done(null, false, {
          message: 'Invalid password'
        });
      }

      var tokenPayload = {
        username: user.username,
        loginExpires: user.loginExpires
      };

      // add token and exp date to user object
      user.loginToken = jwt.sign(tokenPayload, config.sessionSecret);
      user.loginExpires = Date.now() + (8760 * 60 * 60 * 1000); // 365 days

      // save user object to update database
      user.save(function(err) {
        if(err){
          done(err);
        } else {
          done(null, user);
        }
      });

    });
  }
  ));
};
