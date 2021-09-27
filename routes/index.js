var express = require('express');
var passport = require('passport');
var app = express();
var router = express.Router();
const auth = require("../middleware/auth");
const User = require('../model/User');
const Joi = require('joi');
const { createValidator } = require('express-joi-validation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require("config");

app.get('/', function(req, res) {
	// render to views/index.ejs template file
	res.redirect('/viewer')
})

app.get('/viewer', auth, function(req, res) {
	// render to views/index.ejs template file
	res.render('pages/viewer', {
		title: '3D Viewer - Owl Studio Web App',
		priv: req.user.privilege,
	})
})

app.get('/login', function(req, res) {
	// render to views/index.ejs template file
	res.render('pages/login', {title: 'Login - Owl Studio Web App'})
})

app.get('/logout', function(req, res){
	req.session.destroy();
	return res.redirect('/');
})

app.post('/login', async function(req, res) {
	const querySchema = Joi.object({
		email: Joi.string().required(),
		pass: Joi.string().required()
	})
	const { error } = querySchema.validate(req.body);
	if(error) {
		return res.redirect('/login');
	}
	let user1 = await User.findOne({ email: req.body.email });
	let token = jwt.sign({...user1}, config.get("myprivatekey"));
	if(user1) {
		if(bcrypt.compareSync(req.body.pass, user1.pass)) {
			req.session.accessToken = token;
			await req.session.save();
			res.redirect('/viewer');
		}
		else{
			for (const key in req.body) {
				if (Object.hasOwnProperty.call(req.body, key)) {
					req.flash(key, req.body[key])
				}
			}
			req.flash('error', 'Password is incorrect.');
			res.render('pages/login', {title: '3D Viewer - Owl Studio Web App'});
		}
	}else{
		for (const key in req.body) {
			if (Object.hasOwnProperty.call(req.body, key)) {
				req.flash(key, req.body[key])
			}
		}
		req.flash('error', 'Email is not registered');
		res.render('pages/login', {title: '3D Viewer - Owl Studio Web App'});
	}
});


/** 
 * We assign app object to module.exports
 * 
 * module.exports exposes the app object as a module
 * 
 * module.exports should be used to return the object 
 * when this file is required in another module like app.js
 */ 
module.exports = app;
