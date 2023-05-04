const mongoose = require('mongoose')
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoute = require('./middleware/auth')
const courseRoute = require('./middleware/course')
const bookingRoute = require('./middleware/booking')
const stripe = require('./middleware/stripe')
const cookieParser = require('cookie-parser');
const cloudinary = require('cloudinary').v2
const dotenv = require('dotenv')
dotenv.config()
const PORT = process.env.PORT || 8126;
console.log({PORT})


mongoose.connect('mongodb+srv://osmosisAdmin:OsmosisV1production@osmosis.ckm2gk7.mongodb.net/?retryWrites=true&w=majority',
    {useNewUrlParser: true, useUnifiedTopology: true})
.then(async (res) => {
    console.log(`Connected to DB 🌟`)
}).catch((error) => console.log('Connection failed!', error));

//=============================================================================
// Middleware
//=============================================================================
app.use(cookieParser());
app.use(express.json({
    limit: '100mb'
  }));
// enable CORS to allow requests from clients of other origins
app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000'
}));
// `express.json` parses application/json request data and
//  adds it to the request object as request.body
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.json());
// `express.urlencoded` parses x-ww-form-urlencoded request data and
//  adds it to the request object as request.body
app.use(express.urlencoded({ extended: true }));

// Log each request as it comes in for debugging
// const requestLogger = require('./middleware/request_logger');
// app.use(requestLogger);

//=============================================================================
// ROUTES
//=============================================================================

// Redirect
// redirect to all courses that are available on the platform


// app.get('/', (req, res) => {
// 	res.redirect('/courses');
// });

// Courses Routes
const courseController = require('./controllers/courseController.js')
app.use('/api/courses', courseController);

// Student Routes
const studentController = require('./controllers/studentController.js')

// Teacher Routes
const teacherController = require('./controllers/teacherController.js')

// Review Routes
const reviewController  = require('./controllers/reviewController.js')


app.use('/user', authRoute)
app.use('/course', courseRoute)
app.use('/booking', bookingRoute)
app.use('/stripe', stripe)

// SERVER
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8126;
}
app.listen(port, () =>
    console.log('API is listening on port: ' + port)
);