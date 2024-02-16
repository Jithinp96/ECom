const mongoose = require ("mongoose");

const wallet = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },

    amount: {
        type: Number,
        default: 0
    },

    walletHistory: {
        type: Array
    }
});

const Wallet = mongoose.model("Wallet", wallet);

module.exports = Wallet;