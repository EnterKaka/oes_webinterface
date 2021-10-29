var express = require('express');
var app = express();
const MongoClient = require("mongodb").MongoClient;
var ObjectId = require('mongoose').Types.ObjectId;
const auth = require("../middleware/auth");
const Setting = require('../model/Setting');
var interval;

var dbname = 'OwlEyeStudioWebInterface', collectionname = 'models';

// SHOW LIST OF USERS
app.get('/', auth, async function (req, res, next) {
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });
	let allmembers = await Setting.find();
	var dbs = [], collections = [];
	let found = false;
	allmembers.forEach(function (mem) {
		let db = mem.dbname.trim();
		let col = mem.collectionname.trim();
		found = false;
		for (var i = 0; i < dbs.length && !found; i++) {
			if (dbs[i] === db) {
				found = true;
				break;
			}
		}
		if (!found) {
			dbs.push(db);
		}

		found = false;
		for (var i = 0; i < collections.length && !found; i++) {
			if (collections[i] === col) {
				found = true;
				break;
			}
		}
		if (!found) {
			collections.push(col);
		}
	});
	console.log(dbs, collections);

	console.log('/data/--------', dbname, collectionname);
	//session dbname and collection name save
	req.session.dbname = dbname;
	req.session.collectionname = collectionname;

	async function run() {
		try {
			await client.connect();
			const database = client.db(dbname);
			const datas = database.collection(collectionname);
			// query for movies that have a runtime less than 15 minutes
			const cursor = datas.find({});
			let sentdata = [];
			// print a message if no documents were found
			if ((await cursor.count()) === 0) {
				console.log("No documents found!");
				//  process.exit(1)
				req.flash('error', 'No existed');
				// redirect to users list page
				res.header(400).json({ status: 'fail' });
			} else {
				// replace console.dir with your callback to access individual elements
				await cursor.forEach(function (model) {
					let splitdata = model.datetime.split(' ');
					let eachmodeldata = {
						_id: model._id,
						date: splitdata[0],
						time: splitdata[1],
						name: model.measurement[0].name,
						mass: model.measurement[0].mass,
						volume: model.measurement[0].volume,
					}
					sentdata.push(eachmodeldata);
				});
				console.log('/data/-----', dbname, collectionname);
				res.render('pages/data', {
					title: 'Model DB - Owl Studio Web App',
					dbname: dbname,
					collectionname: collectionname,
					data: sentdata,
					dbs: dbs,
					collections: collections
				});
		} finally {
		}
	}
	run().catch(
		(err) => {
			console.log("mongodb connect error ========");
			console.error(err)
			//  process.exit(1)
			req.flash('error', err)
			// redirect to users list page
			res.render('pages/data', {
				title: 'Model DB - Owl Studio Web App',
				// data: sentdata,
				loadedData:loadedData,
				data: [],
			});
		}
	);
});

app.get('/view/(:_id)', auth, async function (req, res, next) {
	// let model = await Model.findOne({datetime: req.params.datetime})
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });

	console.log('/data/view/_id--------', dbname, collectionname);
	async function run() {
		try {
			/* find object in loaded data*/
			var id = req.params._id;
			let obj = loadedData.find((o)=>{
				if(o._id.toString()===id)
					return true;
			});

			/* find setting data by setting id*/
			let setobj = await Setting.findOne({_id: new ObjectId(obj.setid) });
			
			/* get pointcloud from collection */
			let dbname = setobj.dbname;
			let collectionname = setobj.collectionname;
			await client.connect();
			const database = client.db(dbname);
			const datas = database.collection(collectionname);
			// query for movies that have a runtime less than 15 minutes
			const cursor = await datas.findOne({ _id: new ObjectId(req.params._id) });
			// console.log(cursor);
			// print a message if no documents were found
			if (cursor) {
				console.log('success get data');
				req.flash('success', 'Data loaded successfully! DB = ' + dbname)
				var pcl = cursor.measurement[0].pointcloud;
				console.log('point cloud ========================');
				req.flash("pointcloud", JSON.stringify(pcl));
				req.flash('pcl_name', cursor.measurement[0].name);
				res.redirect('/viewer');
			} else {
				console.log("No documents found!");
				req.flash('error', 'No existed');
				// redirect to users list page
				res.redirect('/data/');
			}
		} finally {
		}
	}
	run().catch(
		(err) => {
			console.log("mongodb connect error ========");
			console.error(err)
			//  process.exit(1)
			req.flash('error', err)
			// redirect to users list page
			res.redirect('/data/');
		}
	);


});

