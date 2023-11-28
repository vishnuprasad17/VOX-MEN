const User = require("../models/userModel");
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv').config()
const PRODUCTS = require('../models/productsModel')
const ADDRESS = require('../models/addressModel')
const CATEGORY = require('../models/categoryModel')
const CART = require('../models/cartModel');
const BANNER = require('../models/bannerModel')
const referralCode = require('../utils/referral')

module.exports = {
getSignup : async (req, res, next) => {
    try {
        var emailExistMessage = req.app.locals.specialContext;
        req.app.locals.specialContext = null;

        req.session.referral = ''
        if (req.query.referral) {
            req.session.referral = req.query.referral
            console.log(await referralCode());
        }


        res.render('user/signup', { emailExistMessage, pageTitle: 'Signup' })
    } catch (error) {
        next(error)
    }
},


postSignup : async (req, res, next) => {
    try {
        const { fname, lname, mobile, email, password, cPassword } = req.body

        //checking if user exists
        const userExists = await User.findOne({ email }).select('email');
        if (userExists) {
            req.app.locals.specialContext = 'Email already exists'
            return res.redirect('/signup')
        }
        //
        // otp verification
        let generateOTP = () => Math.floor(Math.random() * 1000000)
        req.session.otp = generateOTP()
        console.log(req.session.otp);
        let mailTransporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.USER_MAIL,
                pass: process.env.PASS
            }
        })

        let details = {
            from: process.env.USER_MAIL,
            to: email,
            subject: "VOX login OTP",
            text: req.session.otp + " is your VOX user verification code. Do not share OTP with anyone "
        }
        const sPassword = await bcrypt.hash(password, 10)
        mailTransporter.sendMail(details, (err) => {
            if (err) {
                req.app.locals.specialContext = `unexpected error please try again ${err}`
                return res.redirect('/signup')
            } else {
                console.log("OTP Send Successfully ");
                // console.log(mobile);
                res.render('user/otpPage', { fname, lname, mobile, email, password: sPassword, pageTitle: 'OTP' })
            }
        })

        //inserting data to db


    } catch (error) {
        next(error)
    }

},


//otp login
OTPLogin : async (req, res, next) => {
    try {
        res.render('user/otpPage', { pageTitle: 'OTP' })
    } catch (error) {
        next(error)
    }
},



postOTPlogin : async (req, res, next) => {
    try {
        const { fname, lname, mobile, email, password, otp } = req.body
        if (otp != req.session.otp) {
            const sPassword = await bcrypt.hash(password, 10)
            let message = 'Invalid OTP'
            return res.render('user/otpPage', { fname, lname, mobile, email, password: sPassword, message, pageTitle: 'OTP' })

        }

        //referral

        const referral = await referralCode()
        const user = new User({ fname, lname, mobile, email, password, date: new Date(), referralCode: referral, isReferred: false })
        const userData = user.save()

        if (userData) {
            if (req.session.referral != '') {
                // adding and validation user referred code
                const userReferredCode = req.session.referral
                const referredUserExist = await User.findOne({ referralCode: userReferredCode })

                if (referredUserExist) {
                    let referredUserWalletBalance = referredUserExist.wallet + 500
                    await User.updateOne({ referralCode: userReferredCode }, {
                        $inc: { wallet: 500 },
                        $push: {
                            walletHistory: {
                                transactionDate: new Date(),
                                transactionDetail: 'Referral bonus',
                                transactionType: 'Credit',
                                transactionAmount: 500,
                                currentBalance: referredUserWalletBalance
                            }
                        }
                    })
                    await User.updateOne({ email }, {
                        $inc: { wallet: 500 },
                        $push: {
                            walletHistory: {
                                transactionDate: new Date(),
                                transactionDetail: 'Referral bonus',
                                transactionType: 'Credit',
                                transactionAmount: 500,
                                currentBalance: 500
                            }
                        }
                    })
                }
            }
            res.redirect('/login')
        } else {
            const message = 'error'
            res.render('user/signup', { message, pageTitle: 'Signup' })
        }
    } catch (error) {
        next(error)
    }
},


