var express = require('express');
var app = express();
const auth = require("../middleware/auth");
const admin = require('../middleware/admin');
const User = require('../model/User');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
var ObjectId = require("mongoose").Types.ObjectId;
const fs = require("fs");
const logger = fs.createWriteStream("user-log/oe_server_logfile.txt", {
    flags: "a", // 'a' means appending (old data will be preserved)
});
async function writeLog(msg) {
    logger.write(msg + "\r\n");
    console.log(msg);
}

// SHOW LIST OF USERS
app.get('/', auth, admin, async function(req, res, next) {	
	// fetch and sort users collection by id in descending order
    
	let allmembers = await User.find();
	res.render('pages/user/list', {
		data : allmembers,	
	})
});

// SHOW ADD USER FORM
app.get('/add', auth, admin, function(req, res, next){	
	// render to views/pages/members/add.ejs
	res.render('pages/user/add', {
		title: 'Add New User - Owl Studio',
		name:'',
		email: '',
		pass: '',
		privilege:'Guest'		
	})
});

// ADD NEW USER POST ACTION
app.post('/add', auth, admin, async function(req, res, next){	
	const querySchema = Joi.object({
		name: Joi.string().required(),
		email: Joi.string().email(),
		pass: Joi.string().required(),
		privilege: Joi.string().required()
	})
	const { error } = querySchema.validate(req.body);
	if(error) {
		req.flash('error', error);
		res.render('pages/user/add');
	}else{
		//find an existing user
		let mail = await User.findOne({ email: req.body.email });
		if (mail)
		{
			req.flash('error', 'Email is already existed in database');
			res.render('pages/user/add');
			return;
		} 
		
		let v_user = new User({
			name: req.body.name,
			pass: req.body.pass,
			email: req.body.email,
			privilege: req.body.privilege,
		});
		var str = 'Username:' + req.session.user_info.email + ' User: '+ req.body.name +' Email:'+ req.body.email +' Time:' + (new Date());
		writeLog('User Added ('+str+')');	
		v_user.pass = await bcrypt.hash(v_user.pass, 10);
		await v_user.save();
		req.flash('success', 'New User is added successfully!');
		res.redirect('/user');
	
		// const token = user.generateAuthToken();
	}
})


// SHOW EDIT USER FORM
app.get('/edit/(:email)', auth, admin, async function(req, res, next){
	let mem = await User.findOne({ email: req.params.email});
	if(mem){
		res.render('pages/user/edit',{
			_id: mem._id,
			name: mem.name,
			email: mem.email,
			pass: mem.pass,
			privilege: mem.privilege,
		})
	}else{
		res.redirect('/user');
	}
})

// EDIT USER POST ACTION
app.post('/edit/(:email)', auth, admin, async function(req, res, next) {
	const querySchema = Joi.object({
		_id: Joi.string().required(),
		name: Joi.string().required(),
		email: Joi.string().email(),
		pass: Joi.string().required(),
		privilege: Joi.string().required()
	});
	const _id = new ObjectId(req.body._id);
	const { error } = querySchema.validate(req.body);
	if(error) {
		req.flash('error', error);
		res.redirect('/user/edit/<%- res.params.email %>');
	}else{
		let v_user = {
			name: req.body.name,
			pass: req.body.pass,
			email: req.body.email,
			privilege: req.body.privilege,
		};
		v_user.pass = await bcrypt.hash(v_user.pass, 10);
		let prev = await User.findOne({_id: _id});
		let mem = await User.findOneAndUpdate({_id: _id}, v_user);
		var str = 'Username:' + req.session.user_info.email + ' User: '+ prev.name +' => ' + v_user.name +' Email:'+ prev.email + ' => ' + v_user.email +' Time:' + (new Date());
		writeLog('User Updated ('+str+')');	
		req.flash('success', 'The User Information has updated successfully');
		return res.redirect('/user')
	}
})

// DELETE USER
app.get('/delete/(:email)', auth, admin,async function(req, res, next) {	
	var email_addr = req.params.email;
	let prev = await User.findOne({email: req.params.email});
	var str = 'Username:' + req.session.user_info.email + ' User: '+ prev.name +' Email:'+ prev.email +' Time:' + (new Date());
	writeLog('User Deleted ('+str+')');	
	User.findOneAndDelete({email: email_addr }, function (err, docs) {
		if (err){
			req.flash('error', err)
			// redirect to users list page
			res.header(400).json({status: 'fail'});
		}
		else{
			req.flash('success', 'User deleted successfully! email = ' + email_addr)
			// redirect to users list page
			res.header(200).json({status: 'success'});
		}
	});
})



/** 
 * We assign app object to module.exports
 * 
 * module.exports exposes the app object as a module
 * 
 * module.exports should be used to return the object 
 * when this file is required in another module like app.js
 */ 
module.exports = app;