app.get('/edit/(:_id)', auth, async function (req, res, next) {
	// let model = await Model.findOne({datetime: req.params.datetime})
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });

	console.log('/data/edit/_id--------', dbname, collectionname);
	async function run() {
		try {
			await client.connect();
			const database = client.db(dbname);
			const datas = database.collection(collectionname);
			// query for movies that have a runtime less than 15 minutes
			const cursor = await datas.findOne({ _id: new ObjectId(req.params._id) });
			// console.log(cursor);
			// print a message if no documents were found
			if (cursor) {
				// replace console.dir with your callback to access individual elements
				console.log('success get data');
				req.flash('success', 'Data loaded successfully! DB = ' + dbname)
				// redirect to users list page
				var pcl = cursor.measurement[0].pointcloud;
				console.log('point cloud ========================');
				req.flash("pointcloud", JSON.stringify(pcl));
				req.flash('pcl_name', cursor.measurement[0].name)
				res.redirect('/editer');
			} else {
				console.log("No documents found!");
				req.flash('error', 'No existed');
				// redirect to users list page
				res.redirect('/data/');
			}
		} finally {
			await client.close();
		}
	}
	run().catch(
		(err) => {
			console.log("mongodb connect error ========");
			console.error(err)
			//  process.exit(1)
			req.flash('error', err)
			// redirect to users list page
			res.redirect('/data/');
		}
	);


});
app.post('/multimodelsave', auth, async function (req, res, next) {
	console.log('multimodelsave called')
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });
	var modeldata = req.body.savedata;
	var databaseName = req.body.database;
	var collectionName = req.body.collection;
	console.log(databaseName, collectionName)
	async function run() {
		try {
			await client.connect();
			const database = client.db(databaseName);
			const collection = database.collection(collectionName);
			// query for movies that have a runtime less than 15 minutes
			console.log('saving ...');
			await collection.insertMany(modeldata);
			console.log('saved');
			res.header(200).json({
				success: true
			});
			// print a message if no documents were found

		} finally {
			await client.close();
		}
	}
	run().catch(
		(err) => {
			console.log("mongodb connect error ========");
			console.error(err)
			//  process.exit(1)
			req.flash('error', err)
			res.header(200).json({
				error: 'db error'
			});
		}
	);
})
app.post('/modelsave', auth, async function (req, res, next) {
	console.log('modelsave called.')
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });
	var modeldata = req.body.modeldata;
	var db = req.body.db;
	var col = req.body.col;
	console.log(db, col)
	async function run() {
		try {
			await client.connect();
			const database = client.db(db);
			const collection = database.collection(col);
			// query for movies that have a runtime less than 15 minutes
			await collection.insertOne(modeldata);
			res.header(200).json({
				success: true
			});
			// print a message if no documents were found

		} finally {
			await client.close();
		}
	}
	run().catch(
		(err) => {
			console.log("mongodb connect error ========");
			console.error(err)
			//  process.exit(1)
			req.flash('error', err)
			res.header(200).json({
				error: 'db error'
			});
		}
	);
})
app.post('/getmodellist', auth, async function (req, res, next) {
	console.log('getmodellist')
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });
	const dbname = req.body.db;
	const colname = req.body.col;
	console.log(req.body, dbname, colname)
	async function run() {
		try {
			await client.connect();
			const database = client.db(dbname);
			const collection = database.collection(colname);
			var testdata = await collection.findOne({});
			if (!testdata.name || !testdata.date || !testdata.time || !testdata.data || !testdata.type) {
				res.header(200).json({
					error: "This collection doesn't seem to be for save model data."
				});
			}
			else {
				var data = await collection.find({}).toArray();
				res.header(200).json({
					success: true,
					data: data,
				});
			}
			// print a message if no documents were found

		} finally {
			await client.close()
		}
	}
	run().catch(
		(err) => {
			console.log("mongodb connect error ========");
			console.error(err)
			//  process.exit(1)
			req.flash('error', err)
			res.header(200).json({
				error: 'db error'
			});
		}
	);
})
app.get('/getdatabaselist', auth, async function (req, res, next) {
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });
	// console.log(modeldata)
	async function run() {
		try {
			await client.connect();
			const database = client.db('OwlEyeStudioWebInterface');
			const adminDb = await database.admin();
			const datalist = await adminDb.listDatabases()
			const basenames = datalist.databases;
			var dblist = [];
			for (var i = 0; i < basenames.length; i++) {
				const base = client.db(basenames[i].name);
				const cols = await base.collections();
				var dbcell = {};
				dbcell.db = basenames[i].name;
				dbcell.col = [];
				for (var j = 0; j < cols.length; j++) {
					dbcell.col.push(cols[j].collectionName);
				}
				dblist.push(dbcell);
			}
			res.header(200).json({
				success: true,
				data: dblist,
			});
			// print a message if no documents were found

		} finally {
			await client.close()
		}
	}
	run().catch(
		(err) => {
			console.log("mongodb connect error ========");
			console.error(err)
			//  process.exit(1)
			req.flash('error', err)
			res.header(200).json({
				error: 'db error'
			});
		}
	);
})


