const express = require ("express");
const user_route = express();

user_route.set('views', './views');
user_route.set('view engine','ejs');

//MIDDLEWARES
const userAuth = require("../middlewares/userAuth");
const navbarMiddleware = require('../middlewares/navbarMiddleware');
const walletMiddleware = require("../middlewares/walletMiddleware")

const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}));

// user_route.use(express.json());
// user_route.use(express.urlencoded({extended:true}));

//CONTROLLERS
const userController = require("../controllers/userController");
const cartController = require("../controllers/cartController");
const wishlistController = require("../controllers/wishlistController")
const userProfileController = require("../controllers/userProfileController")
const couponController = require("../controllers/couponController");

//USER REGISTRATION PART
user_route.get('/register', userController.loadRegister);
user_route.post('/register', userController.insertUser, walletMiddleware.createWalletForUser);
user_route.get('/otp', userController.loadOTP);
user_route.post('/otp', userController.verifyOTP);
user_route.get('/resend-otp', userController.resendOTP);

//FORGOT PASSWORD
user_route.get('/forgotpassword', userAuth.isLogout, userController.loadForgotPassword);
user_route.post('/forgot-password-submit', userController.submitForgotPassword);
user_route.get('/resetpassword/:token', userController.loadResetPassword);
user_route.post('/reset-password-submit', userController.submitResetPassword);

//USER LOGIN AND LOGOUT
user_route.get('/login', userAuth.isLogout,userController.loadLogin);
user_route.post('/loginsubmit', userController.verifyLogin);
user_route.get('/logout',userController.userLogout);

user_route.get('/aboutus', userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, userController.loadAboutUs);
user_route.get('/contactus', userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, userController.loadContactUs);

user_route.get('/' , userAuth.checkBlockedStatus, userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, userController.loadHome);
user_route.get('/home', userAuth.checkBlockedStatus, userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, userController.loadHome);

user_route.get('/allproducts', userAuth.checkBlockedStatus, userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, userController.loadAllProducts);
user_route.get('/productdetails/:productId', userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, userController.loadProductDetails);

//WISHLIST
user_route.get('/wishlist', userAuth.checkBlockedStatus, userAuth.isLogin, userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, wishlistController.loadWishlist);
user_route.post('/addtowishlist', wishlistController.addToWishlist);
user_route.delete('/removeFromWishlist/:productId', userAuth.isLogin, wishlistController.removeFromWishlist);

//USER CART
user_route.get('/cart', userAuth.checkBlockedStatus, userAuth.isLogin, userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, cartController.loadCart);
user_route.post('/addtocart', cartController.addToCart);
user_route.delete('/removeFromCart/:productId', userAuth.isLogin, cartController.removeFromCart);
user_route.post('/updateQuantity',cartController.cartquantity)

//CHECKOUT
user_route.get('/checkout', userAuth.checkBlockedStatus, userAuth.isLogin, userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, cartController.loadCheckout);
user_route.post('/api/saveAddress', cartController.checkoutAddAddress); 
user_route.delete('/delete-address/:addressId', userProfileController.deleteAddress);
user_route.post('/saveNewAddress', userProfileController.addAddress);

//COUPON APPLY AND REMOVE
user_route.post('/applycouponcode', couponController.applyCoupon);
user_route.post('/removeCoupon', couponController.removeCoupon);

//PLACE ORDER
user_route.post('/placeOrder', cartController.placeOrder);
user_route.post('/verify-payment', cartController.verifyPayment);
user_route.get('/orderconfirmation/:Id', userAuth.isLogin, userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, cartController.loadOrderConfirmation);

//USER PROFILE
user_route.get('/profile', userAuth.checkBlockedStatus, userAuth.isLogin, userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, userProfileController.loadUserProfile);
user_route.put('/edit/:id', userProfileController.updateUser);
user_route.get('/changepassword', userAuth.checkBlockedStatus, userAuth.isLogin, userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, userController.loadUpdatePassword);
user_route.post('/submit-change-password', userController.updatePassword);

//USER ADDRESS
user_route.get('/user/address/:id', userAuth.checkBlockedStatus, userProfileController.loadEditAddress);
user_route.put('/user/address/:id', userProfileController.updateAddress);

//USER PROFILE ORDER DETAILS
user_route.get('/orderdetails/:Id', userAuth.checkBlockedStatus, userAuth.isLogin, userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, userProfileController.loadOrderDetails);
user_route.put('/orderdetails/:orderId/products/:productId/cancel', userProfileController.orderCancel);
user_route.put(`/orderdetails/:orderId/products/:productId/return`, userProfileController.orderReturnRequest);

// user_route.get('/invoice/:id', userAuth.isLogin, userAuth.isAuthenticated, userProfileController.getInvoice);

user_route.get('/paymentpolicy', userAuth.checkBlockedStatus, userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, userController.loadPaymentPolicy);
user_route.post('/continue-payment', cartController.continuePayment);
user_route.post('/continue-verify-payment', cartController.continueVerifyPayment);

module.exports = user_route;