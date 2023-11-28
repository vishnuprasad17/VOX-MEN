const mongoose = require('mongoose');


const dbConnect = () => {
    try {
        mongoose.connect(process.env.DATABASE_URL, console.log('Database Connected'))
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = dbConnect




