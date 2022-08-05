const Student = require('../models/student');
const seedStudentData = require('./student.JSON');

Student.deleteMany({})
    .then(() => {
        console.log('All items deleted!');
        return Student.insertMany(seedStudentData);
    })
    .then((items) => {
        console.log(items);
        console.log('Items created ✅');
        console.log('Goodbye! 👋🏾');

        process.exit();
    })
    .catch(console.error);
    