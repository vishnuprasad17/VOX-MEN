const ADMIN = require('../models/adminModel')
const bcrypt = require('bcrypt');
const USER = require('../models/userModel');
const ORDERS = require('../models/orderModel')
const CATEGORY = require('../models/categoryModel')

module.exports = {

getLogin : (req, res, next) => {
    try {
        var passwordNotMatch = req.app.locals.specialContext;
        req.app.locals.specialContext = null;

        res.render('admin/login', { passwordNotMatch, pageTitle: 'Admin Login' })
    } catch (error) {
        next(error)
    }
},


postLogin : async (req, res, next) => {
    try {
        const { email, password } = req.body

        //checking admin is in db
        const adminData = await ADMIN.findOne({ email })
        if (adminData) {
            const passwordMatch = await bcrypt.compare(password, adminData.password)

            if (passwordMatch) {
                req.session.admin = adminData
                res.redirect('/admin')
            } else {
                req.app.locals.specialContext = 'Incorrect Password'
                res.redirect('/admin/login')
            }

        } else {
            req.app.locals.specialContext = 'Invalid Credentials'
            res.redirect('/admin/login')
        }

        } catch (error) {
        next(error)
        }
    },



//admin dashboard
getDashboard : async (req, res, next) => {
    try {
        let salesYear = 0
        let salesMonth = ''
        let displayValue = 'Year'
        let xDisplayValue = 'Years'

        if (req.query.year) {
            salesYear = parseInt(req.query.year)
            displayValue = req.query.year
            xDisplayValue = 'Months'

        } else {
            salesYear = 2023
        }
        if (req.query.month) {
            salesMonth = parseInt(req.query.month)
            xDisplayValue = 'Weeks'
            const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];

            const monthName = monthNames[req.query.month - 1];
            displayValue = `${req.query.year} - ${monthName}`

        }
        const totalYears = await ORDERS.aggregate([
            { $group: { _id: { date: { $dateToString: { format: "%Y", date: "$date" } } } } },
            { $sort: { '_id.date': -1 } }
        ])

        const displayYears = []
        totalYears.forEach((year) => { displayYears.push(year._id.date) })
        // console.log(displayYears);

        let salesAggregationPipeline = [
            {
                $match: {
                    status: 'Delivered',
                }
            },
            {
                $group: {
                    _id: { date: { $dateToString: { format: "%Y", date: "$date" } } },
                    sales: { $sum: '$totalPrice' }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]


        if (req.query.year && !req.query.month) {
            salesAggregationPipeline = [
                {
                    $match: {
                        status: 'Delivered',
                        date: {
                            $gte: new Date(`${salesYear}-01-01`),
                            $lt: new Date(`${salesYear + 1}-01-01`)
                        }
                    }
                },
                {
                    $group: {
                        _id: { date: { $dateToString: { format: "%m", date: "$date" } } },
                        sales: { $sum: '$totalPrice' }
                    }
                },
                { $sort: { '_id.date': 1 } }
            ]
        }
        if (req.query.year && req.query.month) {
            const firstDayOfMonth = new Date(salesYear, salesMonth - 1, 1);
            const lastDayOfMonth = new Date(salesYear, salesMonth, 0);
            salesAggregationPipeline = [
                {
                    $match: {
                        status: 'Delivered',
                        date: {
                            $gte: firstDayOfMonth,
                            $lt: lastDayOfMonth
                        }
                    }
                },
                {
                    $addFields: {
                        weekNumber: {
                            $ceil: {
                                $divide: [
                                    { $subtract: ["$date", firstDayOfMonth] },
                                    604800000 // milliseconds in a week (7 days)
                                ]
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: { date: "$weekNumber" }, // Group by week number
                        sales: { $sum: '$totalPrice' }
                    }
                },
                { $sort: { '_id.date': 1 } }
            ]
        }
        //main sales
        const orderData = await ORDERS.aggregate(salesAggregationPipeline)

        // console.log(orderData);

        let months = []
        let sales = []

        if (req.query.year && !req.query.month) {
            function getMonthName(monthNumber) {
                if (monthNumber < 1 || monthNumber > 12) {
                    return "Invalid month number";
                }

                const monthNames = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
                return monthNames[monthNumber - 1];
            }
            orderData.forEach((month) => { months.push(getMonthName(month._id.date)) })
            orderData.forEach((sale) => { sales.push(Math.round(sale.sales)) })

        } else if (req.query.year && req.query.month) {
            orderData.forEach((year) => { months.push(`Week ${year._id.date}`) })
            orderData.forEach((sale) => { sales.push(Math.round(sale.sales)) })
        }
        else {
            orderData.forEach((year) => { months.push(year._id.date) })
            orderData.forEach((sale) => { sales.push(Math.round(sale.sales)) })
        }
        let totalSales = sales.reduce((acc, curr) => acc += curr, 0)



        // category sales
        let category = []
        let categorySales = []
        const categoryData = await ORDERS.aggregate([
            { $match: { status: 'Delivered' } },
            {
                $unwind: '$products'
            },
            {
                $lookup: {
                    from: 'products', // Replace 'products' with the actual name of your products collection
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'populatedProduct'
                }
            },
            {
                $unwind: '$populatedProduct'
            },
            {
                $lookup: {
                    from: 'categories', // Replace 'categories' with the actual name of your categories collection
                    localField: 'populatedProduct.category',
                    foreignField: '_id',
                    as: 'populatedCategory'
                }
            },
            {
                $unwind: '$populatedCategory'
            },
            {
                $group: {
                    _id: '$populatedCategory.name', sales: { $sum: '$products.totalProductDiscountPrice' } // Assuming 'name' is the field you want from the category collection
                }
            }
        ])
        // console.log(categoryData);

        categoryData.forEach((cat) => {
            category.push(cat._id),
                categorySales.push(cat.sales)
        })
        // console.log(category);
        // console.log(categorySales);

        // payment method count
        const paymentData = await ORDERS.aggregate([
            { $match: { status: 'Delivered' } },
            { $group: { _id: "$paymentMethod", count: { $sum: 1 } } }
        ])

        let paymentMethods = []
        let paymentCount = []

        paymentData.forEach((data) => {
            paymentMethods.push(data._id),
                paymentCount.push(data.count)
        })

        let orderDataDownload = await ORDERS.find({ status: 'Delivered' }).sort({ date: 1 })

        if (req.query.sDate) {
            let sDate = req.query.sDate
            let eDate = req.query.eDate

            sDate = new Date(sDate)
            eDate = new Date(eDate)
            eDate = new Date(eDate.getTime() + 1 * 24 * 60 * 60 * 1000);

            orderDataDownload = await ORDERS.find({ status: 'Delivered', date: { $gte: sDate, $lte: eDate } }).sort({ date: 1 })
        }


        const userCount = await USER.find({}).count()
        const orderCount = await ORDERS.find({ status: 'Delivered' }).count()
        const salesCount = await ORDERS.aggregate([{ $match: { status: 'Delivered' } }, { $group: { _id: '$status', total: { $sum: '$totalPrice' } } }])
        let totalSalesProfit = 0
        if (salesCount&&salesCount.length>0) totalSalesProfit = salesCount[0].total

        res.render('admin/dashboard', {
            displayValue, xDisplayValue,
            sales, months, salesYear, displayYears, totalSales,
            category, categorySales,
            paymentMethods, paymentCount,
            orderDataDownload,
            userCount, orderCount, totalSalesProfit,
            pageTitle: 'Dashboard'
        })

    } catch (error) {
        next(error)
    }

},


//admin usersPage
getUserData : async (req, res, next) => {
    try {
        const userData = await USER.find({}).sort({date:-1})
        res.render('admin/userData', { userData, pageTitle: 'User Data' })

    } catch (error) {
        next(error)
    }
},


postUserStatus : async (req, res, next) => {
    try {
        const userId = req.params.id
        const userData = await USER.findById({ _id: userId })

        //updating user status
        if (userData) {

            if (userData.status === true) {
                await USER.findByIdAndUpdate({ _id: userId }, { $set: { status: false } })
            } else {
                await USER.findByIdAndUpdate({ _id: userId }, { $set: { status: true } })
            }
        }
        res.redirect('/admin/users')
    } catch (error) {
        next(error)
    }
},


logout : async (req, res, next) => {
    try {
        req.session.destroy()
        res.redirect('/admin')
    } catch (error) {
        next(error)
    }
}



}