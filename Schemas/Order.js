const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderItemSchema = new Schema({
    item: {
        type: Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    pricePerItem: {
        type: Number,
        required: true
    }
});

const OrderSchema = new Schema({
    UserID: {
        type: Schema.Types.ObjectId,
        require: true
    },
    OrderDate: {
        type: Date,
        require: true
    },
    Items: [OrderItemSchema],
    Address: {
        type: Schema.Types.ObjectId,
        require: true
    },
    COD: {
        type: Boolean,
        require: true
    },
    OrderStatus: {
        type: String,
        default: 'Order Placed'
    }
});


module.exports = (mongoose.model('Order', OrderSchema));