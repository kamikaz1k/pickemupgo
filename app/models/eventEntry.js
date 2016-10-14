// EventEntry.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our Event Entry model
var eventEntrySchema = mongoose.Schema({

    title               : String,
    host                : mongoose.Schema.Types.ObjectId,
    location_name       : String,
    formatted_address   : String,
    url                 : String,
    active              : Boolean,
    date                : String, // Should be Date
    start_time          : String, // Should be Date
    end_time            : String, // Should be Date
    activity_type       : String,
    group_size          : Number,
    people_committed    : [{type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    location            : {
        type: {
            type: "String",
            required: true,
            enum: ['Point', 'LineString', 'Polygon'],
            default: 'Point'
        },
        coordinates: [Number]
    },

});

eventEntrySchema.index({ 'location': '2dsphere' });

eventEntrySchema.methods.populateDetails = function (options) {

    // Title of the Event
    this.title = options.title ? options.title : "";

    // Who is hosting the event
    this.host = options.host;

    // The Name of the location
    this.location_name = options.location_name ? options.location_name : "";

    // The proper address of the location
    this.formatted_address = options.formatted_address ? options.formatted_address : "";

    // Google maps url to location
    this.url = options.url ? options.url : "";

    // Is the event active?
    this.active = options.active ? options.active : true;

    // The date it is happening
    this.date = (/[0-9]{4}\-[0-9]{2}\-[0-9]{2}/).test(options.date) ? options.date : (new Date()).toISOString().slice(0,10); // YYYY-MM-DD

    // The starting time of the event
    this.start_time = options.start_time ? options.start_time : "";

    // The ending time of the event
    this.end_time = options.end_time ? options.end_time : "";

    // The type of activity
    this.activity_type = options.activity_type ? options.activity_type : "";

    // Number of people the organizer is looking for
    this.group_size = isNaN(parseInt(options.group_size, 10)) ? 0 : parseInt(options.group_size, 10);

    // Current committments to actually come
    this.people_committed = [];

    // location coordinate stuff
    if (options.latitude && options.longitude) {
        this.location = { 
            type: "Point", 
            coordinates: [ parseFloat(options.longitude), parseFloat(options.latitude) ] 
        };
    }
}

// create the model for users and expose it to our app
module.exports = mongoose.model('EventEntry', eventEntrySchema);