const mongoose = require('mongoose');

const couponSchema = mongoose.Schema({
  
    couponCode : {
        type : String,
        require : true
    },
    discountAmount : {
      type : Number,
      require : true
    },

    minOrderAmount : {
      type : Number ,
      require : true 
    },
    couponDescription: {
        type : String,
        require : true
    },
    startDate : {
        type : String,
        require : true
      },
  
    expiryDate : {
        type : String,
        require : true
    },
  
    userUsed : {
      type : Array, 
      ref : 'users',
      default : []
    },
    active : {
      type : Boolean,
      default : false
    }
  

})

module.exports = mongoose.model('Coupon',couponSchema)