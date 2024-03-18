const express = require("express");
const admin_route = express();
const multer = require("multer");
const upload = require("../config/multer-config")

admin_route.set('view engine', 'ejs');
admin_route.set('views','./views/admin');

const bodyParser = require("body-parser");
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));

const adminAuth = require("../middlewares/adminAuth");

//CONTROLLERS
const adminController = require("../controllers/adminController");
const categoryController = require('../controllers/categoryController');
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const adminDashboardController = require("../controllers/adminDashboardController");
const couponController = require("../controllers/couponController");
const offerController = require("../controllers/offerController");

//ADMIN LOGIN AND LOGOUT
admin_route.get('/login',adminAuth.isLogout,adminController.loadAdminLogin);
admin_route.get('/',adminAuth.isLogout,adminController.loadAdminLogin);
admin_route.post('/loginsubmit', adminController.adminVerifyLogin);
admin_route.get('/logout', adminController.adminLogout);

//DASHBOARD
admin_route.get('/dashboard', adminAuth.isLogin, adminDashboardController.loadDashboard);
admin_route.post("/order-filter", adminDashboardController.filterDashboard);

//USER DETAILS
admin_route.get('/userlist', adminAuth.isLogin, adminController.loadUserList);
admin_route.post('/toggle_user_status/:id', adminController.toggleUserStatus);

//CATEGORY
admin_route.get('/category', adminAuth.isLogin, categoryController.loadCategoryList); 
admin_route.post('/save-category', categoryController.addCategory);
admin_route.post('/toggleCategoryStatus/:categoryId', categoryController.toggleCategoryStatus);
admin_route.post('/edit-category/:categoryId', categoryController.editCategory);

//PRODUCT PART
admin_route.get('/product', adminAuth.isLogin, productController.loadProductList);
admin_route.post('/submitProduct',upload.array('image', 4), productController.addProduct);
admin_route.get('/addproduct', adminAuth.isLogin, productController.loadCategory);
admin_route.post('/toggleProductStatus/:productId', productController.toggleProductStatus);
admin_route.get('/editproduct/:id', adminAuth.isLogin, productController.loadEditProduct);
admin_route.post('/submitEditProduct/:id', upload.array('image', 4), productController.editProduct);

//ORDER PART
admin_route.get('/order', adminAuth.isLogin, orderController.loadAdminOrderList);
admin_route.post('/toggleOrderStatus', orderController.updateOrderStatus);
admin_route.get('/order-details/:orderId', orderController.loadOrderDetails);

//SALES REPORT
admin_route.get('/salesreport', adminDashboardController.loadSalesReport);
admin_route.post('/salesreport', adminDashboardController.generateSalesReport);

//COUPON
admin_route.get('/coupon', adminAuth.isLogin, couponController.loadCouponPage);
admin_route.get('/addcoupon', adminAuth.isLogin, couponController.loadAddCoupon);
admin_route.post('/submitCoupon', couponController.addCoupon);
admin_route.delete('/deletecoupon/:id', couponController.deleteCoupon);
admin_route.get('/editCoupon/:couponId', adminAuth.isLogin, couponController.loadEditCoupon);
admin_route.post('/submitEditCoupon/:couponId', couponController.editCoupon);

//OFFER MODULE
admin_route.get('/offer', adminAuth.isLogin, offerController.loadOffer);
admin_route.get('/addoffer', adminAuth.isLogin, offerController.loadAddOffer);
admin_route.post('/submitOffer', adminAuth.isLogin, offerController.addOffer);
admin_route.get('/editoffer/:offerId', adminAuth.isLogin, offerController.loadEditOffer);
admin_route.post('/submiteditoffer/:offerId', adminAuth.isLogin, offerController.editOffer)

//PRODUCT OFFER
admin_route.get('/selectproductoffer', adminAuth.isLogin, offerController.loadProductApplyOffer);
admin_route.post('/applyProductOffer',adminAuth.isLogin, offerController.applyProductOffer);
admin_route.post('/removeProductOffer',adminAuth.isLogin,offerController.removeProductOffer);

//CATEGORY OFFER
admin_route.get('/selectcategoryoffer', adminAuth.isLogin, offerController.loadCategoryApplyOffer);
admin_route.post('/applyCategoryOffer', adminAuth.isLogin, offerController.applyCategoryOffer);
admin_route.post('/removeCategoryOffer', adminAuth.isLogin, offerController.removeCategoryOffer);

module.exports = admin_route;