const COUPON = require('../models/couponModel')
const CART = require('../models/cartModel')
const USER = require('../models/userModel')

module.exports = {
getCoupon : async (req, res, next) => {
    try {
        const coupons = await COUPON.find({})
        res.render('admin/coupon', { coupons,pageTitle:'Coupon' })
    } catch (error) {
        next(error)
    }
},


getAddCoupon : async (req, res, nex) => {
    try {
        var nameExists = req.app.locals.nameExists
        req.app.locals.nameExists = null
        res.render('admin/couponAdd', { nameExists,pageTitle:'Add Coupon' })
    } catch (error) {
        next(error)
    }
},

postAddCoupon : async (req, res, next) => {
    try {
        const { description, discount, purchaseLimit, expiryDate } = req.body
        let name = req.body.name.toUpperCase()

        const nameExists = await COUPON.findOne({ name })
        if (nameExists) {
            req.app.locals.nameExists = 'Coupon Already Exists'
            return res.redirect('/admin/addCoupon')
        }
        await new COUPON({ name, description, discount, purchaseLimit, expiryDate }).save()
        res.redirect('/admin/coupon')
    } catch (error) {
        next(error)
    }
},

getEditCoupon : async (req, res, next) => {
    try {
        const id = req.query.id
        const couponData = await COUPON.findOne({ _id: id })
        var nameExists = req.app.locals.nameExists
        req.app.locals.nameExists = null
        res.render('admin/couponEdit', { couponData, nameExists,pageTitle:'Edit Coupon' })
    } catch (error) {
        next(error)
    }
},

postEditCoupon : async (req, res, next) => {
    try {
        const id = req.params.id
        console.log(id);
        const { description, discount, purchaseLimit, expiryDate } = req.body
        let name = req.body.name.toUpperCase()

        const couponNameExists = await COUPON.findOne({ name })
        if (couponNameExists && couponNameExists._id != id) {
            req.app.locals.nameExists = 'Coupon already exists'
            return res.redirect(`/admin/editCoupon?id=${id}`)
        }
        await COUPON.findByIdAndUpdate({ _id: id }, { $set: { name, description, discount, purchaseLimit, expiryDate } })
        res.redirect('/admin/coupon')


    } catch (error) {
        next(error)
    }
},

changeStatus : async (req, res, next) => {
    try {
        const id = req.params.id
        const couponData = await COUPON.findOne({ _id: id })
        if (couponData) {
            if (couponData.status === true) {
                await COUPON.findByIdAndUpdate({ _id: id }, { $set: { status: false } })
            } else {
                await COUPON.findByIdAndUpdate({ _id: id }, { $set: { status: true } })

            }
        }
        res.redirect('/admin/coupon')
    } catch (error) {
        next(error)
    }
},

///user side
applyCoupon : async (req, res, next) => {
    try {
        const user = req.session.user
        const coupon = req.body.coupon.toUpperCase()

        const foundCoupon = await COUPON.findOne({ name: coupon })
        const cartData = await CART.findOne({ user: user._id })

        if (foundCoupon && foundCoupon.status) {
            if (cartData.totalPrice >= foundCoupon.purchaseLimit) {
                if (foundCoupon.expiryDate >= new Date()) {

                    const userExist = foundCoupon.usedUsers.find((data) => data == user._id)
                    if (!userExist) {

                        req.session.coupon = foundCoupon
                        // console.log(req.session.coupon);
                        const totalPrice = req.session.totalPrice
                        const couponDiscountTotal = totalPrice - foundCoupon.discount
                        let walletActive = false
                        let userData = await USER.findOne({ _id: req.session.user._id })
                        if (userData.wallet >= couponDiscountTotal) {
                            walletActive = true
                        }

                        res.json({ status: true, message: 'success', couponDiscount: foundCoupon.discount, couponDiscountTotal,walletActive })

                    } else {
                        res.json({ status: false, message: `Coupon Already Used` })
                    }
                } else {
                    res.json({ status: false, message: `Coupon Expired` })
                }
            } else {
                res.json({ status: false, message: `Minimum total price should be ${foundCoupon.purchaseLimit}` })
            }
        } else {
            res.json({ status: false, message: "Coupon doesn't exist" })
        }

    } catch (error) {
        next(error)
    }
},

removeCoupon : async (req, res, next) => {
    try {
        req.session.coupon = null
        res.json({ status: true })
    } catch (error) {
        next(error)
    }
}




}