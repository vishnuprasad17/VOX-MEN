const ADDRESS = require('../models/addressModel')
const CART = require('../models/cartModel');
const ORDER = require('../models/orderModel')
const PRODUCTS = require('../models/productsModel')
const COUPON = require('../models/couponModel')
const USER = require('../models/userModel')

const Razorpay = require('razorpay');

var instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env. RAZORPAY_KEY_SECRET,
});

module.exports = {
getPlaceOrder : async (req, res, next) => {
    try {
        const user = req.session.user
        req.session.coupon = null

        const userAddress = await ADDRESS.findOne({ user: user._id })
        const couponData = await COUPON.find({ status: true })

        let address = []

        if (userAddress) {
            address = userAddress.address
        }
        // console.log(address.length);

        let cart = await CART.findOne({ user: user._id }).populate('products.productId')
        if (!cart) {
            return res.redirect('/cart')
        }

        let totalPrice = 0, discountPrice = 0

        let cartList = cart.products.map(({ productId, size, quantity, cPrice, cDPrice }) => ({ productId, size, quantity, cPrice, cDPrice }))
        totalPrice = cartList.reduce((acc, curr) => acc += curr.cPrice, 0)
        discountPrice = cartList.reduce((acc, curr) => acc += curr.cDPrice, 0)

        req.session.totalPrice = discountPrice

        const userData = await USER.findOne({ _id: user._id })
        const walletBalance = userData.wallet

        res.render('user/placeOrder', { user, address, cart, totalPrice, discountPrice, couponData, walletBalance, pageTitle: 'Place Order' })

    } catch (error) {
        next(error)
    }
},


postPlaceOrder : async (req, res, next) => {
    try {
        const user = req.session.user
        const addressId = req.body.address
        const paymentType = req.body.payment
        const walletSelected = req.body.walletCheckBox


        //getting address
        const addressData = await ADDRESS.findOne({ user: user._id })
        const findAddress = addressData.address.find(obj => obj._id.toString() === addressId)
        const address = {
            name: findAddress.name,
            mobile: findAddress.mobile,
            pincode: findAddress.pincode,
            address: findAddress.address,
            town: findAddress.town,
            state: findAddress.state
        }
        req.session.deliveryAddress = address

        //getting products list
        const cartData = await CART.findOne({ user: user._id }).populate("products.productId");
        // const cartData = await CART.findOne({ user: user._id }).populate('products.productId')
        let productList = cartData.products.map(({ productId, size, quantity, cPrice, cDPrice }) => ({
            productId,
            productName: productId.name,
            productPrice: productId.price,
            productDiscountPrice: productId.dPrice,
            size,
            quantity,
            totalProductPrice: cPrice,
            totalProductDiscountPrice: cDPrice
        }))

        //total payment price
        let totalPrice = cartData.totalPrice
        let couponName = ''
        let couponDiscount = 0
        let minusCouponPrice = 0
        if (req.session.coupon != null) {
            couponName = req.session.coupon.name
            couponDiscount = req.session.coupon.discount
            minusCouponPrice = couponDiscount / productList.length
        }

        //method COD///////////////////////////////
        if (paymentType === 'COD') {

            productList.forEach(async (prod) => {
                await new ORDER({
                    user: user._id,
                    deliveryAddress: address,
                    products: prod,
                    totalPrice: prod.totalProductDiscountPrice - minusCouponPrice,
                    paymentMethod: paymentType,
                    status: 'Order Confirmed',
                    date: new Date(),
                    couponName,
                    couponDiscount: minusCouponPrice
                }).save()
            })


            for (const { productId, quantity } of productList) {
                await PRODUCTS.updateOne(
                    { _id: productId._id },
                    { $inc: { quantity: -quantity } }
                );
            }

            await CART.deleteOne({ user: user._id });
            if (req.session.coupon != null) {
                await COUPON.findByIdAndUpdate({ _id: req.session.coupon._id }, { $push: { usedUsers: user._id } })
            }
            req.session.cartCount = 0
            res.json({ status: 'COD' })


            // method WALLET//////////////////////////////

        } else if (paymentType === 'WALLET') {

            // await new ORDER({
            //     user: user._id,
            //     deliveryAddress: address,
            //     products: productList,
            //     totalPrice: totalPrice,
            //     paymentMethod: paymentType,
            //     status: 'Order Confirmed',
            //     date: new Date(),
            //     couponName,
            //     couponDiscount
            // }).save()

            productList.forEach(async (prod) => {
                await new ORDER({
                    user: user._id,
                    deliveryAddress: address,
                    products: prod,
                    totalPrice: prod.totalProductDiscountPrice - minusCouponPrice,
                    paymentMethod: paymentType,
                    status: 'Order Confirmed',
                    date: new Date(),
                    couponName,
                    couponDiscount: minusCouponPrice
                }).save()
            })


            for (const { productId, quantity } of productList) {
                await PRODUCTS.updateOne(
                    { _id: productId._id },
                    { $inc: { quantity: -quantity } }
                );
            }

            await CART.deleteOne({ user: user._id });
            if (req.session.coupon != null) {
                await COUPON.findByIdAndUpdate({ _id: req.session.coupon._id }, { $push: { usedUsers: user._id } })
            }
            req.session.cartCount = 0
            const userData = await USER.findOne({ _id: req.session.user._id })
            let walletBalanceTotal = userData.wallet - totalPrice

            await USER.findByIdAndUpdate({ _id: req.session.user._id }, {
                $inc: { wallet: -totalPrice },
                $push: {
                    walletHistory: {
                        transactionDate: new Date(),
                        transactionDetail: 'Product Purchase',
                        transactionType: 'Debit',
                        transactionAmount: totalPrice,
                        currentBalance: walletBalanceTotal
                    }
                }
            })

            res.json({ status: 'WALLET' })

        }
        // method ONLINE//////////////////////////////
        else if (paymentType === 'ONLINE') {

            if (walletSelected) {
                let userData = await USER.findOne({ _id: user._id })
                let walletBalance = parseInt(userData.wallet)
                totalPrice = totalPrice - walletBalance
                req.session.wallet = walletBalance
            }

            var options = {
                amount: totalPrice * 100,
                currency: "INR",
                receipt: " "
            }
            instance.orders.create(options, (err, order) => {
                if (err) {
                    console.log(err);
                } else {
                    res.json({ status: 'ONLINE', order: order })
                }
            })
        }
    } catch (error) {
        next(error)
    }
},


//online verify payment
verifyPayment : async (req, res, next) => {
    try {

        const details = req.body

        const crypto = require('crypto');
        let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);

        hmac.update(
            details['payment[razorpay_order_id]']
            + '|' +
            details['payment[razorpay_payment_id]']
        )
        hmac = hmac.digest('hex')

        if (hmac == details['payment[razorpay_signature]']) {
            const user = req.session.user

            //getting products list
            const cartData = await CART.findOne({ user: user._id }).populate("products.productId");
            // const cartData = await CART.findOne({ user: user._id }).populate('products.productId')
            let productList = cartData.products.map(({ productId, size, quantity, cPrice, cDPrice }) => ({
                productId,
                productName: productId.name,
                productPrice: productId.price,
                productDiscountPrice: productId.dPrice,
                size,
                quantity,
                totalProductPrice: cPrice,
                totalProductDiscountPrice: cDPrice
            }))

            //total payment price
            let totalPrice = cartData.totalPrice
            let couponName = ''
            let couponDiscount = 0
            let minusCouponPrice = 0
            let walletMinus = 0
            if (req.session.coupon != null) {
                couponName = req.session.coupon.name
                couponDiscount = req.session.coupon.discount
                minusCouponPrice = couponDiscount / productList.length

            }
            if (req.session.wallet) {
                walletMinus = req.session.wallet / productList.length
            }
            const paymentType = 'ONLINE'


            productList.forEach(async (prod) => {
                await new ORDER({
                    user: user._id,
                    deliveryAddress: req.session.deliveryAddress,
                    products: prod,
                    totalPrice: prod.totalProductDiscountPrice - minusCouponPrice,
                    paymentMethod: paymentType,
                    status: 'Order Confirmed',
                    date: new Date(),
                    couponName,
                    couponDiscount: minusCouponPrice
                }).save()
            })


            for (const { productId, quantity } of productList) {
                await PRODUCTS.updateOne(
                    { _id: productId._id },
                    { $inc: { quantity: -quantity } }
                );
            }

            await CART.deleteOne({ user: user._id });
            if (req.session.coupon != null) {
                await COUPON.findByIdAndUpdate({ _id: req.session.coupon._id }, { $push: { usedUsers: user._id } })
            }
            req.session.cartCount = 0

            if (req.session.wallet) {
                const userData = await USER.findOne({ _id: req.session.user._id })
                let totalWalletBalance = userData.wallet - req.session.wallet
                await USER.findByIdAndUpdate({ _id: req.session.user._id }, {
                    $inc: { wallet: -req.session.wallet },
                    $push: {
                        walletHistory: {
                            transactionDate: new Date(),
                            transactionDetail: 'Product Purchase',
                            transactionType: 'Debit',
                            transactionAmount: req.session.wallet,
                            currentBalance: totalWalletBalance
                        }
                    }
                })
                req.session.wallet = null
            }
            res.json({ paymentSuccess: true })
        }

    } catch (error) {
        next(error)
    }
},



