const express = require ("express");
const user_route = express();

user_route.set('view engine','ejs');
user_route.set('views','./views/user');

const userAuth = require("../middlewares/userAuth");

const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}));

// user_route.use(express.json());
// user_route.use(express.urlencoded({extended:true}));

const userController = require("../controllers/userController");
const cartController = require("../controllers/cartController");

user_route.get('/register',userController.loadRegister);
user_route.post('/register',userController.insertUser);

user_route.get('/otp',userController.loadOTP);
user_route.post('/otp',userController.verifyOTP);

user_route.get('/login',userAuth.isLogout,userController.loadLogin);
// user_route.get('/login',userAuth.isLogin,userController.loadHome);
user_route.post('/loginsubmit',userController.verifyLogin);

user_route.get('/logout',userController.userLogout);

user_route.get('/aboutus',userController.loadAboutUs);
user_route.get('/contactus',userController.loadContactUs);

user_route.get('/', userAuth.isAuthenticated, userController.loadHome);
user_route.get('/home', userAuth.isAuthenticated, userController.loadHome);

user_route.post('/register',userController.insertUser);
user_route.get('/productdetails/:productId',userController.loadProductDetails);

user_route.get('/cart', userAuth.isLogin, cartController.loadCart);
user_route.post('/addtocart', cartController.addToCart);
user_route.delete('/removeFromCart/:productId', userAuth.isLogin, cartController.removeFromCart);


user_route.get('/checkout', userAuth.isLogin, cartController.loadCheckout);
user_route.post('/api/saveAddress', cartController.checkoutAddAddress);

module.exports = user_route