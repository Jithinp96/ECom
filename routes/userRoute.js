const express = require ("express");
const user_route = express();

user_route.set('view engine','ejs');
user_route.set('views','./views/user');

const userAuth = require("../middlewares/userAuth");
const navbarMiddleware = require('../middlewares/navbarMiddleware');
const walletMiddleware = require("../middlewares/walletMiddleware")

const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}));

// user_route.use(express.json());
// user_route.use(express.urlencoded({extended:true}));

const userController = require("../controllers/userController");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderController");
const wishlistController = require("../controllers/wishlistController")
const userProfileController = require("../controllers/userProfileController")
const couponController = require("../controllers/couponController");

user_route.get('/register',userController.loadRegister);
user_route.post('/register',userController.insertUser, walletMiddleware.createWalletForUser);

user_route.get('/otp',userController.loadOTP);
user_route.post('/otp',userController.verifyOTP);
user_route.get('/resend-otp', userController.resendOTP);

user_route.get('/forgotpassword', userAuth.isLogout, userController.loadForgotPassword);
user_route.post('/forgot-password-submit', userController.submitForgotPassword);
user_route.get('/resetpassword/:token', userController.loadResetPassword);
user_route.post('/reset-password-submit', userController.submitResetPassword);

user_route.get('/login',userAuth.isLogout,userController.loadLogin);
// user_route.get('/login',userAuth.isLogin,userController.loadHome);
user_route.post('/loginsubmit',userController.verifyLogin);

user_route.get('/logout',userController.userLogout);

user_route.get('/aboutus', userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, userController.loadAboutUs);
user_route.get('/contactus', userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, userController.loadContactUs);

user_route.get('/', userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, userController.loadHome);
user_route.get('/home', userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, userController.loadHome);

user_route.post('/register',userController.insertUser);
user_route.get('/productdetails/:productId', navbarMiddleware.fetchCartAndWishlistCounts, userController.loadProductDetails);

user_route.get('/wishlist', userAuth.isLogin, userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, wishlistController.loadWishlist);
user_route.post('/addtowishlist', wishlistController.addToWishlist);
user_route.delete('/removeFromWishlist/:productId', userAuth.isLogin, wishlistController.removeFromWishlist);

user_route.get('/cart', userAuth.isLogin, userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, cartController.loadCart);
user_route.post('/addtocart', cartController.addToCart);
user_route.delete('/removeFromCart/:productId', userAuth.isLogin, cartController.removeFromCart);
// user_route.post('/checkcart', cartController.checkCartStatus);

user_route.get('/checkout', userAuth.isLogin, userAuth.isAuthenticated, cartController.loadCheckout);
user_route.post('/api/saveAddress', cartController.checkoutAddAddress);
user_route.delete('/delete-address/:addressId', userProfileController.deleteAddress);
user_route.post('/saveNewAddress', userProfileController.addAddress);
user_route.post('/applycouponcode', couponController.applyCoupon);
user_route.post('/removeCoupon', couponController.removeCoupon);

user_route.post('/placeOrder', cartController.placeOrder);
user_route.get('/orderconfirmation/:Id', cartController.loadOrderConfirmation);

user_route.get('/profile', userAuth.isLogin, userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, userProfileController.loadUserProfile);
user_route.get('/user/address/:id', userProfileController.loadEditAddress);
user_route.put('/user/address/:id', userProfileController.updateAddress);
user_route.get('/orderdetails/:Id', userProfileController.loadOrderDetails);
user_route.put('/orderdetails/:orderId/products/:productId/cancel', userProfileController.orderCancel);

user_route.put(`/orderdetails/:orderId/products/:productId/return`, userProfileController.orderReturnRequest);



module.exports = user_route;