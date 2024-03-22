const mongoose = require("mongoose");
const User = require("./orderModel");

const transactionSchema = mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['Credit', 'Debit'],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    orderId2: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const walletSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    balance: {
        type: Number,
        default: 0
    },
    walletHistory: [transactionSchema]
});

const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = Wallet;