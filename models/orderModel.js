const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');


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
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        offerDiscount: {
            type: Number,
            default: 0
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
        required: true
    },
    orderId: {
        type:String,
        required:true
    },
    hashedOrderId: {
        type:String,
        required:true
    },

    subTotal: {
        type: Number,
        // required: true
    },
    couponDiscount:{
        type: Number,
        default:0
    },
    grandTotal: {
        type: Number
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

orderSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Order', orderSchema);