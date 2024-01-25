const express = require ("express");
const user_route = express();

user_route.set('view engine','ejs');
user_route.set('views','./views/user');

const userAuth = require("../middlewares/userAuth");

const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}));

const userController = require("../controllers/userController");

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

user_route.post('/register',userController.insertUser);

module.exports = user_route