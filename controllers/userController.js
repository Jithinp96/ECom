const bcrypt = require('bcrypt');
const Swal = require('sweetalert2');
const nodemailer = require('nodemailer')
const mongoose = require('mongoose');
const crypto = require('crypto');

// ========== REQUIRING MODELS ===========
// const Order = require("../models/orderModel");
const User = require('../models/userModel');
const Wallet = require('../models/walletModel');
const Category = require ("../models/categoryModel");
const Token = require("../models/tokenModel")
const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishlistModel");
const UserOTPVerification = require("../models/userOTPVerification");
const Products = require("../models/productModel");

const { request } = require('express');


// ========== PASSWORD HASHING FUNCTION ===========
const securePassword = async(password) => {
    try{
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error){
        console.log(error.messgae);
    }
}

// ========== FOR LOADING REGISTER PAGE ===========
const loadRegister = async (req, res) => {
    try {
        res.render('user/registration')
    } catch(error) {
        console.log(error);
    }
}

// ========== FOR ADDING THE USER DETAILS TO DB ===========
const insertUser = async (req, res) => {
    try{

        const exist = await User.findOne({email:req.body.email})

        if(exist){
            req.flash('email', 'Email already exists');
            res.render('user/registration');
        }
        else{
            const spassword = await securePassword(req.body.password);
            
            const newUser = User({
                email: req.body.email,
                fname: req.body.fname,
                lname: req.body.lname,
                mobile:req.body.mobile,
                password: spassword,
                is_admin: 0,
                is_blocked:0,
                is_verified: 0,
            });

            await newUser.save();

            const newWallet = new Wallet({ user: newUser._id });
            await newWallet.save();

            sendOTPVerificationEmail(newUser, res);
        }
    } catch(error){
        console.log(error);
        return res.status(500).send({ error: 'Internal server error.' });
    }
}

// ========== FOR SENDING OTP VERFICATION EMAIL ===========
const sendOTPVerificationEmail = async ({email}, res) => {
    try {
        let transporter = nodemailer.createTransport({
            service:'gmail',
            host:'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'officialfurnit@gmail.com',
                pass: 'crzo lqng bteh lnxu'
            }
        })
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        console.log("OTP: "+otp);

        const mailOptions = {
            from: 'officialfurnit@gmail.com',
            to: email,
            subject: "Verify Your email",
            html: `Your OTP is: ${otp}`
        };

        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(otp, saltRounds);
        const newOTPVerification = await new UserOTPVerification({email: email, otp: hashedOTP});
        
        await newOTPVerification.save();
        await transporter.sendMail(mailOptions);

        res.redirect(`/otp?email=${email}`);
    
    } catch (error) {
        console.log(error);
    }
}

// ========== FOR LOADING OTP ENTERING PAGE ===========
const loadOTP = async (req, res) => {
    try {
        const email = req.query.email;
        res.render('user/otpVerification', { email: email});
    } catch (error) {
        console.log(error);
    }
}

// ========== OTP VERIFICATION FUNCTION ===========
const verifyOTP = async (req, res) => {
    try {
        const email = req.body.email;
        const otp = req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4;
        const userVerification = await UserOTPVerification.findOne({email:email});

        if (! userVerification) {
            res.render('user/otpVerification', {email, errorMessage:"OTP Expired. Please resend OTP and try again...!!!"})
            return;
        }
        const {otp: hashedOTP} = userVerification;
        const validOTP = await bcrypt.compare(otp, hashedOTP);
        
        if (validOTP) {
            const userData = await User.findOne({email: email});

            if (userData) {
                await User.findByIdAndUpdate({
                    _id: userData._id
                }, {
                    $set: {
                        is_verified:true
                    }
                });
            }

            const user = await User.findOne({email: email})
            await userVerification.deleteOne({email: email});
            if (user.is_verified) {
                if (! user.is_blocked) {
                    req.session.user = {
                        _id: user._id,
                        email: user.email,
                        fname: user.fname

                    };
                    res.redirect('/login?success=true');
                } 
                else {
                    req.flash('error', 'you are blocked from this contact with admin');
                    res.redirect('/login')
                }
            }
        } else {
            res.render('user/otpVerification', {email, errorMessage:"Invalid OTP. Please try again...!!!"})
        }
    } catch (error) {
        console.log(error);
    }
};


// ========== RESEND OTP ===========
const resendOTP = async (req, res) => {
    try {

        const userEmail = req.query.email;
        await UserOTPVerification.deleteMany({email: userEmail});
        console.log(UserOTPVerification)
        console.log("User Email:", userEmail);
        if (userEmail) {
            sendOTPVerificationEmail({
                email: userEmail
            }, res);
        } else {
            console.log("User email not provided in the query");
        }

    } catch (error) {
        console.log(error);
    }
}

