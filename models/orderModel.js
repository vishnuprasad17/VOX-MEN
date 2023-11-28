const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deliveryAddress: {
        type: Object
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true
        },
        productName: {
            type: String
        },
        productPrice: {
            type: Number
        },
        productDiscountPrice: {
            type: Number
        },
        size: {
            type: String
        },
        quantity: {
            type: Number
        },
        totalProductPrice: {
            type: Number
        },
        totalProductDiscountPrice: {
            type: Number
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    couponName: {
        type: String
    },
    couponDiscount: {
        type: Number
    }
})

module.exports = mongoose.model('order', orderSchema)