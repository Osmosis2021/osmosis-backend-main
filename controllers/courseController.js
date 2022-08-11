const express = require('express')
const router = express.Router();

const Course = require('../models/course');


// INDEX 
router.get('/', (req, res, next) => {
    Course.find().then((courses) => res.json(courses)).catch(next);
})


// SHOW 
// GET /course/:id
router.get('/:id', (req, res, next) => {
    const id = req.params.id;
    Course.findById(id).populate('students').then((course) => res.json(course)).catch(next);
})

// CREATE
router.post('/', (req, res, next)=> {
    const courseData = req.body;
    Course.create(courseData).then(course=>res.status(201).json(course)).catch(next);
})


// UPDATE
// update a course --> 

//


// DELETE
router.delete('/:id', (req, res, next) => {
	const id = req.params.id;
	Course.findOneAndDelete({ _id: id })
		.then(() => res.sendStatus(204))
		.catch(next);
});

module.exports = router;
