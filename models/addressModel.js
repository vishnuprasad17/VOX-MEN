const mongoose = require('mongoose');

const addressSchema=new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    address:[{
        name:{
            type:String,
            required: true
        },
        mobile:{
            type:String,
            required:true
        },
        pincode:{
            type:String,
            required:true
        },
        address:{
            type:String,
            required: true
        },
        town:{
            type:String,
            required: true
        },
        state:{
            type:String,
            required: true
        }
    }]
})

module.exports=mongoose.model('address',addressSchema)