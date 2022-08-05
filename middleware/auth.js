const router = require('express').Router()
const Student = require('../models/student')




router.post('/login', async (req, res) => {
    const {username, password} = req.body
    console.log({username, password})
    const user = await Student.findOne({username, password})
    res.json({userID: user._id})

});


module.exports = router;
