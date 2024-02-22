const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId
const TokenSchema = mongoose.Schema({
    Token:{
        
        type:String,
        required:true
    },
    userId:{
        type:ObjectId,
        ref:'User',
        required:true
    },
    createAt:{
        type:Date,
        default:Date.now
    }
});
TokenSchema.index({createAt: 1 },{expireAfterSeconds: 120});

module.exports = mongoose.model('Token',TokenSchema);