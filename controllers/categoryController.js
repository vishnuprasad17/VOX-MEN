const CATEGORY = require('../models/categoryModel')
const OFFER = require('../models/offerModel')
const PRODUCTS = require('../models/productsModel')

const schedule = require('node-schedule');

module.exports = {

getCategory : async (req, res, next) => {
    try {
        const categoryData = await CATEGORY.find({}).populate('offer')
        var message = req.app.locals.specialContext;
        req.app.locals.specialContext = null;

        const currentDate = new Date()
        const offerData = await OFFER.find({ $and: [{ status: true }, { expiryDate: { $gt: currentDate } }] })

        res.render('admin/category', { categoryData, message, offerData, pageTitle: 'Category' })

    } catch (error) {
        next(error)
    }
},


addCategory : async (req, res, next) => {
    try {
        const name = req.body.name.toUpperCase()
        const categoryData = await CATEGORY.find({})

        const image = req.file.filename
        console.log(image);

        const existingName = await CATEGORY.findOne({ name })
        if (existingName) {
            req.app.locals.specialContext = 'Name already exists'
            // return res.render('admin/category', { message, categoryData })
            return res.redirect('/admin/category')

        }
        const category = new CATEGORY({ name, image })
        const catData = await category.save()
        if (catData) res.redirect('/admin/category')
    } catch (error) {
        next(error)
    }
},


changeStatus : async (req, res, next) => {
    try {
        const categoryId = req.params.id
        const categoryData = await CATEGORY.findById({ _id: categoryId })

        //updating category status
        if (categoryData) {

            if (categoryData.status === true) {
                await CATEGORY.findByIdAndUpdate({ _id: categoryId }, { $set: { status: false } })
            } else {
                await CATEGORY.findByIdAndUpdate({ _id: categoryId }, { $set: { status: true } })
            }
        }
        res.redirect('/admin/category')
    } catch (error) {
        next(error)
    }
},


editCategory : async (req, res, next) => {
    try {
        let name = req.body.newName
        name = name.toUpperCase()
        const id = req.body.catID


        const categoryData = await CATEGORY.find({})

        const existingName = await CATEGORY.findOne({ name })

        if (existingName && existingName._id != id) {
            req.app.locals.specialContext = 'Name already exists'
            return res.redirect('/admin/category')
        }

        // let offer = null
        // if (req.body.offer) offer = req.body.offer
        if (req.file) {
            let image = req.file.filename

            await CATEGORY.findByIdAndUpdate({ _id: id }, { $set: { name, image } })
            // await CATEGORY.findByIdAndUpdate({ _id: id }, { $set: { name, image, offer } })
            return res.redirect('/admin/category')
        }
        await CATEGORY.findByIdAndUpdate({ _id: id }, { $set: { name } })
        // await CATEGORY.findByIdAndUpdate({ _id: id }, { $set: { name, offer } })



        res.redirect('/admin/category')
    } catch (error) {
        next(error)
    }
},



deleteCategory : async (req, res, next) => {
    try {
        const id = req.params.id
        // console.log(id);
        await CATEGORY.deleteOne({ _id: id })
        res.redirect('/admin/category')
    } catch (error) {
        next(error)
    }
},


getSize : async (req, res, next) => {
    try {
        const id = req.params.id
        const sizeChart = await CATEGORY.findById({ _id: id }, { size: 1 })
        res.render('admin/size', { sizeChart, id })
    } catch (error) {
        next(error)
    }
},


addSize : async (req, res, next) => {
    try {
        const { id, size } = req.body

        await CATEGORY.findOneAndUpdate({ _id: id }, { $addToSet: { size } })
        res.redirect(`/admin/category`)
    } catch (error) {
        next(error)
    }
},


deleteSize : async (req, res, next) => {
    try {
        const id = req.params.id
        const sizeVal = req.query.sizeValue
        await CATEGORY.findOneAndUpdate({ _id: id }, { $pull: { size: sizeVal } })
        res.redirect(`/admin/category`)
    } catch (error) {
        next(error)
    }
},


editSize : async (req, res, next) => {
    try {
        const id = req.body.sID
        const oldSize = req.body.sVal
        const newSize = req.body.newName

        const sizeExist = await CATEGORY.findOne({ _id: id, size: newSize })
        if (sizeExist) {
            const categoryData = await CATEGORY.find({})
            let message = 'Size already exists'
            return res.render('admin/category', { message, categoryData })
        }

        await CATEGORY.findOneAndUpdate({ _id: id, size: oldSize }, { $set: { 'size.$': newSize } })
        res.redirect('/admin/category')
    } catch (error) {
        next(error)
    }
},


applyOffer : async (req, res, next) => {
    try {
        const { offerId, categoryId } = req.body
        await CATEGORY.updateOne({ _id: categoryId }, {
            $set: {
                offer: offerId
            }
        })

        const offerData = await OFFER.findOne({ _id: offerId })
        const updatingProducts = await PRODUCTS.find({ category: categoryId })
        for (const product of updatingProducts) {
            const price = product.price
            const dPrice = product.dPrice
            const offerPrice = Math.round(price - ((price * offerData.discount) / 100))
            await PRODUCTS.updateOne({ _id: product._id, offer: { $exists: false } },
                {
                    $set: {
                        offerPrice: dPrice,
                        offer: offerId,
                        dPrice: offerPrice,
                        offerAppliedBy: 'category'
                    }
                }
            )
        }


        // const categoryData = CATEGORY.findOne({ _id: categoryId })
        const expiry = offerData.expiryDate

        schedule.scheduleJob(expiry, async () => {
            await CATEGORY.updateOne({ _id: categoryId }, {
                $unset: {
                    offer: ''
                }
            })
            await PRODUCTS.updateMany({ category: categoryId, offerAppliedBy: 'category' },
                [{
                    $set: {
                        dPrice: '$offerPrice'
                    }
                }
                ]

            )
            await PRODUCTS.updateMany(
                { category: categoryId, offerAppliedBy: 'category' },
                {
                    $unset: { offer: "", offerPrice: "", offerAppliedBy: "" }
                }
            );
        })

        res.redirect('/admin/category')
    } catch (error) {
        next(error)
    }
},



removeOffer : async (req, res, next) => {
    try {
        let categoryId = req.params.id
        await CATEGORY.updateOne({ _id: categoryId }, {
            $unset: {
                offer: ''
            }
        })
        await PRODUCTS.updateMany({ category: categoryId, offerAppliedBy: 'category' },
            [{
                $set: {
                    dPrice: '$offerPrice'
                }
            }
            ]

        )
        await PRODUCTS.updateMany(
            { category: categoryId, offerAppliedBy: 'category' },
            {
                $unset: { offer: "", offerPrice: "", offerAppliedBy: "" }
            }
        );

        res.redirect('/admin/category')
    } catch (error) {
        next(error)
    }
}


}