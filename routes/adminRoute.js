const express = require("express");
const admin_route = express();
const multer = require("multer");
const upload = require("../config/multer-config")

admin_route.set('view engine', 'ejs');
admin_route.set('views','./views/admin');

const bodyParser = require("body-parser");
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));

const adminController = require("../controllers/adminController");
const categoryController = require('../controllers/categoryController');
const productController = require("../controllers/productController");
const adminAuth = require("../middlewares/adminAuth");

admin_route.get('/login',adminAuth.isLogout,adminController.loadAdminLogin);
admin_route.get('/',adminAuth.isLogout,adminController.loadAdminLogin);
admin_route.post('/loginsubmit',adminController.adminVerifyLogin);

admin_route.get('/dashboard', adminAuth.isLogin, adminController.loadDashboard);
admin_route.get('/userlist', adminAuth.isLogin, adminController.loadUserList);
admin_route.post('/toggle_user_status/:id', adminController.toggleUserStatus);

admin_route.get('/category', adminAuth.isLogin, categoryController.loadCategoryList); 

admin_route.post('/save-category', categoryController.addCategory);
admin_route.post('/toggleCategoryStatus/:categoryId', categoryController.toggleCategoryStatus);
admin_route.post('/edit-category/:categoryId', categoryController.editCategory);

admin_route.get('/product', adminAuth.isLogin, productController.loadProductList);
admin_route.post('/submitProduct',upload.array('image', 4), productController.addProduct);
admin_route.get('/addproduct', adminAuth.isLogin, productController.loadCategory);
admin_route.get('/editProduct', productController.loadEditProduct);
admin_route.post('/toggleProductStatus/:productId', productController.toggleProductStatus);

module.exports = admin_route;