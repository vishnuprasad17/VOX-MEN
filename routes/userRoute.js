const express = require('express');

const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const addressController = require('../controllers/addressController')
const orderController = require('../controllers/orderController')
const couponController = require('../controllers/couponController')
const productController = require('../controllers/productController')
const isUser = require('../middleware/userAuth')

const router = express.Router()


//cartCount
router.use(async (req, res, next) => {
    res.locals.cartCount = req.session.cartCount
    next()
})


//home
router.get('/', userController.getHome)

//login
router.get('/login', isUser.loggedOut, userController.getLogin)
router.post('/login', userController.postLogin)

//signup
router.get('/signup', isUser.loggedOut, userController.getSignup)
router.post('/signup', userController.postSignup)

//otp
router.get('/OTPLogin', isUser.loggedOut, userController.OTPLogin)
router.post('/OTPLogin', userController.postOTPlogin)

//logout
router.post('/logout', userController.logout)

//forgotPassword
router.get('/forgotPassword', userController.getForgotPassword)
router.post('/forgotPassword', userController.postForgotPassword)

router.post('/forgotPasswordOTP', userController.forgotPasswordOTP)
router.post('/forgotPasswordChange', userController.forgotPasswordChange)

//shop
router.get('/shop', userController.getShop)

//single product
router.get('/product/', userController.product)

//cart
router.get('/cart', isUser.loggedIn, cartController.getCart)
router.post('/cart/:id', isUser.loggedIn, cartController.addToCart)

router.put('/updateCart', cartController.updateCart)
router.post('/deleteCart/:id', cartController.deleteCart)

//profile
router.get('/profile', isUser.loggedIn, userController.profile)
router.get('/edit-profile', isUser.loggedIn, userController.getEditProfile)
router.post('/edit-profile', isUser.loggedIn, userController.postEditProfile)

//change password
router.get('/change-password', isUser.loggedIn, userController.getChangePassword)
router.post('/change-password', isUser.loggedIn, userController.postChangePassword)

//manage address
router.get('/manage-address', isUser.loggedIn, addressController.manageAddress)
router.get('/add-address', isUser.loggedIn, addressController.getAddAddress)
router.post('/add-address/:addressLocation', addressController.postAddAddress)
router.get('/edit-address', isUser.loggedIn, addressController.getEditAddress)
router.post('/edit-address/:id', isUser.loggedIn, addressController.postEditAddress)
router.post('/delete-address/:id', isUser.loggedIn, addressController.deleteAddress)

//place order
router.get('/placeOrder', isUser.loggedIn, orderController.getPlaceOrder)
router.post('/placeOrder', isUser.loggedIn, orderController.postPlaceOrder)

//orders
router.get('/orders', isUser.loggedIn, orderController.getOrders)
router.get('/orderDetails', isUser.loggedIn, orderController.orderDetails)
router.post('/cancelOrder/:id', isUser.loggedIn, orderController.cancelOrder)
router.get('/orderSuccess', isUser.loggedIn, orderController.orderSuccess)

//online payment
router.post('/verifyPayment', orderController.verifyPayment)

//coupon
router.post('/applyCoupon', isUser.loggedIn, couponController.applyCoupon)
router.get('/removeCoupon', isUser.loggedIn, couponController.removeCoupon)

//order return
router.post('/returnOrder', isUser.loggedIn, orderController.returnOrder)

//about
router.get('/about', userController.about)

//invoice
router.get('/invoice', isUser.loggedIn, orderController.invoice)

//wishList
router.get('/wishList', isUser.loggedIn, userController.getWishList)
router.post('/wishList/:id', isUser.loggedIn, userController.postWishList)

//rating
router.get('/reviewProduct', isUser.loggedIn, productController.getReview)
router.post('/reviewProduct/:prodId', isUser.loggedIn, productController.postReview)
router.get('/editReviewProduct', isUser.loggedIn, productController.getEditReview)
router.post('/editReviewProduct/:prodId', isUser.loggedIn, productController.postEditReview)

//reviews
router.get('/allReviews', productController.allReviews)

//wallet History
router.get('/walletHistory', isUser.loggedIn, userController.walletHistory)

//contact
router.get('/contact',userController.getContact)
router.post('/contact',userController.postContact)


module.exports = router