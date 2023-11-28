const mongoose = require('mongoose');

const productsSchema = mongoose.Schema({
    brand: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true
    },
    size: {
        type: Array,
    },
    price: {
        type: Number,
        required: true
    },
    dPrice: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number
    },
    images: {
        type: Array
    },
    status: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    reviews: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            // required: true
        },
        title: {
            type: String,
        },
        description: {
            type: String,
            // required: true
        },
        rating: {
            type: Number,
            // required: true
        },
        createdAt: { type: Date }
    }],
    totalRating: {
        type: Number,
        default: 0
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'offer',
    },
    offerPrice: { type: Number },
    offerAppliedBy: { type: String }
})

module.exports = mongoose.model('product', productsSchema)