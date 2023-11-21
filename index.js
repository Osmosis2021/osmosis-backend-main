const mongoose = require('mongoose')
const express = require('express');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const credentials = require('./middleware/credentials')
const bodyParser = require('body-parser');
const authRoute = require('./middleware/auth')
const courseRoute = require('./middleware/course')
const bookingRoute = require('./middleware/booking')
const chatRoute = require('./middleware/chat')
const messageRoute = require('./middleware/message')
const emailRoute = require('./middleware/email')
const stripe = require('./middleware/stripe')
const Stripe = require('stripe');
const Booking = require('./models/booking');
const cookieParser = require('cookie-parser');
const allowedOrigins = require('./config/allowedOrigins');
// const cloudinary = require('cloudinary').v2
const app = express();

if(process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https')
            res.redirect(`https://${req.header('host')}${req.url}`)
        else
            next()
    })
}


mongoose.connect(process.env.MONGOOSE_CONNECTION_STRING,
    {useNewUrlParser: true, useUnifiedTopology: true})
.then(async (res) => {
    console.log(`Connected to DB 🌟`)
}).catch((error) => console.log('Connection failed!', error));

//=============================================================================
// Middleware
//=============================================================================
app.use(cookieParser());
// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials)
// Cross Origin Resource Sharing
app.use(cors(corsOptions))

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

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
if (process.env.NODE_ENV === 'production') {
    const stripeKey = process.env.STRIPE_LIVE_KEY
} else {
    const stripeKey =  process.env.STRIPE_TEST_KEY
}
const _stripe = Stripe(stripeKey);

app.post('/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    console.log({'req.body': req.body, sig})
    // Check if webhook signing is configured

    try {
        event = _stripe.webhooks.constructEvent( req.body, sig, STRIPE_WEBHOOK_SECRET )
        console.log({event});
    } catch (err) {
        console.log('req.body', req.body, 'sig', sig, 'STRIPE_WEBHOOK_SECRET', STRIPE_WEBHOOK_SECRET)
        console.log('in /webhook', {err})
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    
    switch(event.type) {
        case 'payment_intent.succeeded':
          const paymentIntentSucceeded = event.data.object;
          // Then define and call a function to handle the event payment_intent.succeeded
          console.log('Payment completed successfully')

        //   Change status of booking to paid

        const updateBooking = await Booking.findOneAndUpdate({_id: event.metbookingID}, {$set: event.data}, {new: true})


          break;
        // ... handle other event types
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      // Return a 200 response to acknowledge receipt of the event
        res.send();
    
    });


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
const reviewController  = require('./controllers/reviewController.js');


app.use('/user', authRoute)
app.use('/course', courseRoute)
app.use('/booking', bookingRoute)
app.use('/chat', chatRoute)
app.use('/message', messageRoute)
app.use('/stripe', stripe)
app.use('/email', emailRoute)

if (process.env.NODE_ENV === 'production') {
    // Exprees will serve up production assets
    app.use(express.static('frontend/build'));
  
    // Express serve up index.html file if it doesn't recognize route
    const path = require('path');
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
    });
}

// SERVER
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8126;
}
const server = app.listen(port, () =>
    console.log('API is listening on port: ' + port)
);

const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: allowedOrigins
    },
});

io.on("connection", (socket) => {
    console.log('Connected to socket.io')
    socket.on('setup', (userID) => {
        socket.join(userID);
        socket.emit('connected');
    });

    socket.on('joinChat', (room) => {
        socket.join(room);
        console.log('user joined room', room);
    });

    // socket.on('typing', (room) => socket.in(room).emit("typing"));
    // socket.on('stopTyping', (room) => socket.in(room).emit("stopTyping"));

    socket.on('newMessage', (newMessageReceived) => {
        var chat = newMessageReceived.chat;

        if (!chat.users) return console.log('chat.users not defined');
        chat.users.forEach(user => {
            if (user?._id === newMessageReceived?.sender?._id) return;

            socket.in(user._id).emit("messageReceived", newMessageReceived)
            console.log('messageReceived', newMessageReceived)
        });
    });

    socket.off('setup', () => {
        console.log('USER DISCONNECTED');
        socket.leave(userID);
    });

});