app.post('/get', auth, async function (req, res, next) {
	dbname = req.body.dbname;
	collectionname = req.body.collectionname;

	//session dbname and collection name save
	req.session.dbname = dbname;
	req.session.collectionname = collectionname;

	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });
	let allmembers = await Setting.find();
	let dbs = [], collections = [];
	allmembers.forEach(function (mem) {
		let db = mem.dbname.trim();
		let col = mem.collectionname.trim();
		found = false;
		for (var i = 0; i < dbs.length && !found; i++) {
			if (dbs[i] === db) {
				found = true;
				break;
			}
		}
		if (!found) {
			dbs.push(db);
		}

		found = false;
		for (var i = 0; i < collections.length && !found; i++) {
			if (collections[i] === col) {
				found = true;
				break;
			}
		}
		if (!found) {
			collections.push(col);
		}
	});

	console.log('/data/get/--------', dbname, collectionname);
	async function run() {
		try {
			var id = req.params.id;
			let obj = loadedData.find((o)=>{
				if(o._id.toString()===id)
				return true;
			});
			let setobj = await Setting.findOne({_id: new ObjectId(obj.setid) });
			let dbname = setobj.dbname;
			let collectionname = setobj.collectionname;
			await client.connect();
			const database = client.db(dbname);
			const datas = database.collection(collectionname);
			// query for movies that have a runtime less than 15 minutes
			const cursor = await datas.findOne({_id: new ObjectId(id) });
			// console.log(cursor);
			// print a message if no documents were found
			
			if (cursor) {
				var format = (Math.round(cursor.measurement[0].volume * 100) / 100).toFixed(2);
				// req.flash('pcl_name', cursor.measurement[0].name + ' : ' + cursor.measurement[0].date + ' ' + cursor.measurement[0].time + ' (' + format + ')');
				// replace console.dir with your callback to access individual elements
				var pcl = cursor.measurement[0].pointcloud;
				var display_name = '';
				if(cursor.measurement[0].name.toLowerCase() === 'general')
					display_name = cursor.measurement[0].name + ' : ' + cursor.measurement[0].date + ' ' + cursor.measurement[0].time;
				else
					display_name = cursor.measurement[0].name + ' : ' + cursor.measurement[0].date + ' ' + cursor.measurement[0].time + ' (' + format + ')';
				res.header(200).json({
					status: 'sucess',
					data: pcl,
					name: display_name,
				});
			}else{
				res.header(400).json({
					status: 'fail',
					data: 'no model'
				});
			}
		} finally {
		}
	}
	run().catch(
		(err) => {
			res.header(400).json({
				status: 'fail',
				error: err,
			});
		}
	);
	
});