getLogin : (req, res, next) => {
    try {
        var passwordNotMatch = req.app.locals.specialContext;
        req.app.locals.specialContext = null;

        res.render('user/login', { passwordNotMatch, pageTitle: 'Login' })
    } catch (error) {
        next(error)
    }
},


postLogin : async (req, res, next) => {
    try {
        const { email, password } = req.body

        //checking user is in db
        const userData = await User.findOne({ email })
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)
            if (passwordMatch && userData.status === false) {
                req.app.locals.specialContext = 'You have been blocked by the admin'
                res.redirect('/login')

            }
            else if (passwordMatch && userData.status === true) {
                //cartCount
                req.session.cartCount = 0
                let cartData = await CART.findOne({ user: userData._id })
                if (cartData && cartData.products) {
                    req.session.cartCount = cartData.products.length
                }
                //
                req.session.user = userData
                res.redirect('/')
            } else {
                req.app.locals.specialContext = 'Incorrect Password'
                res.redirect('/login')
            }

        } else {
            req.app.locals.specialContext = 'Invalid Credentials'
            res.redirect('/login')
        }
    } catch (error) {
        next(error)
    }
},


getHome : async (req, res, next) => {
    try {
        const user = req.session.user
        const category = await CATEGORY.find({ status: true })
        // console.log(category);
        const products = await PRODUCTS.find({ status: true }).sort({ createdAt: -1 })
        const banner = await BANNER.find({})

        res.render('user/home', { user, category, products, banner, pageTitle: 'Home' })
    } catch (error) {
        next(error)
    }
},


getShop : async (req, res, next) => {
    try {
        let page = 1
        if (req.query.page) {
            page = req.query.page
        }
        let limit = 8

        let sortValue = -1
        if (req.query.sortValue) {
            if (req.query.sortValue == 2) {
                sortValue = 1
            } else if (req.query.sortValue == 3) {
                sortValue = -1
            } else {
                sortValue = -1
            }
        }

        //price
        let minPrice = 1
        let maxPrice = Number.MAX_VALUE
        if (req.query.minPrice) {
            minPrice = req.query.minPrice
        }
        if (req.query.maxPrice) {
            maxPrice = req.query.maxPrice
        }

        //search step 1
        let search = ''
        if (req.query.search) {
            search = req.query.search
        }

        //search step 2
        //finding category data in order for searching
        async function getCategoryIds(search) {
            const categories = await CATEGORY.find({ name: { $regex: '.*' + search + '.*', $options: 'i' } });
            return categories.map(category => category._id);
        }


        //query for sort and all the stuff
        const query = {
            status: true,
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { brand: { $regex: '.*' + search + '.*', $options: 'i' } }

            ],
            dPrice: { $gte: minPrice, $lte: maxPrice }
        }

        //search step 3
        if (req.query.search) {
            search = req.query.search
            query.$or.push({
                'category': { $in: await getCategoryIds(search) }
            });
        }


        //category
        // let category = req.query.category
        if (req.query.category) {
            query.category = req.query.category
        }

        //brand
        // let brand = req.query.brand
        if (req.query.brand) {
            query.brand = req.query.brand
        }


        let prods = await PRODUCTS.find(query).populate("category").sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit)

        if (req.query.sortValue && req.query.sortValue != 3) {
            prods = await PRODUCTS.find(query).populate("category").sort({ dPrice: sortValue }).limit(limit * 1).skip((page - 1) * limit)
        } else {
            prods = await PRODUCTS.find(query).populate("category").sort({ createdAt: sortValue }).limit(limit * 1).skip((page - 1) * limit)
        }


        //provide to user
        const categoryNames = await CATEGORY.find({ status: true })
        const brands = await PRODUCTS.aggregate([{ $match: { status: true } }, { $group: { _id: "$brand" } }])

        let totalProductsCount = await PRODUCTS.find(query).count()
        // if(prods.length<8) totalProductsCount=totalProductsCount-prods.length
        let pageCount = Math.ceil(totalProductsCount / limit)

        let removeFilter = false
        if (req.query.brand || req.query.category || req.query.sortValue || req.query.minPrice || req.query.search) {
            removeFilter = true
        }


        res.render('user/shop', {
            prods, user: req.session.user, categoryNames, brands,
            pageCount,
            currentPage: page,
            sortValue: req.query.sortValue,
            minPrice: req.query.minPrice,
            maxPrice: req.query.maxPrice,
            category: req.query.category,
            brand: req.query.brand,
            removeFilter,
            search: req.query.search, pageTitle: 'Shop'
        })

    } catch (error) {
        next(error)
    }
},



