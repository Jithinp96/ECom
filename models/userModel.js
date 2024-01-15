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
      is_admin :{
        type : Number,
        default:0
    },
      Blocked :{
        type:Boolean,
        default:false
    },
      verified :{
        type : Boolean,
    }
})

const User = mongoose.model("User", user);

module.exports = User;