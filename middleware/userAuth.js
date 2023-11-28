const USER = require('../models/userModel')

module.exports = {
loggedIn : async (req, res, next) => {
    try {
        if (req.session.user) {
            const userId = req.session.user._id
            const userData = await USER.findOne({ _id: userId })
            if (userData.status) {
                next()
            } else {
                req.session.destroy()
                req.app.locals.specialContext = 'You have been blocked by the admin'
                return res.redirect('/login')
            }
        } else {
            return res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message);
    }
},
loggedOut : (req, res, next) => {
    try {
        if (req.session.user) {
            return res.redirect('/')
        }
        next()
    } catch (error) {
        console.log(error.message);
    }

}



}