product : async (req, res, next) => {
    try {
        const id = req.query.id

        let wishListExist = 0
        if (req.session.user) {
            let userData = await User.findOne({ _id: req.session.user._id })

            // console.log(userData);
            const prodExist = userData.wishList.find((data) => data == id)
            if (prodExist) {
                wishListExist = 1
                // console.log('yes');
            } else {
                // console.log('no');
            }
        }
        const prod = await PRODUCTS.findOne({ _id: id }).populate('reviews.userId')

        let userReviewed = 0
        if (req.session.user) {
            const userId = req.session.user._id
            const reviewData = await PRODUCTS.findOne({ _id: id, 'reviews.userId': userId })
            if (reviewData) userReviewed = 1
        }

        let cartProdExist = false
        if (req.session.user) {
            let userId = req.session.user._id
            let userCart = await CART.findOne({ user: userId })
            if (userCart) {
                userCart.products.forEach((prod) => {
                    if (prod.productId == id) {
                        cartProdExist = true
                    }
                })
            }
        }
        if (prod) {
            res.render('user/product', { prod, user: req.session.user, wishListExist, userReviewed, pageTitle: 'Product', cartProdExist })
        } else {
            res.render('404')
        }
    } catch (error) {
        next(error)
    }
},



logout : async (req, res, next) => {
    try {
        req.session.destroy()
        res.redirect('/login')
    } catch (error) {
        next(error)
    }
},


profile : async (req, res, next) => {
    try {
        const user = req.session.user
        const userData = await User.findOne({ _id: user._id })

        const userAddress = await ADDRESS.findOne({ user: user._id })
        // console.log(address);
        res.render('user/profile', { userData, user, userAddress, pageTitle: 'Profile' })
    } catch (error) {
        next(error)
    }
},


getEditProfile : async (req, res, next) => {
    try {
        const user = req.session.user
        const userData = await User.findOne({ _id: user._id })
        res.render('user/profileEdit', { user, userData, pageTitle: 'Edit Profile' })
    } catch (error) {
        next(error)
    }
},


postEditProfile : async (req, res, next) => {
    try {
        const user = req.session.user
        const { fname, lname, mobile } = req.body
        await User.findByIdAndUpdate({ _id: user._id }, { $set: { fname, lname, mobile } })
        res.redirect('/profile')
    } catch (error) {
        next(error)
    }
},


getChangePassword : async (req, res, next) => {
    try {
        const user = req.session.user
        var incorrectPassword = req.app.locals.specialContext;
        req.app.locals.specialContext = null;
        res.render('user/changePassword', { user, incorrectPassword, pageTitle: 'Change Password' })
    } catch (error) {
        next(error)
    }
},


postChangePassword : async (req, res, next) => {
    try {
        const user = req.session.user
        const { oldPassword, newPassword, cNewPassword } = req.body

        const userData = await User.findOne({ _id: user._id })
        const passwordMatch = await bcrypt.compare(oldPassword, userData.password)
        if (passwordMatch) {
            // if (newPassword != cNewPassword) {
            //     req.app.locals.specialContext = "passwords doesn't match"
            //     res.redirect('/change-password')
            // } else {
            const sPassword = await bcrypt.hash(newPassword, 10)
            await User.findByIdAndUpdate({ _id: user._id }, { $set: { password: sPassword } })
            // }
            res.redirect('/profile')
        } else {
            req.app.locals.specialContext = 'old password is incorrect'
            res.redirect('/change-password')
        }
    } catch (error) {
        next(error)
    }
},

getForgotPassword : async (req, res, next) => {
    try {
        let emailNotRegistered = req.app.locals.emailNotRegistered
        req.app.locals.emailNotRegistered = null
        res.render('user/forgotPassword', { emailNotRegistered, pageTitle: 'Forgot Password' })
    } catch (error) {
        next(error)
    }
},

//forgotPassword function

