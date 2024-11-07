const mongoose = require('mongoose');
const { Schema } = mongoose;

const itemSchema = new Schema({
    ItemName: {
        type: String,
        require: true
    },
    ItemDescription: {
        type: String,
        require: true
    },
    quantity: {
        type: Number,
        require: true,
        default: 1
    },
    image: {
        type: String
    },
    price: {
        type: Number,
        require: true
    },
    discount: {
        type: Number,
        default: 0
    },
    Seller: {
        ID: {
            type: mongoose.Schema.Types.ObjectId,
            require: true
        },
        Name: {
            type: String,
            require: true
        }
    },
    type: {
        type: String,
        default: null
    }
});


module.exports = (mongoose.model('Item', itemSchema));