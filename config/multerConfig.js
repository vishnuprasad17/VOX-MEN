const multer = require('multer');
const path = require('path');

const storageConfig = (destination) => multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, destination));
    },
    filename: (req, file, cb) => {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

const uploadFor = (destination) => multer({ storage: storageConfig(destination) });

const uploadForProduct = uploadFor('../public/images/product-images');
const uploadForBanner = uploadFor('../public/images/banner-images');
const uploadForCategory = uploadFor('../public/images/category-images');

module.exports = { uploadForProduct, uploadForBanner, uploadForCategory };
