//"use strict";
require('dotenv').config();
/** Dependency Injection */
var express = require('express') // $ npm install express
    , path = require('path') // Node In-Build Module
    , bodyParser = require('body-parser') // $ npm install body-parser
    , session = require('express-session') // $ npm install express-session
    , cookieParser = require('cookie-parser') // $ npm install cookie-parser
    , passport = require('passport') // $ npm install passport
    , flash = require('connect-flash') // $ npm install connect-flash
    , mongoose = require('mongoose') // $ npm install mongoose
    , validator = require('validator') // $ npm install express-validator
    , CONFIG = require('./config/config') // Injecting Our Configuration
    , favicon = require('serve-favicon') // $ npm install serve-favicon
    , compression = require('compression')
    , url = require('url')
    , i18n = require("i18n");

/** /Dependency Injection */
/** Socket.IO */
// const helmet = require('helmet')
var app = express(); // Initializing ExpressJS
var server = require('http').createServer(app);
// const session = require('express-session')
const fs = require('fs');


// const path = require('path');
// var io = require('socket.io')(server);
const io = require('socket.io')(server, {
    cors: {
        origin: ["http://localhost:4200", "http://localhost:4201", 'http://localhost:4000',"https://company-portal-three.vercel.app", '*'],
        credentials: true
    },
    allowEIO3: true
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const languagesDir = path.join(__dirname, 'uploads/languages');

// Create uploads directory
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
}

// Create languages subdirectory
if (!fs.existsSync(languagesDir)) {
    fs.mkdirSync(languagesDir, { recursive: true });
    console.log('✅ Created uploads/languages directory');
}


/** Global Configuration*/
global.GLOBAL_CONFIG = CONFIG.GLOBAL;
mongoose.Promise = global.Promise;

/** Middleware Configuration */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
// i18n.configure({ locales: ['th', 'en'], defaultLocale: 'en', autoReload: true, directory: __dirname + '/uploads/languages', syncFiles: true });

// Updated i18n configuration with error handling
try {
    i18n.configure({ 
        locales: ['th', 'en'], 
        defaultLocale: 'en', 
        autoReload: true, 
        directory: path.join(__dirname, 'uploads/languages'),
        syncFiles: true 
    });
} catch (error) {
    console.warn('⚠️ i18n configuration warning:', error.message);
    // Fallback configuration without directory
    i18n.configure({ 
        locales: ['th', 'en'], 
        defaultLocale: 'en'
    });
}

app.disable('x-powered-by');
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true })); // Parse application/x-www-form-urlencoded
app.use('/logs/error.log', express.static(path.join(__dirname, '/logs/error.log'), { maxAge: 100 * 10000 })); // Serving Static Files For Sitemap
app.use(bodyParser.json({ limit: '100mb' })); // bodyParser - Initializing/Configuration
app.use(cookieParser('CasperonReadytoEat')); // cookieParser - Initializing/Configuration cookie: {maxAge: 8000},
app.use(session({ secret: 'CasperonReadytoEat', resave: true, saveUninitialized: true })); // express-session - Initializing/Configuration
// app.use(validator());
// app.use(validator());
// var expressValidator = require('express-validator');

app.use(passport.initialize()); // passport - Initializing
app.use(passport.session()); // passport - User Session Initializing
app.use(flash()); // flash - Initializing
app.use(compression()); //use compression middleware to compress and serve the static content.

// Listen on a specific port via the PORT environment variable

