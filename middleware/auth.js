const router = require('express').Router()
const Student = require('../models/student')


router.get('/login/:email/:password', async (req, res) => {
    console.log('in router.get /login');
    const {email, password} = req.params
    Student.findOne({email, password}, (err, data) => {
        if (data) {
            res.json({userID: data._id})
        } else {
            res.json({message: "Could not get user's id."})
        }
    })
});

// Example code that would write this hard-coded user to the database:
// const user_ = new Student({name: 'Jacob Rader', email: 'jacobhrader@gmail.com', password: 'osmosis'})
// user_.save((err, doc) => {
//   console.log({err, doc});
// })

module.exports = router;
