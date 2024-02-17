const express = require ("express");
const user_route = express();

user_route.set('view engine','ejs');
user_route.set('views','./views/user');

const userAuth = require("../middlewares/userAuth");
const navbarMiddleware = require('../middlewares/navbarMiddleware');

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

user_route.get('/register',userController.loadRegister);
user_route.post('/register',userController.insertUser);

user_route.get('/otp',userController.loadOTP);
user_route.post('/otp',userController.verifyOTP);

user_route.get('/forgotpassword',userController.loadForgotPassword);
user_route.post('/send-otp', userController.sendOTP);
user_route.post('/verify-otp',userController.verifyPasswordResetOTP);
user_route.get('/resetpassword',userController.loadResetPassword);
user_route.post('/resetpassword',userController.loadResetPassword);
user_route.post('/update-password', userController.updatePassword);

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

user_route.post('/placeOrder', cartController.placeOrder);
user_route.get('/orderconfirmation/:Id', cartController.loadOrderConfirmation);

user_route.get('/profile', userAuth.isLogin, userAuth.isAuthenticated, navbarMiddleware.fetchCartAndWishlistCounts, userProfileController.loadUserProfile);
user_route.get('/user/address/:id', userProfileController.loadEditAddress);
user_route.put('/user/address/:id', userProfileController.updateAddress);
user_route.get('/orderdetails/:Id', userProfileController.loadOrderDetails);
user_route.put('/orderdetails/:orderId/products/:productId/cancel', userProfileController.orderCancel);

module.exports = user_route;