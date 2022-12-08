const express = require('express')
const router = express.Router();

const Course = require('../models/course');


// INDEX 
// GET ALL COURSES LISTED
router.get('/', (req, res, next) => {
    Course.find().then((courses) => res.json(courses)).catch(next);
})


// SHOW 
// GET ALL COURSES BY TEACHER (USER)

// GET SPECIFIC COURSE FROM TEACHER(USER)
//course/:id
router.get('/user/:id', async (req, res, next) => {
   
    try {
        const course = Course.findById(req.params.id).populate('users').then((course) => res.json(course)).catch(next);
    } catch (error) {
        
    }
    })

// CREATE A CLASS
router.post('/', async(req, res, next)=> {
    try {
        const course = await Course.create(req.body);
        res.status(201).json(course);
    } catch (error) {
        next(error);
    }    
});


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
