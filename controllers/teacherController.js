const express = require('express');
const router = express.Router();

const User = require('../models/user');

// INDEX
router.get('/', (req, res, next) => {
	User.find()
		.then((users) => res.json(users))
		.catch(next);
});

// SHOW
// GET /student/:id
router.get('/:id', (req, res, next) => {
	const id = req.params.id;
	User.findById(id)
	    .then((user) => res.json(user))
		.catch(next);
});

// SIGNUP

// LOGIN

// DELETE

module.exports = router;
