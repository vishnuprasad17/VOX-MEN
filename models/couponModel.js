const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    purchaseLimit: {
        type: Number,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    usedUsers: {
        type: Array
    }
})

module.exports = mongoose.model('coupon', couponSchema)