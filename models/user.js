var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
    email: String,
    name: String,
    campus: Number, // Campus code
    phone_number: String,
    avatar_url: { // urls from google storage
        sm: String, 
        md: String, 
        lg: String, 
    },
    email_verification: {
        code: Number,
        code_sent_date: String,
        number_of_attempts: Number,
        is_verified: {type: Boolean, default: false}
    },
    is_loggedin: {type: Boolean, default: false},
    is_complete: {type: Boolean, default: false}, // Signup is complete
    secret: String, // shared secret for HMAC JWT token auth and secure messages
    creation_date: {type: String, default: new Date().toUTCString()},

})

module.exports = mongoose.model("User",UserSchema)