getOrders : async (req, res, next) => {
    try {
        let page = 1
        if (req.query.page) {
            page = req.query.page
        }
        let limit = 6

        const user = req.session.user
        const orders = await ORDER.find({ user: user._id }).populate('products.productId').sort({ date: -1 }).limit(limit * 1).skip((page - 1) * limit)
        let totalOrdersCount = await ORDER.find({ user: user._id }).count()
        let pageCount = Math.ceil(totalOrdersCount / limit)

        res.render('user/orders', { user, orders, pageTitle: 'Orders', pageCount, currentPage: page })
    } catch (error) {
        next(error)
    }
},


orderDetails : async (req, res, next) => {
    try {
        const user = req.session.user
        const orderId = req.query.details

        const orders = await ORDER.find({ user: user._id }).populate('products.productId')
        // const orderDetails = orders.find(data => data._id.toString() === orderId)
        const orderDetails = await ORDER.findOne({ _id: orderId }).populate('products.productId')

        let status = 0
        if (orderDetails.status.toString() === 'Order Confirmed') {
            status = 1
        } else if (orderDetails.status.toString() === 'Shipped') {
            status = 2
        } else if (orderDetails.status.toString() === 'Out for delivery') {
            status = 3
        } else if (orderDetails.status.toString() === 'Delivered') {
            status = 4
        }
        else if (orderDetails.status.toString() === 'Canceled') {
            status = 5
        } else if (orderDetails.status.toString() === 'Canceled by admin') {
            status = 6
        } else if (orderDetails.status.toString() === 'Pending Return Approval') {
            status = 7
        } else if (orderDetails.status.toString() === 'Returned') {
            status = 8
        }

        let allowReturn = true
        let orderedDate = orderDetails.date
        let returnLastDate = new Date(orderedDate.getTime() + 14 * 24 * 60 * 60 * 1000);


        if (new Date() > returnLastDate) {
            allowReturn = false
        }

        res.render('user/orderDetails', { user, orderDetails, status, pageTitle: 'Order Details', allowReturn })
    } catch (error) {
        next(error)
    }
},


