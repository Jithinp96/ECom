const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); // Set the destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

// Initialize multer upload
const upload = multer({
    storage: storage,
    limits: { files: 4 }, 
});

// // Check file type
// function checkFileType(file, cb) {
//     const filetypes = /jpeg|jpg|png|gif/; // Add or modify allowed file types
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = filetypes.test(file.mimetype);

//     if (extname && mimetype) {
//         return cb(null, true);
//     } else {
//         cb('Error: Images Only!');
//     }
// }

module.exports = upload;