app.use(function (req, res, next) {
    console.log('orginal urlll------', req.originalUrl);
    res.header('Access-Control-Allow-Credentials', true);
    const allowedOrigins = ['*', 'http://localhost:4201', 'http://localhost:4000', 'http://localhost:4200',"https://company-portal-three.vercel.app"];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    // res.header("Access-Control-Allow-Origin", 'http://localhost:4200');
    res.header("Access-Control-Allow-Headers", ["content-type", "authorization"]);
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT");
    i18n.setLocale(req.headers["accept-language"] || 'en');
    /* var library = require('./model/library.js');
    console.log('testing')
    console.log('testing',library.getlanguage(req,'WUA.back-end.FIRST_NAME_REQUIRED','Invalid city'))   */
    next();
});
// app.use('/app', express.static(path.join(__dirname, '/app'), { maxAge: 7 * 86400000 })); // 1 day = 86400000 ms
// app.use('/.well-known', express.static(path.join(__dirname, '/.well-known'), { maxAge: 7 * 86400000 }));

// app.get('/', function(req, res) {
//     res.sendFile(path.join(__dirname, 'dist/site', 'index.html'), {acceptRanges: false});
// });
app.use('/admin', express.static(path.join(__dirname, 'dist/admin')));
app.get('/admin', function (req, res) {
    res.sendFile(path.join(__dirname, 'dist/admin', 'index.html'), { acceptRanges: false });
});

app.use('/', express.static(path.join(__dirname, 'dist/site')));

app.use(i18n.init);
app.set('view engine', 'pug');
// app.set('views', './views');
// app.locals.pretty = false;


app.use('/uploads', express.static(path.join(__dirname, '/uploads'), { maxAge: 7 * 86400000 }));

// app.get('/admin', (req, res) => {
//     res.sendFile(path.join(__dirname, 'dist', 'index.html'));
// });

/** /Middleware Configuration */
/*
mongoose.connect(CONFIG.DB_URL, function (error) {
    if (error) {
        console.log('MongoDB connection error: ', error);
    }
}); //Connecting with MongoDB
*/

/** MongoDB Connection */

// mongoose.connect(CONFIG.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 10000 });
// mongoose.connection.on('error', function (error) {
//     console.error('Error in MongoDb connection: ' + error);
// });

// (async () => {
//   try {
//     const conn = await mongoose.connect("mongodb://127.0.0.1:27017/live-pillais-25j24");
//     console.log("✅ Connected to MongoDB:", conn.connection.host);
//   } catch (err) {
//     console.error("❌ Connection failed:", err.message);
//   }
// })();

const mongoUrl = process.env.MONGODB_URI || 
  `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;

// Update your connection code
(async () => {
  try {
    const conn = await mongoose.connect(mongoUrl);
    console.log("✅ Connected to MongoDB:", conn.connection.host);
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  }
})();

/* var mongooseOptions = {
   useNewUrlParser: true,
   useCreateIndex: true,
   keepAlive: 1,
   reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
   reconnectInterval: 500, // Reconnect every 500ms
   connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
   socketTimeoutMS: 30000 // Close sockets after 45 seconds of inactivity
};
mongoose.connect(CONFIG.DB_URL, mongooseOptions, function (error) {
    if (error) {
        console.log('MongoDB connection error: ', error);
    }
}); //Connecting with MongoDB */


// app.get('/angular', (req, res) => {
//     res.sendFile(path.join(__dirname, 'dist', 'index.html'));
// });

mongoose.connection.on('connected', function () {
    console.log('Good day!');
});
mongoose.connection.on('reconnected', function () {
    console.log('MongoDB reconnected!');
});
mongoose.connection.on('disconnected', function () {
    console.log('MongoDB disconnected!');
});

/** Dependency Mapping */

require('./routes')(app, passport, io);
require('./sockets')(io);
require('./cron')(io, app);
//require('./cron');

app.get('/*', function (req, res) {
    return res.sendFile(path.join(__dirname, 'dist/site', 'index.html'), { acceptRanges: false });
})

/** /Dependency Mapping*/
/** HTTP Server Instance */
try {

    server.listen(CONFIG.PORT, function () {
        console.log('Server turned on with', CONFIG.ENV, 'mode on port', CONFIG.PORT);
    });

} catch (ex) {
    console.log(ex);
}
/** /HTTP Server Instance */