getOrdersAdmin : async (req, res, next) => {
    try {
        const orders = await ORDER.find({}).populate('products.productId').populate('user').sort({ date: -1 })

        res.render('admin/ordersDetails', { orders, pageTitle: 'Orders' })
    } catch (error) {
        next(error)
    }
},

orderStatus : async (req, res, next) => {
    try {
        const orderId = req.body.orderId
        const status = req.body.status
        await ORDER.updateOne({ _id: orderId }, { $set: { status } })
        res.redirect('/admin/orders')
    } catch (error) {
        next(error)
    }
},
returnOrder : async (req, res, next) => {
    try {
        const orderId = req.body.orderId
        const status = req.body.status
        await ORDER.updateOne({ _id: orderId }, { $set: { status } })
        res.redirect(`/orderDetails?details=${orderId}`)
    } catch (error) {
        next(error)
    }
},

cancelOrder : async (req, res, next) => {
    try {
        const orderId = req.params.id
        const status = req.query.status

        const orderData = await ORDER.findOne({ _id: orderId })
        const userId = orderData.user
        const userData = await USER.findOne({ _id: userId })

        if ((orderData.paymentMethod === 'ONLINE') || (orderData.paymentMethod === 'WALLET')) {
            let purchaseAmount = Math.round(orderData.totalPrice)
            let totalWalletAmount = userData.wallet + purchaseAmount
            await USER.findByIdAndUpdate({ _id: userId },
                {
                    $inc: { wallet: purchaseAmount },
                    $push: {
                        walletHistory: {
                            transactionDate: new Date(),
                            transactionDetail: 'Order Cancellation',
                            transactionType: 'Credit',
                            transactionAmount: purchaseAmount,
                            currentBalance: totalWalletAmount
                        }
                    }
                })
        }

        await ORDER.updateOne({ _id: orderId }, { $set: { status } })
        if (status.toString() === 'Canceled') {
            res.redirect('/orders')
        } else {
            res.redirect(`/admin/singleOrderDetails?id=${orderId}`)
        }
    } catch (error) {
        next(error)
    }
},

