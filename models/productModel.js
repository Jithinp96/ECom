const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    price:{
        type:Number,
        required: true
    },
    quantity:{
        type:Number,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:[String],
        required:true
    },
    is_listed: {
        type: Boolean,
        default:true
    }
});

const Products = mongoose.model('Products', productSchema);

module.exports = Products