const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    date: {
        type: Date,
        required: true
    },
    wallet: {
        type: Number,
        default: 0
    },
    walletHistory: [{
        transactionDate: {
            type: Date,
        },
        transactionDetail: {
            type: String
        },
        transactionType: {
            type: String
        },
        transactionAmount: {
            type: Number,
        },
        currentBalance: {
            type: Number
        }
    }],
    wishList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
    }],
    referralCode: {
        type: String
    },
    isReferred: {
        type: Boolean
    }
})

module.exports = mongoose.model('User', userSchema)