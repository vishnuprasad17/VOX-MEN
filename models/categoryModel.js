const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    // size: {
    //     type:[]
    // },
    status: {
        type: Boolean,
        default: true
    },
    image: {
        type: String
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'offer',
    }
})



module.exports = mongoose.model('category', categorySchema)