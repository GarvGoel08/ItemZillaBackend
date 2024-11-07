const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        require: true
    },
    pass: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    seller: {
        type: Boolean,
        default: false,
    },
    otp: {
        code: {
            type: String,
            default: null
        },
        expirationTime: {
            type: Date,
            default: null
        }
    }
});


module.exports = (mongoose.model('User', userSchema));