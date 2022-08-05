const express = require('express');
const router = express.Router();

const Teacher = require('../models/teacher');

// INDEX
router.get('/', (req, res, next) => {
	Teacher.find()
		.then((teachers) => res.json(teachers))
		.catch(next);
});

// SHOW
// GET /student/:id
router.get('/:id', (req, res, next) => {
	const id = req.params.id;
	Teacher.findById(id)
	    .then((teacher) => res.json(teacher))
		.catch(next);
});

// SIGNUP

// LOGIN

// DELETE

module.exports = router;
