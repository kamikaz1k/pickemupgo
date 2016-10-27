// expose our config directly to our application using module.exports

module.exports = {

    'facebookAuth' : {
        'clientID'      : process.env.FB_APP_ID, // your App ID
        'clientSecret'  : process.env.FB_APP_SECRET, // your App Secret
        'callbackURL'   : process.env.FB_CALLBACK_URL //'http://localhost:5000/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'       : process.env.TWIT_CONSUMER_KEY, //'your-consumer-key-here',
        'consumerSecret'    : process.env.TWIT_CONSUMER_SECRET, //'your-client-secret-here',
        'callbackURL'       : process.env.TWIT_CALLBACK_URL //'http://localhost:5000/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'      : 'your-secret-clientID-here',
        'clientSecret'  : 'your-client-secret-here',
        'callbackURL'   : 'http://localhost:5000/auth/google/callback'
    }

};