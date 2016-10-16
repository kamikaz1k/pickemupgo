
var express = require('express');
var app = express();

var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

// var MongoClient = require('mongodb').MongoClient;
// var ObjectID = require('mongodb').ObjectID;
// var database = {}; // Global reference to the DB

var EventEntry            = require('./app/models/eventEntry');

// Configuration
var mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI);

require('./config/passport')(passport); // pass passport for configuration

app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
// app.use(bodyParser()); 

// get information from html forms
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// required for passport
app.use(session({ 
    secret: 'ilovescotchscotchyscotchscotch',
    resave: true,
    saveUninitialized: true
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// load our routes and pass in our app and fully configured passport
require('./app/routes.js')(app, passport);

app.set('port', (process.env.PORT || 5000));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.listen(app.get('port'), function() {
  console.log('### Node app is running on port', app.get('port'));
});
