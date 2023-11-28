const OFFER = require('../models/offerModel')

module.exports = {
getOffer : async (req, res, next) => {
    try {
        const offers = await OFFER.find({})
        res.render('admin/offer', { offers,pageTitle:'Offer' })
    } catch (error) {
        next(error)
    }
},

getAddOffer : async (req, res, next) => {
    try {
        var offerExists = req.app.locals.offerExists
        req.app.locals.offerExists = null
        res.render('admin/offerAdd', { offerExists,pageTitle:'Add Offer' })
    } catch (error) {
        next(error)
    }
},

postAddOffer : async (req, res, next) => {
    try {
        let { name, discount, expiryDate } = req.body
        name = name.toUpperCase()

        const offerExists = await OFFER.findOne({ name })
        if (offerExists) {
            req.app.locals.offerExists = 'Offer Already Exists'
            return res.redirect('/admin/addOffer')
        }
        await OFFER({ name, discount, expiryDate }).save()
        res.redirect('/admin/offers')
    } catch (error) {
        next(error)
    }
},

getEditOffer : async (req, res, next) => {
    try {
        const offerId = req.query.id
        var offerExists = req.app.locals.offerExists
        req.app.locals.offerExists = null
        const offerData = await OFFER.findOne({ _id: offerId })
        res.render('admin/offerEdit', { offerData, offerExists,pageTitle:'Edit Offer' })
    } catch (error) {
        next(error)
    }
},

postEditOffer : async (req, res, next) => {
    try {

        const id = req.params.id
        let name = req.body.name
        name = name.toUpperCase()
        let discount = req.body.discount

        const offerExists = await OFFER.findOne({ name })
        if (offerExists && offerExists._id != id) {
            req.app.locals.offerExists = 'Offer already exists'
            return res.redirect(`/admin/editOffer?id=${id}`)
        }

        if (req.body.expiryDate) {
            await OFFER.updateOne({ _id: id }, {
                $set: { name, discount, expiryDate: req.body.expiryDate }
            })
        } else {
            await OFFER.updateOne({ _id: id }, {
                $set: { name, discount }
            })
        }
        res.redirect('/admin/offers')

    } catch (error) {
        next(error)
    }
},

offerStatus : async (req, res, next) => {
    try {
        const offerId = req.params.id
        const offerData = await OFFER.findOne({ _id: offerId })
        if (offerData.status === true) {
            await OFFER.updateOne({ _id: offerId }, { $set: { status: false } })
        } else {
            await OFFER.updateOne({ _id: offerId }, { $set: { status: true } })
        }
        res.redirect('/admin/offers')
    } catch (error) {
        next(error)
    }
}


}