// ========== FOR LAODING FORGOT PASSWORD PAGE ===========
const loadForgotPassword = async (req,res)=>{
    try {
        res.render('user/forgotPassword')
    } catch (error) {
        console.log(error.message);
    }
}

// ========== FOR SUBMITING THE EMAIL TO GET RESET LINK ===========
const submitForgotPassword = async (req, res) => {
    try {
        const email = req.body.email;
        const userData = await User.findOne({ email: email });
        if (!userData || !userData.is_verified) {
            req.flash('error', 'Invalid email or not verified.');
            return res.redirect('/forgotpassword');
        }

        const token = crypto.randomBytes(20).toString('hex');
        const tokenData = new Token({
            Token: token,
            userId: userData._id,
        });
        console.log("Generated tokenData:", tokenData);
        await tokenData.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'officialfurnit@gmail.com',
                pass: 'crzo lqng bteh lnxu'
            }
        })

        const resetLink = `http://localhost:4000/resetpassword/${token}`
        const mailOptions = {
            from: 'officialfurnit@gmail.com',
            to: email,
            subject: 'Reset Password',
            html: `Click <a href="${resetLink}">here</a> to reset your password.`,
        };

        await transporter.sendMail(mailOptions);

        res.redirect('/login');
    } catch (error) {
        console.log(error.message);
    }
}

// ========== LOADING RESET PASSWORD PAGE ===========
const loadResetPassword = async (req,res)=>{
    try {
        const token = req.params.token;
        console.log("token from params: ", token);
        const tokenData = await Token.findOne({ Token: token });
        console.log("Database log: ", Token.find());
        console.log("tokenData: ", tokenData);
        if (!tokenData) {
            console.log("Inside Not token data");
            req.flash('error', 'Invalid or expired token.');
            return res.redirect('/forgotpassword');
        }

        res.render('user/resetPassword',{token});
    } catch (error) {
        console.log(error.message);
    }

}

// ========== FOR CHANGING THE PASSWORD IN FORGOT PASSWORD ===========
const submitResetPassword = async (req,res)=>{
    try {
        const token = req.body.token;
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;

        const tokenData = await Token.findOne({ Token: token });

        if (!tokenData) {
            console.log("Inside not tokendata");
            req.flash('error', 'Invalid or expired token.');
            return res.redirect('/forgotpassword');
        }

        if (newPassword !== confirmPassword) {
            req.flash('error', 'Passwords do not match.');
            return res.redirect(`/resetpassword/${token}`);
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        const user = await User.findById(tokenData.userId);
        user.password = passwordHash;
        await user.save();

        await Token.deleteOne({ Token: token });
        
        req.flash('success', 'Password reset successfully.');
        res.redirect('/login');
    } catch (error) {
        console.log(error.message);
    }
}

// ========== VERFYING THE USER LOGIN DETAILS ===========
const verifyLogin = async(req, res) => {
    try{
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({email: email});
        
        if(userData){
            const passwordMatch = await bcrypt.compare(password, userData.password);
            
            if(passwordMatch){
                if(!userData.is_blocked){
                    if(!userData.is_verified){
                        sendOTPVerificationEmail(userData, res);
                    }
                    else{
                        req.session.userid = userData._id;
                        res.redirect('/');
                    }
                }
                else{
                    req.flash('error', 'Your account is temporarily suspended... Please contact Admin')
                    res.redirect('/login');
                }
                
            }
            else {
                req.flash('error', 'Email or Password is Incorrect...!!!')
                res.redirect('/login');
            }
        }
        else{
            req.flash('error', 'Email or Password is Incorrect...!!!')
            res.redirect('/login');
        }

    } catch (error) {
        console.log(error.message);
    }
}

// ========== FOR LOADING THE PASSWORD CHANGING PAGE IN USER PROFILE ===========
const loadUpdatePassword = async (req, res) => {
    try {
        res.render('user/changePassword');
    } catch (error) {
        console.log(error);
    }
}

// ========== FOR SAVING THE NEW PASSWORD IN DATABASE ===========
const updatePassword = async (req, res) => {
    try {
        const userId = req.session.userid;

        if (!userId) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "New passwords do not match" });
        }

        const hashedNewPassword = await securePassword(newPassword);
        user.password = hashedNewPassword;

        await user.save();

        req.flash('success', 'Password Changed Successfully');
        res.redirect('/changepassword'); 

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// ========== FOR LOGGING OUT USER ===========
const userLogout = async (req, res) => {
    try {
        req.session.userid = null
        res.redirect('/login');
        
    } catch (error) {
        console.log(error.message);
    }
}

