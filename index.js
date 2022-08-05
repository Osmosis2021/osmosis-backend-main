const mongoose = require('mongoose')
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoute = require('./middleware/auth')
const Student = require('./models/student')
const PORT = process.env.PORT || 5000;


mongoose
	// .connect('mongodb+srv://osmosisAdmin:OsmosisV1production@cluster0.wi3de.mongodb.net/osmosisdb?retryWrites=true&w=majority')
	.connect('mongodb+srv://osmosisAdmin:OsmosisV1production@osmosis.ckm2gk7.mongodb.net/?retryWrites=true&w=majority',
    {useNewUrlParser: true, useUnifiedTopology: true})
	.then((res) => console.log(`Connected to DB 🌟`))
	.catch((error) => console.log('Connection failed!', error));

const conn = mongoose.connection
const logUser = async () => {
  const _user = await Student.findOne({email: 'jacobhrader@gmail.com', password: 'osmosis'})
  console.log({_user})
}
logUser()
//=============================================================================
// Middleware
//=============================================================================
app.use(express.json())
// enable CORS to allow requests from clients of other origins
app.use(cors());
// `express.json` parses application/json request data and
//  adds it to the request object as request.body
app.use(bodyParser.urlencoded({ extended: false }));
console.log('here 1 ****************')
// app.use(express.json());
// `express.urlencoded` parses x-ww-form-urlencoded request data and
//  adds it to the request object as request.body
console.log('here 2 ****************')
app.use(express.urlencoded({ extended: true }));

// Log each request as it comes in for debugging
// const requestLogger = require('./middleware/request_logger');
// app.use(requestLogger);


//=============================================================================
// ROUTES
//=============================================================================

// Redirect
// redirect to all courses that are available on the platform
console.log('here 3 ****************')


// app.get('/', (req, res) => {
// 	res.redirect('/courses');
// });
console.log('here 4 ****************')

// Courses Routes
const courseController = require('./controllers/courseController.js')
console.log('here 5 ****************')

// Student Routes
const studentController = require('./controllers/studentController.js')
console.log('here 6 ****************')

// Teacher Routes
const teacherController = require('./controllers/teacherController.js')
console.log('here 7 ****************')

// Review Routes
const reviewController  = require('./controllers/reviewController.js')

console.log('here 8 ****************')

app.use('/user', authRoute)



// SERVER
app.listen(PORT, () =>
    console.log('API is listening on port: ' + PORT)
);
