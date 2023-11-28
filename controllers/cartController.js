const CART = require('../models/cartModel');
const PRODUCTS = require('../models/productsModel')
module.exports = {

getCart : async (req, res, next) => {
    try {
        let user = req.session.user
        let cartData = await CART.find({ user: user._id }).populate('products.productId')


        //setting variable from the prices 
        let totalPrice = 0, discountPrice = 0

        if (cartData.length > 0) {

            //extracting data from the cartData
            var [{ products }] = cartData
            let cartList = products.map(({ productId, size, quantity, cPrice, cDPrice }) => ({ productId, size, quantity, cPrice, cDPrice }))

            for (const { productId, quantity } of cartList) {
                await CART.updateOne({ user: user._id, 'products.productId': productId },
                    {
                        $set: { 'products.$.cPrice': quantity * productId.price, 'products.$.cDPrice': quantity * productId.dPrice }
                    })
            }

            cartData = await CART.find({ user: user._id }).populate('products.productId')
            var [{ products }] = cartData
            cartList = products.map(({ productId, size, quantity, cPrice, cDPrice }) => ({ productId, size, quantity, cPrice, cDPrice }))


            //finding the prices
            totalPrice = cartList.reduce((acc, curr) => acc += curr.cPrice, 0)
            discountPrice = cartList.reduce((acc, curr) => acc += curr.cDPrice, 0)

            //updating the total price in the cart
            await CART.updateOne({ user: user._id }, { $set: { totalPrice: discountPrice } })
        }

        res.render('user/cart', { cartData, user, totalPrice, discountPrice,pageTitle:'Cart' })
    } catch (error) {
        next(error)
    }
},

addToCart : async (req, res, next) => {
    try {
        let user = req.session.user
        let id = user._id
        // console.log(id);
        let prodId = req.params.id
        let size = req.body.size

        const product = await PRODUCTS.findById({ _id: prodId })
        const price = product.price
        const dPrice = product.dPrice

        let userExist = await CART.findOne({ user: id })
        if (userExist) {
            let prodExists = await CART.findOne({ user: id, products: { $elemMatch: { productId: prodId } } })


            if (prodExists) {
                res.redirect('/cart')
            } else {
                await CART.updateOne({ user: id }, {
                    $addToSet: {
                        products: {
                            productId: prodId,
                            size: size,
                            quantity: 1,
                            cPrice: price,
                            cDPrice: dPrice
                        }
                    }, $inc: { totalPrice: dPrice }
                })
                //cartCount
                let cartCount = await CART.findOne({ user: id })
                req.session.cartCount = cartCount.products.length
                //
                res.redirect('/cart')
            }
        } else {
            await new CART({
                user: id,
                products: [{
                    productId: prodId,
                    size: size,
                    quantity: 1,
                    cPrice: price,
                    cDPrice: dPrice
                }],
                totalPrice: dPrice

            }).save()
            //cartCount
            let cartCount = await CART.findOne({ user: id })
            req.session.cartCount = cartCount.products.length
            //
            res.redirect('/cart')
        }

    } catch (error) {
        next(error)
    }
},

updateCart : async (req, res, next) => {
    try {
        const user = req.session.user
        const quantity = parseInt(req.body.amt)
        const prodId = req.body.prodId
        // const size = req.body.size


        const product = await PRODUCTS.findOne({ _id: prodId })
        const stock = product.quantity
        const price = quantity * product.price
        const dPrice = quantity * product.dPrice

        if (stock >= quantity) {
            await CART.updateOne({ user: user._id, 'products.productId': prodId },
                {
                    $set: { 'products.$.quantity': quantity, 'products.$.cPrice': price, 'products.$.cDPrice': dPrice }
                })

            ///////////////

            let cartData = await CART.find({ user: user._id }).populate('products.productId')
            let [{ products }] = cartData

            let cartList = products.map(({ cPrice, cDPrice }) => ({ cPrice, cDPrice }))

            //finding the prices
            let totalPrice = cartList.reduce((acc, curr) => acc += curr.cPrice, 0)
            let discountPrice = cartList.reduce((acc, curr) => acc += curr.cDPrice, 0)

            //updating the total price in the cart
            await CART.updateOne({ user: user._id }, { $set: { totalPrice: discountPrice } })

            let totalDiscount = totalPrice - discountPrice
            let productPrice = product.dPrice
            ///////////////
            res.json({ status: true, data: { st: '', dPrice, totalPrice, discountPrice, totalDiscount, productPrice } })
        } else {
            res.json({ status: false, data: 'Sorry the product stock has been exceeded' })
        }

    } catch (error) {
        next(error)
    }
},

deleteCart : async (req, res, next) => {
    try {
        const user = req.session.user
        const prodId = req.params.id
        let removed = await CART.findOneAndUpdate({ user: user._id, 'products.productId': prodId },
            { $pull: { products: { productId: prodId } } })

        if (removed) {

            //cartCount
            let cartCount = await CART.findOne({ user: user._id })
            if (cartCount && cartCount.products) {
                req.session.cartCount = cartCount.products.length
            } else {
                req.session.cartCount = 0
            }
            //
            res.redirect('/cart')
        } else {
            res.send('not removed')
        }
    } catch (error) {
        next(error)
    }
}



}