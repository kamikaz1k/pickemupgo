
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
// mongoose.connect(configDB.url);
var mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI);
// console.log(passport);
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

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// Connect to the db
// MongoClient.connect(mongoURI, function(error, db) {
//     // Get reference to DB
//     if (!error) {
//         database = db;
//         // Else push error
//     } else {
//         console.error("Error connecting to DB", error);
//     }
// });

app.set('port', (process.env.PORT || 5000));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get("/", function (request, response) {
    response.render("pages/home");
});

app.get('/new_event', function (request, response) {
    response.render("pages/create_event");
});

app.post("/new_event", function (request, response) {
    // if (request.query.entry) {
    console.log("### new_event", request.body);

    // var eventObj = new EventEntry(request.body);
    var eventObj = new EventEntry();

    request.body.host = request.user;
    eventObj.populateDetails(request.body);

    // console.log("Saving object to DB!", eventObj);

    eventObj.save(function (err, result) {
        if (!err) {
            console.log("### Post insert result:", result); 
            // console.log("### REDIRECTING");
            response.send({ url: "/event_page/" + result._id });
        }
        else {
            console.log("### Insertion ERROR result:", err); 
            response.send({ error: err });
        }
    });

});

app.get("/event_page/:eventId", function (request, response) {

    // var options = {};
    // options._id = ObjectID(request.params.eventId);

    // console.log("options",options);

    // database.collection('eventEntry')
    //     .find(options).toArray(function (error, items) {
    //         if (!error) {
    //             // response.render('pages/dump', { items: items }); 
    //             // response.send({ message: "Dump of collection: Test", data: items }); 
    //             var details = { 
    //                 title: items[0].title, 
    //                 eventDetails: items[0], 
    //                 eventId: items[0]._id 
    //             };
    //             console.log("### eventDetails", details);
    //             response.render("pages/view_event", details);
    //         } else {
    //             console.error("Dump Error:", error);
    //             response.status(500).send({ error: 'DUMP FAILED' });
    //         }
    //     });
    
    EventEntry.findById(request.params.eventId, function (error, item) {
        if (!error) {
            console.log("### query result", item);
            var details = { 
                title: item.title, 
                eventDetails: item, 
                eventId: item._id 
            };
            console.log("### eventDetails", details);
            response.render("pages/view_event", details);

        } else {
            console.error("Dump Error:", error);
            response.status(500).send({ error: 'DUMP FAILED' });
        }
    });
});

app.get("/event/:eventId", function (request, response) {


    EventEntry.findById(request.params.eventId, function (error, item) {
        if (!error) {
            console.log("### query result", item);
            response.send(details);

        } else {
            console.error("Dump Error:", error);
            response.status(500).send({ error: error });
        }
    });

});

app.post("/event/:eventId", function (request, response) {
    // Check if event belongs to the user

    var options = {};

    if (!request.params.eventId) {
        response.status(400).send({ error: "Invalid Query" });
        return;
    }

    // Had to wrap the _id param in quote, otherwise it didn't work.
    // options["_id"] = ObjectID(request.params.eventId);
    // options.justOne = true;

    var updateOptions = {};

    if (request.query.active === "false") { 
        console.log("### request.query",request.query);
        updateOptions = { $set : { "active": false } };

    } else if (request.query.active === "true") {
        updateOptions = { $set : { "active": true } };
    }

    console.log("### Updating ", request.params.eventId, request.query, options);

    // database.collection('eventEntry')
    // .update(
    //     options,
    //     // {"_id": ObjectID("57b925c7c83b242f4c2a251f") },
    //     // { $set : { "active": "false" } },
    //     updateOptions,
    //     function (error, results) {
    //         // console.log(results);
    //         if (!error) {
    //             console.log("### Updated", results); 
    //             response.send({ message: "Update successful", data: results }); 
    //         } else {
    //             console.log("### ERROR DELETING", options._id, error); 
    //             response.send({ error: error });
    //         }
    //     }
    // );
    
    // @TODO: Add Auth
    EventEntry.findByIdAndUpdate(request.params.eventId, 
                                 updateOptions, 
                                 function (error, result) {
        if (!error) {
            console.log("### Updated", result); 
            response.send({ message: "Update successful", data: result }); 
        } else {
            console.log("### ERROR DELETING", options._id, error); 
            response.send({ error: error });
        }
    });

});

