const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const flash = require('connect-flash');
const compression = require('compression');
const i18n = require("i18n");

// Load config
let CONFIG;
try {
    CONFIG = require('../config/config');
} catch (err) {
    CONFIG = {
        GLOBAL: {},
        PORT: process.env.PORT || 3000,
        ENV: process.env.NODE_ENV || 'production'
    };
}

// Don't use dotenv in production - Vercel handles env vars
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();

// Create directories if needed (but remember Vercel has read-only filesystem)
const uploadsDir = path.join(__dirname, '../uploads');
const languagesDir = path.join(__dirname, '../uploads/languages');

try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('✅ Created uploads directory');
    }
    if (!fs.existsSync(languagesDir)) {
        fs.mkdirSync(languagesDir, { recursive: true });
        console.log('✅ Created uploads/languages directory');
    }
} catch (err) {
    console.warn('⚠️ Could not create directories (read-only filesystem)');
}

// Global Configuration
global.GLOBAL_CONFIG = CONFIG.GLOBAL;
mongoose.Promise = global.Promise;

// Middleware Configuration
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";

// i18n setup with error handling
try {
    i18n.configure({ 
        locales: ['th', 'en'], 
        defaultLocale: 'en', 
        autoReload: true, 
        directory: path.join(__dirname, '../uploads/languages'),
        syncFiles: true 
    });
} catch (error) {
    console.warn('⚠️ i18n configuration warning:', error.message);
    i18n.configure({ 
        locales: ['th', 'en'], 
        defaultLocale: 'en'
    });
}

app.disable('x-powered-by');
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use('/logs/error.log', express.static(path.join(__dirname, '../logs/error.log'), { maxAge: 100 * 10000 }));
app.use(cookieParser('CasperonReadytoEat'));
app.use(session({ 
    secret: 'CasperonReadytoEat', 
    resave: true, 
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(compression());

// CORS setup
app.use(function (req, res, next) {
    console.log('original url------', req.originalUrl);
    res.header('Access-Control-Allow-Credentials', true);
    const allowedOrigins = ['*', 'http://localhost:4201', 'http://localhost:4000', 'http://localhost:4200'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.header("Access-Control-Allow-Headers", ["content-type", "authorization"]);
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT");
    i18n.setLocale(req.headers["accept-language"] || 'en');
    next();
});

// Static file serving
app.use('/admin', express.static(path.join(__dirname, '../dist/admin')));
app.use('/', express.static(path.join(__dirname, '../dist/site')));
app.use(i18n.init);
app.set('view engine', 'pug');
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), { maxAge: 7 * 86400000 }));

// MongoDB connection with timeout
const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 0) {
            const mongoUrl = process.env.MONGODB_URI;
            await mongoose.connect(mongoUrl, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 10000,
            });
            console.log("✅ Connected to MongoDB");
        }
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err.message);
    }
};

// Connect to DB but don't block
connectDB();

// MongoDB event listeners
mongoose.connection.on('connected', function () {
    console.log('Good day!');
});

// Routes - CRITICAL: You need to require your routes
try {
    // Note: Socket.IO won't work, so routes that depend on it will fail
    require('../routes')(app, passport, null); // null instead of io since Socket.IO won't work
} catch (err) {
    console.error('Routes loading error:', err.message);
}

// Admin route
app.get('/admin', function (req, res) {
    res.sendFile(path.join(__dirname, '../dist/admin', 'index.html'), { acceptRanges: false });
});

// SPA fallback routes
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/admin/index.html'));
});

app.get('/*', function (req, res) {
    return res.sendFile(path.join(__dirname, '../dist/site', 'index.html'), { acceptRanges: false });
});

// Export for Vercel (DO NOT call listen())
module.exports = app;
