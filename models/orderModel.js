const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Products',
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        },
        orderStatus: {
            type: String,
            default: 'Placed',
        },
        reason:{
            type: String,
            default: "N/A",
        },
        image:{
            type:String
        }
    }],
    edd: {
        type: Date,
    },
    paymentMode: {
        type: String,
        required: true
    },
    paymentId: {
        type: String,
        required: true // Add required validation as per your requirement
    },
    orderId: {
        type:String,
        required:true
    },
    hashedOrderId: {
        type:String,
        required:true
    },

    subtotal: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    address: {
        name: String,
        housename: String,
        street: String,
        city: String,
        state: String,
        pin: String,
        mobile: String,
    }
});


module.exports = mongoose.model('Order', orderSchema);