// app.get("/signup", function (request, response) {
//     response.render("pages/signup");
// });

// app.get("/signin", function (request, response) {
//     response.render("pages/signin");
// });

// app.post("/signin", 
//     passport.authenticate('local'),
//     function (request, response) {
//         response.send("signed in!", request.user.username);
//     }
// );

app.get("/find_events", function (request, response) {
    response.render("pages/search_listings");
});
// duplicate of above
app.get("/search_events", function (request, response) {
    response.render("pages/search_listings");
});

app.get("/search_results", function (request, response) {

    var options = {};

    if (request.query.latitude && request.query.longitude) {
        var range = parseInt(request.query.range, 10) || 5;
        console.log("range", range);

        options.location = { 
            $geoWithin: { 
                $centerSphere: [ 
                    [ parseFloat(request.query.longitude), parseFloat(request.query.latitude) ], 
                    range / 3963.2 // range is in miles -- convert to ...something
                ] 
            } 
        }

    }

    console.log("options", JSON.stringify(options));

    EventEntry.find(options, function (error, items) {
        if (!error) {
            console.error("Search Results:", items);
            response.render("pages/search_results", { events: items });
        } else {
            console.error("Dump Error:", error);
            response.status(500).send({ error: 'DUMP FAILED' });
        }
    });

    // database.collection('eventEntry')
    // .find(options).toArray(function (error, items) {
    //     if (!error) {
    //         // response.render('pages/dump', { items: items }); 
    //         response.render("pages/search_results", { events: items });
    //     } else {
    //         console.error("Dump Error:", error);
    //         response.status(500).send({ error: 'DUMP FAILED' });
    //     }
    // });
});

// app.get('/search', function (request, response) {

//     var options = {};
//     if (request.query.pokemon_id) options.pokemon_id = request.query.pokemon_id;

//     if (request.query.latitude && request.query.longitude) {
//         var range = request.query.range || 5;

//         options.location = { 
//             $geoWithin: { 
//                 $centerSphere: [ 
//                     [ parseFloat(request.query.longitude), parseFloat(request.query.latitude) ], 
//                     range / 3963.2 // range is in miles -- convert to ...something
//                 ] 
//             } 
//         }

//     }

//     console.log("EventEntry", EventEntry);
//     // database.collection('eventEntry')
//     EventEntry
//     .find()
//     // .toArray(function (error, items) {
//     .exec(function (error, items) {
//         if (!error) {
//             // response.render('pages/dump', { items: items }); 
//             response.send({ message: "Dump of collection: Test", data: items }); 
//         } else {
//             console.error("Dump Error:", error);
//             response.status(500).send({ error: 'DUMP FAILED' });
//         }
//     });

// });

// app.post("/create_user", function (request, response) {
//     console.log("request.body",request.body);
// });

// function EventEntry (options) {
//     // @TODO Figure out lat long logic
//     // var longitude = -0.09, latitude = 51.505;

//     // Title of the Event
//     this.title = options.title ? options.title : "";
//     // Who is hosting the event
//     this.host = options.host ? options.host : "";
//     // The Name of the location
//     this.location_name = options.location_name ? options.location_name : ""; 
//     // The proper address of the location
//     this.formatted_address = options.formatted_address ? options.formatted_address : ""; 
//     // Google maps url to location
//     this.url = options.url ? options.url : ""; 
//     // Is the event active?
//     this.active = options.active ? options.active : "true"; 
//     // The date it is happening
//     this.date = options.date ? options.date : ""; 
//     // The starting time of the event
//     this.start_time = options.start_time ? options.start_time : "";
//     // The ending time of the event
//     this.end_time = options.end_time ? options.end_time : "";
//     // The type of activity
//     this.activity_type = options.activity_type ? options.activity_type : "";
//     // Number of people the organizer is looking for
//     this.group_size = options.group_size ? parseInt(options.group_size, 10) : 0;
//     // Current committments to actually come
//     this.people_committed = options.people_committed ? parseInt(options.people_committed, 10) : 0;

//     // location coordinate stuff
//     if (options.latitude && options.longitude)
//         this.location = { 
//             type: "Point", 
//             coordinates: [ parseFloat(options.longitude), parseFloat(options.latitude) ] };
// }

app.listen(app.get('port'), function() {
  console.log('### Node app is running on port', app.get('port'));
});
