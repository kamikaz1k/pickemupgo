
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var database = {}; // Global reference to the DB

var passport = require('passport');
// console.log(passport);

var mongoURI = process.env.MONGODB_URI || "mongodb://mainadmin:mainadmin@ds013216.mlab.com:13216/local-pickup"; 

// Connect to the db
MongoClient.connect(mongoURI, function(error, db) {
    // Get reference to DB
    if (!error) {
        database = db;
        // Else push error
    } else {
        console.error("Error connecting to DB", error);
    }
});

app.set('port', (process.env.PORT || 5000));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// To parse the form information
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.get('/new_event', function (request, response) {
    // if (request.query.entry) {
    console.log("new_event");
    response.render("pages/create_event");
});

app.post("/new_event", function (request, response) {
    // if (request.query.entry) {
    console.log("### new_event", request.body);

    var eventObj = new EventEntry(request.body);

    console.log("saving object to FBs!", eventObj);
    
    // Ensure there is atleast one entry, and that it has a pokemon ID and location info
    if (eventObj) {
        database.collection('eventEntry')
            .insert(eventObj, function(error, result) { 
                if (error) { 
                    console.log("### Insertion ERROR result:", error); 
                    response.send({ error: error});
                } else {
                    console.log("### Post insert result:", result); 
                    // response.send({ message: "Entered find", data: result });1
                    console.log("## REDIRECTING", result.ops[0]);
                    response.redirect("/event_page/" + result.ops[0]._id);
                    // response.redirect("/event/" + result.ops[0]._id);
                }
            });
        
    } else {
        console.log("### Incorrect:", eventObj);
        response.status(400).send({ error: "Bad Request :: new Entry invalid" });
    }

});

app.get("/event_page/:eventId", function (request, response) {

    var options = {};
    options._id = ObjectID(request.params.eventId);

    console.log("options",options);

    database.collection('eventEntry')
        .find(options).toArray(function (error, items) {
            if (!error) {
                // response.render('pages/dump', { items: items }); 
                // response.send({ message: "Dump of collection: Test", data: items }); 
                var details = { 
                    title: items[0].title, 
                    eventDetails: items[0], 
                    eventId: items[0]._id 
                };
                response.render("pages/event_details", details);
            } else {
                console.error("Dump Error:", error);
                response.status(500).send({ error: 'DUMP FAILED' });
            }
        });
});

app.get("/event/:eventId", function (request, response) {

    var options = {};
    options._id = ObjectID(request.params.eventId);

    // console.log("options",options);

    database.collection('eventEntry')
        .find(options).toArray(function (error, items) {
            if (!error) {
                console.log("SUCCESS", items);
                response.send(items[0]);
            } else {
                console.error("Dump Error:", error);
                response.status(500).send({ error: 'DUMP FAILED' });
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
    options["_id"] = ObjectID(request.params.eventId);
    options.justOne = true;

    var updateOptions = {};

    if (request.query.active === "false") { 
        console.log("### request.query",request.query);

    } else if (request.query.active === "true") {
        updateOptions = { $set : { "active": "true" } };
    }

    // console.log("Updating ", request.params.eventId, options);
    console.log("### Updating ", request.params.eventId, request.query, options);

    database.collection('eventEntry')
    .update(
        options,
        // {"_id": ObjectID("57b925c7c83b242f4c2a251f") },
        // { $set : { "active": "false" } },
        updateOptions,
        function (error, results) {
            // console.log(results);
            if (!error) {
                console.log("### Updated", results); 
                response.send({ message: "Update successful", data: results }); 
            } else {
                console.log("### ERROR DELETING", options._id, error); 
                response.send({ error: error });
            }
        }
   );

});

app.get("/signup", function (request, response) {
    response.render("pages/signup");
});

app.get("/signin", function (request, response) {
    response.render("pages/signin");
});

app.post("/signin", 
    passport.authenticate('local'),
    function (request, response) {
        // If this function gets called, authentication was successful.
        // `req.user` contains the authenticated user.
        // res.redirect('/users/' + request.user.username);
        response.send("signed in!", request.user.username);
    }
);

app.get("/find_events", function (request, response) {
    response.render("pages/search_listings");
});

app.get("/search_results", function (request, response) {

    var options = {};

    if (request.query.latitude && request.query.longitude) {
        var range = request.query.range || 5;

        options.location = { 
            $geoWithin: { 
                $centerSphere: [ 
                    [ parseFloat(request.query.longitude), parseFloat(request.query.latitude) ], 
                    range / 3963.2 // range is in miles -- convert to ...something
                ] 
            } 
        }

    }

    database.collection('eventEntry')
    .find(options).toArray(function (error, items) {
        if (!error) {
            // response.render('pages/dump', { items: items }); 
            response.render("pages/search_results", { events: items });
        } else {
            console.error("Dump Error:", error);
            response.status(500).send({ error: 'DUMP FAILED' });
        }
    });
});

app.get('/search', function (request, response) {

    var options = {};
    if (request.query.pokemon_id) options.pokemon_id = request.query.pokemon_id;

    if (request.query.latitude && request.query.longitude) {
        var range = request.query.range || 5;

        options.location = { 
            $geoWithin: { 
                $centerSphere: [ 
                    [ parseFloat(request.query.longitude), parseFloat(request.query.latitude) ], 
                    range / 3963.2 // range is in miles -- convert to ...something
                ] 
            } 
        }

    }

    database.collection('eventEntry')
    .find(options).toArray(function (error, items) {
        if (!error) {
            // response.render('pages/dump', { items: items }); 
            response.send({ message: "Dump of collection: Test", data: items }); 
        } else {
            console.error("Dump Error:", error);
            response.status(500).send({ error: 'DUMP FAILED' });
        }
    });

});

app.post("/create_user", function (request, response) {
    console.log("request.body",request.body);
});

function EventEntry (options) {
    // @TODO Figure out lat long logic
    var longitude = -0.09, latitude = 51.505;

    this.title = options.title ? options.title : "";
    this.host = options.host ? options.host : "";
    this.address = options.address ? options.address : ""; 
    this.active = options.active ? options.active : "true"; 
    this.location = { type: "Point", coordinates: [ parseFloat(longitude), parseFloat(latitude) ] };
    this.start = options.start ? options.start : "";
    this.end = options.end ? options.end : "";
    this.activityType = options.activityType ? options.activityType : "";
    this.groupSize = options.groupSize ? options.groupSize : "";
}

app.listen(app.get('port'), function() {
  console.log('### Node app is running on port', app.get('port'));
});
