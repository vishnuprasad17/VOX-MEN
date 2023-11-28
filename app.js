const express = require('express');
const dotenv = require('dotenv').config()
const path = require('path');
const session = require('express-session');
const nocache = require('nocache');

const dbConnect = require('./config/connection')

const app = express()
dbConnect()


const userRoutes = require('./routes/userRoute')
const adminRoutes = require('./routes/adminRoute')
const errorHandler = require('./middleware/errorHandler')

app.set('view engine', 'ejs')

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({ secret: process.env.KEY, resave: false, saveUninitialized: true, cookie: { maxAge: 30 * 24 * 60 * 60 * 60000 } }))
app.use(nocache())

app.use(userRoutes)
app.use('/admin', adminRoutes)

//next to show error
app.use(errorHandler)


// error page
app.use((req, res) => {
    res.status(404).render('404')
})

app.listen( process.env.PORT || 4000 , () => {
    console.log('server running');
})