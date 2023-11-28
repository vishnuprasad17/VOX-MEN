module.exports = {
loggedIn : (req, res, next) => {
    try {
        if (req.session.admin) {
            next()
        } else {
            return res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error.message);
    }
},
loggedOut : (req, res, next) => {
    try {
        if (req.session.admin) {
            return res.redirect('/admin')
        }
        next()
    } catch (error) {
        console.log(error.message);
    }
}


}
