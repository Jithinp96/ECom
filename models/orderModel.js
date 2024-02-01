const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
    userid: {
        type: mongoose.Schema.ObjectId,
        ref: 'users',
        required: true
    },
    products: [{
        productid: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',

        },
        name: {
            type: String,

        },
        price: {
            type: Number,

        },
        quantity: {
            type: Number,

        },
        total: {
            type: Number,

        },
        orderStatus: {
            type: String,
            default: 'placed',
            // enum: ['placed', 'shipped', 'delivered', 'request return', 'returned', 'requested cancellation', 'cancelled']
        },
        reason:{
            type: String,
             default:"N/A",
            required: true,
           
        },
        image:{
            type:String
        }
    }],

    paymentMode: {
        type: String,

    },
    subtotal: {
        type: Number
    },
    date: {
        type: Date
    },
    address: {
        type: Object
    },

    // onlinePaymentStatus:{
    //     type: String,
    // },onlineTransactionId:{
    //     type: String,
    // }

});

module.exports = mongoose.model('Order',orderSchema);