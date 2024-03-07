const mongoose = require("mongoose");

const cartSchema = mongoose.Schema({
    userid: {
        type: mongoose.Schema.ObjectId,
        ref: 'users',
        required: true
    },
    product: [
        {
            productid: {
                type: mongoose.Schema.ObjectId,
                ref: 'Products',
                required: true
            },
            quantity: {
                type: Number,
                default: 1
            },
            offerDiscount: {
                type: Number,
                default: 0
            },
            totalPrice: {
                type: Number,
                required: true
            },
            image: {
                type:String,
                
            }
        }
    ],
    subTotal: {
        type: Number,
        default: 0
    },
    couponDiscount: {
        type: Number,
        default: 0
    },
    grandTotal: {
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model('Cart', cartSchema);