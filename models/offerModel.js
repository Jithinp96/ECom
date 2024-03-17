const mongoose = require('mongoose');

//Schema for product and category offer
const offerSchema = mongoose.Schema({
    offerName : {
        type : String,
        require : true
    },
    discountPercentage: { 
        type: Number, 
        required: true 
    },
    startDate : {
        type : String,
        require : true
    },
  
    expiryDate : {
        type : String,
        require : true
    },

    is_active: {
        type : Boolean,
        default : true
    }
});

//Schema for referral offer.
const referralOfferSchema = mongoose.Schema({
    referringUserId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    referredUserId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    rewardAmount: { 
        type: Number, 
        required: true 
    },
    startDate : {
        type : String,
        require : true
      },
  
    expiryDate : {
        type : String,
        require : true
    }
});


const Offer = mongoose.model('Offer',offerSchema);
const ReferralOffer = mongoose.model('ReferralOffer',referralOfferSchema);

module.exports = {
    Offer,
    ReferralOffer
}