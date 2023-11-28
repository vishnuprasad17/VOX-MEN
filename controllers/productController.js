const CATEGORY = require('../models/categoryModel');
const PRODUCTS = require('../models/productsModel')
const ORDER = require('../models/orderModel')
const OFFER = require('../models/offerModel')
const schedule = require('node-schedule');

module.exports = {
getProducts : async (req, res, next) => {
    try {
        const productData = await PRODUCTS.find({}).sort({ createdAt: -1 }).populate("category").populate('offer');
        const currentDate = new Date()
        const offerData = await OFFER.find({ $and: [{ status: true }, { expiryDate: { $gt: currentDate } }] })

        res.render('admin/products', { prods: productData, offerData,pageTitle:'Products' })
    } catch (error) {
        next(error)
    }
},


getAddProduct : async (req, res, next) => {
    try {
        const category = await CATEGORY.find({status:true})
        res.render('admin/addProduct', { category,pageTitle:'Add Product' })
    } catch (error) {
        next(error)
    }
},


postAddProduct : async (req, res, next) => {
    try {
        const {
            name, category,
            check1, check2, check3, check4, check5, check6,
            quantity, description, price, dPrice } = req.body

        let brand = req.body.brand.toUpperCase()
        let images = []
        for (let file of req.files) {
            images.push(file.filename)
        }

        let size = []
        if (check1) size.push(check1)
        if (check2) size.push(check2)
        if (check3) size.push(check3)
        if (check4) size.push(check4)
        if (check5) size.push(check5)
        if (check6) size.push(check6)

        const categoryID = await CATEGORY.findOne({ name: category })
        await new PRODUCTS({ brand, name, category: categoryID._id, size, quantity, description, price, dPrice, images, createdAt: new Date() }).save()

        res.redirect('/admin/products')

    } catch (error) {
        console.log(error.message)
    }
},


deleteProduct : async (req, res, next) => {
    try {
        const id = req.params.id

        const prodData = await PRODUCTS.findById({ _id: id })

        //updating category status
        if (prodData) {

            if (prodData.status === true) {
                await PRODUCTS.findByIdAndUpdate({ _id: id }, { $set: { status: false } })
            } else {
                await PRODUCTS.findByIdAndUpdate({ _id: id }, { $set: { status: true } })
            }
        }


        // 
        // await PRODUCTS.findByIdAndUpdate({ _id: id }, { $set: { status: false } })
        res.redirect('/admin/products')
    } catch (error) {
        next(error)
    }
},


getEditProduct : async (req, res, next) => {
    try {
        const id = req.params.id
        const prodData = await PRODUCTS.findById({ _id: id }).populate("category");
        const catData = await CATEGORY.find({status:true})
        res.render('admin/editProduct', { prod: prodData, catData,pageTitle:'Edit Product' })
        // res.render('admin/editProduct', { prod: prodData, catData })
    } catch (error) {
        next(error)
    }
},


postEditProduct : async (req, res, next) => {
    try {

        const {
            id, name, category,
            check1, check2, check3, check4, check5, check6,
            quantity, description, price, dPrice } = req.body
        let brand = req.body.brand.toUpperCase()

        // console.log(brand);
        let size = []
        if (check1) size.push(check1)
        if (check2) size.push(check2)
        if (check3) size.push(check3)
        if (check4) size.push(check4)
        if (check5) size.push(check5)
        if (check6) size.push(check6)

        if (req.files) {
            let newImages = []
            for (let file of req.files) {
                newImages.push(file.filename)
            }
            // console.log(id);
            await PRODUCTS.findOneAndUpdate({ _id: id }, { $push: { images: { $each: newImages } } })
        }

        const categoryID = await CATEGORY.findOne({ name: category })

        await PRODUCTS.findByIdAndUpdate({ _id: id }, { $set: { brand, name, category: categoryID._id, size, quantity, description, price, dPrice } })
        res.redirect('/admin/products')
    } catch (error) {
        next(error)
    }
},

imageDelete : async (req, res, next) => {
    try {
        const id = req.params.id
        const imageURL = req.query.imageURL

        await PRODUCTS.findOneAndUpdate({ _id: id }, { $pull: { images: imageURL } })
        res.redirect(`/admin/product/edit/${id}`)
    } catch (error) {
        next(error)
    }
},

getReview : async (req, res, next) => {
    try {
        const prodId = req.query.prodId
        const userId = req.session.user._id
        let productPurchased = 0

        const orderData = await ORDER.findOne({ user: userId, 'products.productId': prodId })
        if (orderData) productPurchased = 1

        res.render('user/review', { prodId, productPurchased, user: req.session.user ,pageTitle:'Reviews'})
    } catch (error) {
        next(error)
    }
},

postReview : async (req, res, next) => {
    try {
        const prodId = req.params.prodId
        const userId = req.session.user._id
        const { rating, title, description } = req.body

        await PRODUCTS.updateOne({ _id: prodId }, {
            $push: {
                reviews: {
                    userId, title, description, rating, createdAt: new Date()
                }
            }
        })
        const product = await PRODUCTS.findOne({ _id: prodId })
        const reviews = product.reviews
        const totalRating = reviews.reduce((sum, reviews) => sum += reviews.rating, 0)
        const averageRating = totalRating / reviews.length

        await PRODUCTS.updateOne({ _id: prodId }, { $set: { totalRating: averageRating } })
        res.redirect(`/product?id=${prodId}`)
    } catch (error) {
        next(error)
    }
},

getEditReview : async (req, res, next) => {
    try {
        const prodId = req.query.prodId
        const userId = req.session.user._id
        const productData = await PRODUCTS.findOne({ _id: prodId, reviews: { $elemMatch: { userId } } }).populate('reviews.userId')
        const reviewData = productData.reviews.find((data) => data.userId._id == userId)
        //    console.log(reviewData);
        res.render('user/reviewEdit', { reviewData, prodId,pageTitle:'Edit Review' })
    } catch (error) {
        next(error)
    }
},

postEditReview : async (req, res, next) => {
    try {
        const prodId = req.params.prodId

        const reviewId = req.query.reviewId
        const { rating, title, description } = req.body
        await PRODUCTS.updateOne({ _id: prodId, 'reviews._id': reviewId }, {
            $set: {
                'reviews.$.rating': rating,
                'reviews.$.title': title,
                'reviews.$.description': description
            }
        })

        //updating total rating
        const product = await PRODUCTS.findOne({ _id: prodId })
        const reviews = product.reviews
        const totalRating = reviews.reduce((sum, reviews) => sum += reviews.rating, 0)
        let averageRating = totalRating / reviews.length
        // averageRating.toFixed(2)
        averageRating = Math.round(averageRating * 10) / 10

        await PRODUCTS.updateOne({ _id: prodId }, { $set: { totalRating: averageRating } })


        res.redirect(`/product?id=${prodId}`)
    } catch (error) {
        next(error)
    }
},

allReviews : async (req, res, next) => {
    try {
        const prodId = req.query.prodId
        const prod = await PRODUCTS.findOne({ _id: prodId })
        res.render('user/reviewFull', { prod, user: req.session.user,pageTitle:'All Reviews' })
    } catch (error) {
        next(error)
    }
},

applyOffer : async (req, res, next) => {
    try {
        const { offerId, productId } = req.body
        const product = await PRODUCTS.findOne({ _id: productId })
        const offerData = await OFFER.findOne({ _id: offerId })
        const price = product.price

        if (product.offer && product.offerAppliedBy == 'category') {
            const oldOfferPrice = product.offerPrice
            
            const offerPrice = Math.round(price - ((price * offerData.discount) / 100))
            await PRODUCTS.updateOne({ _id: productId }, {
                $set: {
                    offer: offerId,
                    dPrice: offerPrice,
                    offerAppliedBy: 'product'
                }
            })
        } else {
            const offerPrice = Math.round(price - ((price * offerData.discount) / 100))
            const dPrice=product.dPrice
            await PRODUCTS.updateOne({ _id: productId }, {
                $set: {
                    offerPrice: dPrice,
                    offer: offerId,
                    dPrice: offerPrice,
                    offerAppliedBy: 'product'
                }
            })
        }

        // scheduling
        const expiry = offerData.expiryDate
        schedule.scheduleJob(expiry, async () => {
            const productData = await PRODUCTS.findOne({ _id: productId, offerAppliedBy: 'product' })
            let newPrice = productData.offerPrice
            await PRODUCTS.updateOne({ _id: productId, offerAppliedBy: 'product' }, {
                $set: {
                    dPrice: newPrice
                }
            })
            await PRODUCTS.updateOne({ _id: productId, offerAppliedBy: 'product' }, {
                $unset: { offer: "", offerPrice: "", offerAppliedBy: "" }
            })
        })

        res.redirect('/admin/products')
    } catch (error) {
        next(error)
    }
},

removeOffer : async (req, res, next) => {
    try {
        const prodId = req.params.id
        const productData = await PRODUCTS.findOne({ _id: prodId, offerAppliedBy: 'product' })
        let newPrice = productData.offerPrice
        await PRODUCTS.updateOne({ _id: prodId, offerAppliedBy: 'product' }, {
            $set: {
                dPrice: newPrice
            }
        })
        await PRODUCTS.updateOne({ _id: prodId, offerAppliedBy: 'product' }, {
            $unset: { offer: "", offerPrice: "", offerAppliedBy: "" }
        })
        res.redirect('/admin/products')
    } catch (error) {
        next(error)
    }
}



}