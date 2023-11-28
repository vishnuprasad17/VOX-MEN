const ADDRESS = require('../models/addressModel')

module.exports = {

manageAddress : async (req, res,next) => {
    try {
        const user = req.session.user
        const userAddress = await ADDRESS.findOne({ user: user._id })

        var addressLimit = req.app.locals.specialContext;
        req.app.locals.specialContext = null;
        // console.log(userAddress);

        res.render('user/manageAddress', { userAddress, user, addressLimit,pageTitle:'Manage Address'})
    } catch (error) {
        next(error)
    }
},



getAddAddress : async (req, res,next) => {
    try {
        let user = req.session.user
        let userAddress = await ADDRESS.findOne({ user: user._id })

        let addressLocation = req.query.location
        // console.log(userAddress);
        if (userAddress && userAddress.address.length == 5) {
            req.app.locals.specialContext = 'user can only add upto 5 address'
            res.redirect('/manage-address')
        } else {
            res.render('user/addressAdd', { user, addressLocation,pageTitle:'Add Address' })
        }

    } catch (error) {
        next(error)
    }
},



postAddAddress : async (req, res,next) => {
    try {
        const user = req.session.user
        const { name, mobile, pincode, address, town, state } = req.body
        const addressData = await ADDRESS.findOne({ user: user._id })
        const addressLocation = req.params.addressLocation

        if (addressData) {
            await ADDRESS.updateOne({ user: user._id },
                {
                    $addToSet: {
                        address: {
                            name, mobile, pincode, address, town, state
                        }
                    }
                })
        } else {
            await new ADDRESS({
                user: user._id,
                address: [{
                    name, mobile, pincode, address, town, state
                }]
            }).save()
        }

        if (addressLocation === 'profile') {
            return res.redirect('/profile')
        } else {
            return res.redirect('/placeOrder')
        }
    } catch (error) {
        next(error)
    }
},

getEditAddress : async (req, res,next) => {
    try {
        const user = req.session.user
        const addressId = req.query.id
        const location = req.query.location

        const addressData = await ADDRESS.findOne({ user: user._id, 'address._id': addressId })
        const address = addressData.address.find(obj => obj._id.toString() === addressId)

        res.render('user/addressEdit', { address, user, location,pageTitle:'Edit Address' })
    } catch (error) {
        next(error)
    }
},

postEditAddress : async (req, res,next) => {
    try {
        const user = req.session.user
        const id = req.params.id
        const location = req.query.location
        const { name, mobile, pincode, address, town, state } = req.body

        await ADDRESS.updateOne({ user: user._id, 'address._id': id },
            {
                $set: {
                    'address.$.name': name,
                    'address.$.mobile': mobile,
                    'address.$.pincode': pincode,
                    'address.$.address': address,
                    'address.$.town': town,
                    'address.$.state': state,

                }
            })
        if (location === 'profile') {

            return res.redirect('/manage-address')
        } else {
            return res.redirect('/placeOrder')
        }

    } catch (error) {
        next(error)
    }
},


deleteAddress : async (req, res,next) => {
    try {
        const user = req.session.user
        // console.log(user._id);
        const id = req.params.id
        // console.log(id);
        await ADDRESS.findOneAndUpdate({ user: user._id, 'address._id': id },
            {
                $pull: { address: { _id: id } }
            })
        res.redirect('/manage-address')
    } catch (error) {
        next(error)
    }
},




}