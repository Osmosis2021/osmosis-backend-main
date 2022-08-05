
const Course = require('../models/course');
const seedCourseData = require('./course.JSON');

Course.deleteMany({})
	.then(() => {
		console.log('All items deleted!');
		return Course.insertMany(seedCourseData);
	})
	.then((items) => {
		console.log(items);
		console.log('Courses created ✅');
		console.log('Goodbye! 👋🏾');

		process.exit();
	})
	.catch(console.error);
