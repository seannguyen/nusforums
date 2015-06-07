'use strict';

var UserController = {};
var Bcrypt = require('bcrypt');
var Crypto = require('crypto');
var Promise = require('bluebird');
var Collections = require('../db/collection.js');

UserController.login = function(req, res) {
  Collections.UserCollection.forge()
  .query(function(qb) {
  	qb.where('email', '=', req.body.email.toLowerCase());
  })
  .fetchOne()
  .then(function(user) {
  	if (user) {
  	  var hash = Bcrypt.hashSync(req.body.password, 10);
  	  if (Bcrypt.compareSync(hash, user.get('password'))) {
  	  	// if user has a token
  	  	if (user.get('token')) {
  	  	  return Promise.resolve(user);
  	  	} else {
  	  	  // no token
  	  	  var randomBytes = Promise.promisify(Crypto.ramdonBytes);

  	  	  return randomBytes(48)
  	  	    .then(function(buf) {
  	  	      var aToken = buf.toString('hex');
  	  	      return user.save({token: aToken});
  	  	    });
  	  	}
  	  } else {
  	  	Promise.reject('password-incorrect');
  	  }
  	} else {
  	  return Promise.reject('user_no_found');
  	}
  })
  .then(function(user) {
    user = removePasswordFromUserData(user);
    res.status(200).json(user);
  })
  .catch(function(err) {
  	console.log('Error validation: ', err);
    res.status(400).json({error: err});
  });
};

UserController.logout = function(req, res) {
  Collections.UserCollection.forge()
  .query(function(qb) {
  	qb.where('token', '=', req.body.token);
  })
  .fetchOne()
  .then(function(user) {
  	user.save({token: null});
  	res.status(200).json({message: 'logout'});
  })
  .catch(function(err) {
  	console.log('Error log out: ', err);
  	res.status(500).json({error: err.message});
  });
};

UserController.retrieveAll = function(req, res) {
  Collections.UserCollection.forge()
  .fetch()
  .then(function(result) {
    result = result.map(removePasswordFromUserData);
    res.status(200).json(result); 
  })
  .catch(function(err) {
  	console.log('Error when getting all users: ', err);
  	res.status(500).json(err);
  })
};

UserController.create = function(req, res) {
  // hash the password
  var hash = Bcrypt.hashSync(req.body.password, 10);

  Collections.UserCollection.forge()
  .create({
  	name: req.body.name,
  	email: req.body.email.toLowerCase(),
  	password: hash
  })
  .then(function(result) {
  	res.status(200).json(result);
  })
  .catch(function(err) {
  	res.status(500).json(err);
  });
};

UserController.retrieve = function(req, res) {
  Collections.UserCollection.forge()
  .query(function(qb) {
  	qb.where('id', '=', req.params.id);
  })
  .fetchOne()
  .then(function(result) {
  	if (result) {
  	  result = removePasswordFromUserData(result);
  	  res.status(200).json(result);
  	} else {
  	  res.status(400).json({});
  	}
  })
};

UserController.update = function(req, res) {
  Collections.UserCollection.forge()
  .query(function(qb) {
  	qb.where('id', '=', req.params.id);
  })
  .fetchOne(function(user) {
  	if (user) {
  	  user.save({
  	  	name: req.body.name || user.get('name'),
  	  	email: req.body.email || user.get('email')
  	  })
  	  .then(function(result) {
  	  	result = removePasswordFromUserData(result)
  	  	res.status(200).json(result);
  	  })
  	  .catch(function(err) {
  	  	console.log('Error update user: ', err);
  	  	res.status(500).json(err);
  	  })
  	} else {
  	  res.status(404).json({});
  	}
  })
  .catch(function(err) {
  	console.log('Error update user: ', err);
  	res.status(500).json(err);
  })
};

UserController.delete = function(req, res) {
  Collections.UserCollection.forge()
  .query(function(qb) {
  	qb.where('id', '=', req.params.id);
  })
  .fetchOne({
  	require: true
  })
  .then(function(user) {
  	if (user) {
  	  user.destroy()
  	  .then(function() {
  		res.status(200).json({});
  	  })
  	  .catch(function(err) {
  		console.log('Error delete user: ', err);
  		res.status(500).json(err);
  	  });
  	} else {
  		console.log('Error delete user: ', err);
  		res.status(404).json({});
  	}
  })
};

// remove password so that it will not return password in fetch
var removePasswordFromUserData = function(user) {
  var userObj = user.toJSON();
  if (userObj.hasOwnProperty('password')) {
  	delete(userObj.password);
  }
  return userObj;
}

module.exports = UserController;