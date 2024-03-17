const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    is_listed: {
        type: Boolean,
        default:true
    },

    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer'
    }
})

module.exports = mongoose.model('Category', categorySchema);