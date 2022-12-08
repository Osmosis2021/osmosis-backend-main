const User = require('../models/user');
const seedStudentData = require('./student.JSON');

User.deleteMany({})
    .then(() => {
        console.log('All items deleted!');
        return User.insertMany(seedStudentData);
    })
    .then((items) => {
        console.log(items);
        console.log('Items created ✅');
        console.log('Goodbye! 👋🏾');

        process.exit();
    })
    .catch(console.error);
    