// ========== FOR LOADING LOGIN PAGE ===========
const loadLogin = async (req, res) => {
    try {
        res.render('user/login', { message: "" })
    }
    catch(error) {
        console.log(error.message);
    }
}

// ========== FOR LOADING ABOUT US PAGE ===========
const loadAboutUs = async (req, res) => {
    try {
        res.render('user/aboutUs')
    }
    catch(error) {
        console.log(error.message);
    }
}

// ========== FOR LOADING CONTACT US PAGE ===========
const loadContactUs = async (req, res) => {
    try {
        res.render('user/contactUs')
    }
    catch(error) {
        console.log(error.message);
    }
}

// ========== FOR LOADING HOME PAGE ===========
const ITEMS_PER_PAGE = 8;
const loadHome = async (req, res) => {
    const page = parseInt(req.query.page) || 1;

    try {
        const totalItems = await Products.countDocuments({ is_listed: true });
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        
        const categories = await Category.find({is_listed: true});
        
        let products = await Products.find({ is_listed: true })
            .populate('category', 'is_listed')
            .populate('offer') 
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);

        products = await Promise.all(products.map(async (product) => {
            const { bestOffer, bestOfferType } = await product.determineBestOffer();
            return { ...product.toObject(), bestOffer, bestOfferType };
        }));

        const cartCount = res.locals.cartCount;
        const wishlistCount = res.locals.wishlistCount;

        const filteredProducts = products.filter(product => product.category.is_listed);

        if (filteredProducts.length === 0 || categories.length === 0) {
            
            return res.render('user/home', { userAuthenticated: req.session.userid, products: [], categories: [] });
        }

        res.render('user/home', { userAuthenticated: req.session.userid, currentPage: page, totalPages, cartCount, wishlistCount, products: filteredProducts, categories });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
}

// ========== FOR LOADING EACH PRODUCT DETAILS PAGE ===========
const loadProductDetails = async (req, res) => {
    try {
        const userId = req.session.userid;
        const productId = req.params.productId;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        const product = await Products.findById(productId).populate('offer').populate('category');

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const { bestOffer, bestOfferType } = await product.determineBestOffer();
        
        const cart = await Cart.findOne({ userid: userId, 'product.productid': productId });
        let alreadyInCart = false;

        if (cart) {
            alreadyInCart = true;
        }

        const wishlist = await Wishlist.findOne({ userid: userId, 'product.productid': productId });
        let alreadyInWishlist = false;

        if (wishlist) {
            alreadyInWishlist = true;
        }

        res.render('user/productDetailsPage', { product, userId, alreadyInCart, alreadyInWishlist, bestOffer, bestOfferType });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ========== FOR LOADING PAYMENT POLICY PAGE ===========
const loadPaymentPolicy = async (req, res) => {
    try {
        res.render("user/paymentPolicy");
    } catch (error) {
        console.log(error);
    }
}

// ========== FOR LOADING THE SHOP PAGE ===========
const ITEMS_PER_PAGE_SHOP = 9;
const loadAllProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    try {
        const categoriesQueryParam = req.query.categories;
        const minPrice = parseInt(req.query.minPrice) || 0;
        const maxPrice = parseInt(req.query.maxPrice) || 10000; 
        const searchTerm = req.query.search;

        let filter = { is_listed: true };

        if (categoriesQueryParam) {
            const categoryIds = categoriesQueryParam.split(',');
            filter.category = { $in: categoryIds };
        }

        filter.price = { $gte: minPrice, $lte: maxPrice };

        if (searchTerm) {
            
            filter.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                
            ];
        }

        const totalItems = await Products.countDocuments(filter);
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE_SHOP);
        const categories = await Category.find({is_listed: true});

        let products = await Products.find(filter)
            .populate('category')
            .populate('offer') 
            .skip((page - 1) * ITEMS_PER_PAGE_SHOP)
            .limit(ITEMS_PER_PAGE_SHOP);

        
        products = await Promise.all(products.map(async (product) => {
            const { bestOffer, bestOfferType } = await product.determineBestOffer();
            return { ...product.toObject(), bestOffer, bestOfferType };
        }));

        if (req.xhr) {
            res.render("partials/productList", { products, currentPage: page, totalPages });
        } else {
            res.render("user/allProducts", { products, currentPage: page, totalPages, categories });
        }

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports ={
    loadRegister,
    insertUser,
    loadOTP,
    sendOTPVerificationEmail,
    resendOTP,
    verifyOTP,

    loadUpdatePassword,
    updatePassword,
    loadForgotPassword,
    submitForgotPassword,
    loadResetPassword,
    submitResetPassword,

    userLogout,
    loadLogin,
    verifyLogin,

    loadHome,
    loadAllProducts,
    
    loadAboutUs,
    loadContactUs,
    loadProductDetails,
    loadPaymentPolicy,

    
}