/* click get data button in data page */

app.post('/get', auth, async function(req, res, next) {

	console.log("*********** data **** get data ********")

	
	/* get all collections */
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true, useNewUrlParser: true, connectTimeoutMS: 30000 , keepAlive: 1});
	let allmembers = await Setting.find();

	async function run() {
		try {
			await client.connect();
			let sentdata = [];
			/* connect all collections */
			for(let mem of allmembers){
				/* get cursor */
				let db = mem.dbname.trim();
				let col = mem.collectionname.trim();
				if(db === 'delaytime'){
					delaytime = col*60000;
					continue;
				}
				const database = client.db(db);
				const datas = database.collection(col);
				// const cursor = datas.find({}).sort([['datetime', -1]]);
				const cursor = datas.aggregate([{$sort:{'datetime':-1}}],{allowDiskUse: true});

				await cursor.forEach(function(model) {
					let splitdata = model.datetime.split(' ');
					let eachmodeldata = {
						_id: model._id,
						date: splitdata[0],
						time: splitdata[1],
						name: model.measurement[0].name,
						mass: model.measurement[0].mass,
						volume: model.measurement[0].volume,
						setid: mem._id.toString(),
					}
					sentdata.push(eachmodeldata);
				});
			};
			// print a message if no documents were found
			if (sentdata.length === 0) {
				console.log("No documents found!");
				req.flash('error', 'No existed');
				res.header(400).json({status: 'fail'});
			}else{
				loadedData = sentdata;
				clearInterval(interval);
				// var interval = setInterval(intervalFunction, 3600*1000);			
				var interval = setInterval(intervalFunction, delaytime);			
				res.header(200).json({
					status: 'success',
					loadedData:loadedData,
					data: sentdata,
					delaytime:delaytime
				});
			}
		} finally {
			await client.close();
		}
	}
	run().catch(
		(err) => {
			console.log("mongodb connect error ========");
			console.error(err)
			//  process.exit(1)
			req.flash('error', err)
			// redirect to users list page
			res.render('pages/data', {
				title: 'Model DB - Owl Studio Web App',
				// data: sentdata,
				data: [],
				dbs: dbs,
				collections: collections,
			});
		}
	);
});
async function intervalFunction(){
	try {
		const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true, useNewUrlParser: true, connectTimeoutMS: 30000 , keepAlive: 1});
		let allmembers = await Setting.find();
		await client.connect();
		let sentdata = [];
		/* connect all collections */
		for(let mem of allmembers){
			/* get cursor */
			let db = mem.dbname.trim();
			let col = mem.collectionname.trim();
			if(db === 'delaytime'){
				continue;
			}

			const database = client.db(db);
			const datas = database.collection(col);
			// const cursor = datas.find({}).sort([['datetime', -1]]);
			const cursor = datas.aggregate([{$sort:{'datetime':-1}}],{allowDiskUse: true});
	
			await cursor.forEach(function(model) {
				let splitdata = model.datetime.split(' ');
				let eachmodeldata = {
					_id: model._id,
					date: splitdata[0],
					time: splitdata[1],
					name: model.measurement[0].name,
					mass: model.measurement[0].mass,
					volume: model.measurement[0].volume,
					setid: mem._id.toString(),
				}
				sentdata.push(eachmodeldata);
			});
		}
		loadedData = sentdata;
		console.log("load ended");
	} catch (error) {
		throw error;
		console.log("load failed");
	}
}
module.exports = app;