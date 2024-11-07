const mongoose = require('mongoose');
const { Schema } = mongoose;

const AddressSchema = new Schema({
    UserID: {
        type: Schema.Types.ObjectId,
        require: true
    },
    AddressName: {
        type: String,
        require: true
    },
    StreetAdress: {
        type: String,
        require: true
    },
    Apartment: {
        type: String,
    },
    Town: {
        type: String,
        require: true
    },
    Pincode: {
        type: Number,
        require: true
    },
    Mobile: {
        type: Number,
        require: true
    },
    Email: {
        type: String,
        require: true
    },
});


module.exports = (mongoose.model('Address', AddressSchema));