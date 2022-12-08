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
// GET /user/:id
router.get('/:id', (req, res, next) => {
	const id = req.params.id;
	User.findById(id)
		.then((user) => res.json(user))
		.catch(next);
});

// SIGNUP

router.get('/signup', (req, res, next) => {
	const username = ''
	const password = ''
	const email = ''
	// save the password, email, and username to backend 
	// backend password, email, username save requires bycrypt 
	// npm install bycrpt and read docs to implement 
})

// LOGIN

// login, find one user from username and login user 
//n login should allow the user to sign in via Google Auth as well 
router.get('/login', (req, res, next) => {
	User.findOne({username: req.body.username})
	.then((user) => createUserToken(req, user))
	.then((token) => res.json({ token }))
	.catch(next);
})

// DELETE

// delete user
// find user by username and email and delete user
// require auth (user token) to delete user 
router.delete('/delete/:id', (req, res, next) => {
	const id = req.params.id;
	Users.findOneAndDelete({_id: id}).then(() => res.sendStatus(204)).catch(next);
})


module.exports = router;
