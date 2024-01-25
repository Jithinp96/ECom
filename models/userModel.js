const mongoose = require ("mongoose");

const user = mongoose.Schema({
    name :{
        type : String,
        required:true   
    },
      email:{
        type : String,
        required:true
    },
      mobile :{
        type: String,
        required:true
    },
      password :{
        type: String,
        required:true
    },
    dateJoined: {
      type: Date,
      default: Date.now
    },
      is_admin :{
        type : Number,
        default:0
    },
      is_blocked :{
        type:Boolean,
        default:false
    },
      is_verified :{
        type : Boolean,
        default:false
    }
})

const User = mongoose.model("User", user);

module.exports = User;