postForgotPassword : async (req, res, next) => {
    try {
        const email = req.body.email
        const emailRegistered = await User.findOne({ email })
        if (emailRegistered) {
            req.session.forgotPasswordEmail = email

            let generateOTP = () => Math.floor(Math.random() * 1000000)
            req.session.forgotPasswordOTP = generateOTP()
            let mailTransporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                requireTLS: true,
                auth: {
                    user: process.env.USER_MAIL,
                    pass: process.env.PASS
                }
            })

            let details = {
                from: process.env.USER_MAIL,
                to: email,
                subject: "Password reset OTP",
                text: req.session.forgotPasswordOTP + " is your VOX reset password OTP. Do not share OTP with anyone "
            }
            mailTransporter.sendMail(details, (err) => {
                if (err) {
                    req.app.locals.emailNotRegistered = 'Unexpected error please try again'
                    return res.redirect('/forgotPassword')
                } else {
                    console.log("OTP Send Successfully ");
                    console.log(req.session.forgotPasswordOTP);
                    var otpMatch = ''
                    res.render('user/forgotPasswordOTP', { otpMatch, pageTitle: 'Forgot Password' })
                }
            })

        } else {
            req.app.locals.emailNotRegistered = 'This email is not registered'
            res.redirect('/forgotPassword')
        }
    } catch (error) {
        next(error)
    }
},


forgotPasswordOTP : async (req, res, next) => {
    try {
        let forgotOTP = req.body.otp
        if (forgotOTP == req.session.forgotPasswordOTP) {
            res.render('user/forgotPasswordChange', { pageTitle: 'Forgot Password' })
        } else {
            var otpMatch = 'Enter valid otp'
            res.render('user/forgotPasswordOTP', { otpMatch, pageTitle: 'Forgot Password' })
        }

    } catch (error) {
        next(error)
    }
},

forgotPasswordChange : async (req, res, next) => {
    try {
        let password = req.body.newPassword
        const sPassword = await bcrypt.hash(password, 10)
        let email = req.session.forgotPasswordEmail
        await User.updateOne({ email }, { $set: { password: sPassword } })
        res.redirect('/login')

    } catch (error) {
        next(error)
    }
},

about : async (req, res, next) => {
    try {
        res.render('user/about', { pageTitle: 'About',user:req.session.user })
    } catch (error) {
        next(error)
    }
},

getWishList : async (req, res, next) => {
    try {
        const userId = req.session.user._id
        const userData = await User.findOne({ _id: userId }).populate('wishList')
        // console.log(userData);
        res.render('user/wishList', { wishList: userData.wishList, user: req.session.user, pageTitle: 'Wishlist' })
    } catch (error) {
        next(error)
    }
},

postWishList : async (req, res, next) => {
    try {
        const id = req.session.user._id
        const productId = req.params.id
        const userData = await User.findOne({ _id: id })
        const prodExist = userData.wishList.find((data) => data == productId)
        if (prodExist) {
            await User.findOneAndUpdate({ _id: id }, { $pull: { wishList: productId } })
        } else {
            await User.findOneAndUpdate({ _id: id }, { $push: { wishList: productId } })
        }
        if (req.query.location) {
            res.redirect('/wishList')
        } else {
            res.redirect(`/product?id=${productId}`)
        }
    } catch (error) {
        next(error)
    }
},

walletHistory : async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.user._id })
        res.render('user/walletHistory', { userData, user: req.session.user, pageTitle: 'Wallet History' })
    } catch (error) {
        next(error)
    }
},

getContact : async (req, res, next) => {
    try {
        res.render('user/contact', { user: req.session.user })
    } catch (error) {
        next(error)
    }
},

postContact : async (req, res, next) => {
    try {
        const { name, email, subject, message } = req.body

        let mailTransporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.USER_MAIL,
                pass: process.env.PASS
            }
        })
        let details = {
            from: process.env.USER_MAIL,
            to: process.env.MY_MAIL,
            subject: subject,
            text: 'Name: ' + name + '\nMessage: ' + message + '\nemail: ' + email
        }
        mailTransporter.sendMail(details, (err) => {
            if (err) {
               res.json({ status: false })
            } else {
             res.json({ status: true })
            }
        })
    } catch (error) {
        next(error)
    }
}


}