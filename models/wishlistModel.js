const mongoose = require("mongoose");

const wishlistSchema = mongoose.Schema({
    userid: {
        type: mongoose.Schema.ObjectId,
        ref: 'users',
        required: true
    },
    product: [
        {
            productid: {
                type: mongoose.Schema.ObjectId,
                ref: 'Product',
                required: true
            },
        }
    ],
})

module.exports = mongoose.model('Wishlist', wishlistSchema);