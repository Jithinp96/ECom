const mongoose = require("mongoose");
const Offer = require("./offerModel");
const Category = require("./categoryModel");

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
    },

    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer'
    }
});


productSchema.methods.determineBestOffer = async function() {
    let bestOffer = null;
    let bestOfferType = null;

    const isOfferValid = (offer) => {
        const currentDate = new Date();
        const startDate = new Date(offer.startDate);
        const expiryDate = new Date(offer.expiryDate);

        return currentDate >= startDate && currentDate <= expiryDate;
    };

    try {
        if (this.offer) {
            const productOffer = this.offer;
            
            if (productOffer && productOffer.is_active && isOfferValid(productOffer)) {
                bestOffer = productOffer;
                bestOfferType = 'product';
            }
        }
        
        if (this.category) {
            const category = await Category.findById(this.category).populate('offer').exec();

            if (category && category.offer && category.offer.is_active && isOfferValid(category.offer)) {
                if (!bestOffer || category.offer.discountPercentage > bestOffer.discountPercentage) {
                    bestOffer = category.offer;
                    bestOfferType = 'category';
                }
            }
        }
    } catch (error) {
        console.error("Error determining best offer:", error);
    }

    return { bestOffer, bestOfferType };
};

const Products = mongoose.model('Products', productSchema);

module.exports = Products