orderSuccess : async (req, res, next) => {
    try {
        //cartCount
        let cartCount = await CART.findOne({ user: req.session.user._id })
        if (cartCount && cartCount.products) {
            req.session.cartCount = cartCount.products.length
        } else {
            req.session.cartCount = 0
        }
        //
        res.render('user/orderSuccess', { user: req.session.user, pageTitle: 'Order Success' })
    } catch (error) {
        next(error)
    }
},

singleOrderDetails : async (req, res, next) => {
    try {
        const orderId = req.query.id
        const order = await ORDER.findOne({ _id: orderId }).populate('products.productId').populate('user')
        // console.log(order);
        res.render('admin/singleOrderDetails', { order, pageTitle: 'Order Details' })

    } catch (error) {
        next(error)
    }
},


approveReturn : async (req, res, next) => {
    try {
        let orderId = req.params.id
        let orderData = await ORDER.findOne({ _id: orderId })
        const userId = orderData.user
        const userData = await USER.findOne({ _id: userId })
        let orderTotal = Math.round(orderData.totalPrice)

        let totalWalletBalance = userData.wallet + orderTotal

        await USER.findByIdAndUpdate({ _id: userId },
            {
                $inc: { wallet: orderTotal },
                $push: {
                    walletHistory: {
                        transactionDate: new Date(),
                        transactionDetail: 'Order return refund',
                        transactionType: 'Credit',
                        transactionAmount: orderTotal,
                        currentBalance: totalWalletBalance
                    }
                }

            })
        await ORDER.findByIdAndUpdate({ _id: orderId }, { $set: { status: 'Returned' } })
        res.redirect(`/admin/singleOrderDetails?id=${orderId}`)
    } catch (error) {
        next(error)
    }
},

invoice : async (req, res, next) => {
    try {
        const orderId = req.query.id
        const order = await ORDER.findOne({ _id: orderId })
        // console.log(order);
        res.render('user/invoice', { order, pageTitle: 'Invoice' })
    } catch (error) {
        next(error)
    }
}


}