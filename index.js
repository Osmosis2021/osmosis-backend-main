const express = require('express');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const credentials = require('./middleware/credentials')
const bodyParser = require('body-parser');
const authRoute = require('./routes/auth.routes')
const bookingRoute = require('./routes/booking.routes')
const chatRoute = require('./routes/chat.routes')
const messageRoute = require('./routes/message.routes')
const emailRoute = require('./routes/email.routes')
const stripe = require('./routes/stripe.routes')
const Stripe = require('stripe');
const Booking = require('./models/booking');
const cookieParser = require('cookie-parser');
const allowedOrigins = require('./config/allowedOrigins');
const env = require('./config/env');
const connectDB = require('./config/db');
// const cloudinary = require('cloudinary').v2
const app = express();

if (env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https')
            res.redirect(`https://${req.header('host')}${req.url}`)
        else
            next()
    })
}

// Connect to Database
connectDB();

const webhookRoute = require('./routes/webhook.routes');

//=============================================================================
// Middleware
//=============================================================================
app.use(cookieParser());
// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials)
// Cross Origin Resource Sharing
app.use(cors(corsOptions))

// Mount Stripe Webhook BEFORE global body parsers to ensure raw body is available
app.use('/stripe', webhookRoute);

app.use(express.json({
    limit: '100mb'
}));
// enable CORS to allow requests from clients of other origins
// app.use(cors())
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
const courseRoutes = require('./routes/course.routes.js')
app.use('/api/courses', courseRoutes);

// Student Routes
const studentController = require('./routes/student.routes.js')

// Teacher Routes
const teacherController = require('./routes/teacher.routes.js')

// Review Routes
const reviewController = require('./routes/review.routes.js');


app.use('/user', authRoute)
app.use('/course', courseRoutes)
app.use('/booking', bookingRoute)
app.use('/chat', chatRoute)
app.use('/message', messageRoute)
app.use('/stripe', stripe)
app.use('/email', emailRoute)

if (env.NODE_ENV === 'production') {
    // Exprees will serve up production assets
    app.use(express.static('frontend/build'));

    // Express serve up index.html file if it doesn't recognize route
    const path = require('path');
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
    });
}

const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

app.use(notFoundHandler);
app.use(errorHandler);

// SERVER
const port = env.PORT;
const server = app.listen(port, () =>
    console.log('API is listening on port: ' + port)
);

const initSocket = require('./services/socketService');
initSocket(server);