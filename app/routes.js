// routes.js
var EventEntry = require('./models/eventEntry');

module.exports = function (app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function (req, res) {
        res.render('pages/home');
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render('pages/login.ejs', { message: req.flash('loginMessage') }); 
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function (req, res) {

        // render the page and pass in any flash data if it exists
        res.render('pages/signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', { 
        scope : 'email'
    }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect : '/profile',
        failureRedirect : '/'
    }));

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function (req, res) {
        res.render('pages/profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // SEARCH RESULTS ======================
    // =====================================
    app.get("/events/search", function (req, res) {
        console.log("### SEARCH");
        var options = {}, range = 5;

        if (req.query.latitude && req.query.longitude && req.query.range) {

            range = parseInt(req.query.range, 10) || range; // Check for NaN

            options.location = { 
                $geoWithin: { 
                    $centerSphere: [ 
                        [
                            parseFloat(req.query.longitude),
                            parseFloat(req.query.latitude)
                        ], 
                        range / 3963.2 // range is in miles -- convert to ...something
                    ] 
                } 
            }

        } else {
            res.status(400).send({
                error: "Invalid Search Params",
                msg: "Need to give latitude and longitude"
            });
        }

        EventEntry.find(options, function (error, items) {
            if (!error) {
                res.render("pages/search_results", { events: items });
            } else {
                res.status(500).send({
                    error: error,
                    msg: "SEARCH FAILED"
                });
            }
        });

    });

    // =====================================
    // SEARCH FORM =========================
    // =====================================
    app.get("/events/find", function (req, res) {
        res.render("pages/search_listings");
    });

    // =====================================
    // NEW EVENT FORM ======================
    // =====================================
    app.get("/events/new", isLoggedIn, function (req, res) {
        // console.log("###USER", req.user.name, req.user);
        res.render("pages/create_event", { username: req.user.getUsername() });
    });

    // =====================================
    // CREATE EVENT ========================
    // =====================================
    app.post("/events/new", function (req, res) {

        var eventObj = new EventEntry();
        req.body.host = req.user;
        eventObj.populateDetails(req.body);

        eventObj.save(function (err, result) {
            if (!err) {
                // console.log("### Post insert result:", result); 
                res.send({ url: "/events/" + result._id });
            }
            else {
                // console.log("### Insertion ERROR result:", err); 
                res.send({ error: err });
            }
        });
    });

    // =====================================
    // EVENT DETAILS =======================
    // =====================================
    app.get("/events/:eventId", function (req, res) {

        EventEntry.findById(req.params.eventId)
                .populate('host')
                .exec(function (error, item) {
            if (!error) {
                console.log("### query result", item, JSON.stringify(item));
                res.render("pages/view_event", {
                    host: req.user.getUsername(),
                    eventDetails: item,
                    eventId: item._id
                });
            } else {
                // This also handles the invalid ID scenarios
                // console.error("Dump Error:", error);
                res.status(500).send({
                    error: error,
                    msg: "SEARCH FAILED"
                });
            }
        });
    });

    // =====================================
    // EVENT DETAILS UPDATE ================
    // =====================================
    app.post("/events/:eventId", isLoggedIn, function (req, res) {

        // Check if event belongs to the user

        // Unecessary? Can be handled by data model?
        if (!req.params.eventId) {
            res.status(400).send({ error: "Invalid Query" });
            return;
        }

        var eventObj = new EventEntry();
        var updateOptions = eventObj.populateDetails(req.body).getAttributes();

        // Host cannot change after creation
        delete updateOptions.host;
        // people comitted list is only updated by the commit attendance endpoint
        delete updateOptions.people_committed;

        updateOptions = {
            $set: updateOptions
        };

        // var updateOptions = {};

        // if (req.query.active === "false") { 
        //     console.log("### req.query",req.query);
        //     updateOptions = {
        //         $set : {
        //             "active": false
        //         }
        //     };

        // } else if (req.query.active === "true") {
        //     updateOptions = {
        //         $set : {
        //             "active": false
        //         }
        //     };
        // }

        console.log("### Updating ", req.params.eventId, req.query, options);

        
        // @TODO: Add Auth
        EventEntry.findByIdAndUpdate(req.params.eventId, 
                                     updateOptions, 
                                     function (error, result) {
            if (!error) {
                console.log("### Updated", result); 
                res.send({ message: "Update successful", data: result }); 
            } else {
                console.log("### ERROR Updating", req.params.eventId, error); 
                res.send({ error: error });
            }
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}