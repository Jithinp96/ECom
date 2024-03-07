const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
// const userAuth = require("../middlewares/userAuth")
const Order = require("../models/orderModel");
const Wallet = require('../models/walletModel');
const Category = require ("../models/categoryModel");
const mongoose = require('mongoose');
const crypto = require('crypto');
const Token = require("../models/tokenModel")
const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishlistModel");

const UserOTPVerification = require("../models/userOTPVerification");
const Products = require("../models/productModel");
const { request } = require('express');

const securePassword = async(password) => {
    try{
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error){
        console.log(error.messgae);
    }
}

const loadRegister = async (req, res) => {
    try {
        res.render('user/registration')
    } catch(error) {
        console.log(error);
    }
}


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

            // Save the new user to the database
            await newUser.save();

            // Create a wallet for the new user
            const newWallet = new Wallet({ user: newUser._id });
            await newWallet.save();

            // Send OTP verification email
            sendOTPVerificationEmail(newUser, res);
        }
    } catch(error){
        console.log(error);
        return res.status(500).send({ error: 'Internal server error.' });
    }
}


const sendOTPVerificationEmail = async ({email}, res) => {
    try {
        console.log("Indide theOTP email send fn");
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

        // mail options
        const mailOptions = {
            from: 'officialfurnit@gmail.com',
            to: email,
            subject: "Verify Your email",
            html: `Your OTP is: ${otp}`
        };

        //HASHING OTP
        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(otp, saltRounds);

        const newOTPVerification = await new UserOTPVerification({email: email, otp: hashedOTP});
        
        
        //SAVE OTP RECORD
        await newOTPVerification.save();
        await transporter.sendMail(mailOptions);

        res.redirect(`/otp?email=${email}`);
    
    } catch (error) {
        console.log(error);
    }
}

const loadOTP = async (req, res) => {
    try {
        console.log("Inside Load OTP page");
        const email = req.query.email;
        res.render('user/OTPVerification', { email: email});

    } catch (error) {
        console.log(error);

    }
}


const verifyOTP = async (req, res) => {
    try {
        const email = req.body.email;
        const otp = req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4;
        const userVerification = await UserOTPVerification.findOne({email:email});
        // console.log('userVerification:', userVerification);

        if (! userVerification) {
            res.render('user/OTPVerification', {email, errorMessage:"OTP Expired. Please resend OTP and try again...!!!"})
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

            // delete theOTPrecord
            const user = await User.findOne({email: email})
            await userVerification.deleteOne({email: email});
            if (user.is_verified) {
                if (! user.is_blocked) {
                    req.session.user = {
                        _id: user._id,
                        email: user.email,
                        fname: user.fname

                    };
                    // console.log("ghgfd"+user.name);
                    // Redirect to the login page with a success parameter
                    res.redirect('/login?success=true');
                } 
                else {
                    console.log("user blocked from this site");


                    req.flash('error', 'you are blocked from this contact with admin');
                    res.redirect('/login')

                }

            }
        } else {
            // req.flash('error', 'OTP is incorrect. Please login to reverify OTP again...!!!');
            // res.redirect('/login')
            res.render('user/OTPVerification', {email, errorMessage:"Invalid OTP. Please try again...!!!"})
        }

    } catch (error) {
        console.log(error);
    }
};


/////////////////////// resend otp
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


const loadForgotPassword = async (req,res)=>{
    try {
        res.render('user/forgotpassword')
    } catch (error) {
        console.log(error.message);
    }
}

const submitForgotPassword = async (req, res) => {
    try {
        const email = req.body.email;
        //console.log(email);
        const userData = await User.findOne({ email: email });
        if (!userData || !userData.is_verified) {
            req.flash('error', 'Invalid email or not verified.');
            return res.redirect('/forgotpassword');
        }

        // Generate a token
        const token = crypto.randomBytes(20).toString('hex');
        // console.log("userData._id,:", userData._id);
        // console.log("Generated TOken: ", token);
        // Save the token in the database
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

        // Send the reset password email with the token link
        const resetLink = `http://localhost:4000/resetpassword/${token}`
        const mailOptions = {
            from: 'officialfurnit@gmail.com',
            to: email,
            subject: 'Reset Password',
            html: `Click <a href="${resetLink}">here</a> to reset your password.`,
        };

        await transporter.sendMail(mailOptions);

        // Redirect to the reset password page with the token
        res.redirect('/login');
    } catch (error) {
        console.log(error.message);
    }
}

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

        // Pass the token to the reset password page
        res.render('user/resetpassword',{token});
    } catch (error) {
        console.log(error.message);
    }

}

const submitResetPassword = async (req,res)=>{
    try {
        const token = req.body.token;
        // console.log("token: ", token);
        const newPassword = req.body.newPassword;
        // console.log("newPassword", newPassword);
        const confirmPassword = req.body.confirmPassword;
        // console.log("confirmPassword", confirmPassword);

        // Find the user associated with the token
        const tokenData = await Token.findOne({ Token: token });
        // console.log("tokenData", tokenData);

        if (!tokenData) {
            console.log("Inside not tokendata");
            req.flash('error', 'Invalid or expired token.');
            return res.redirect('/forgotpassword');
        }

        // Check if the passwords match
        if (newPassword !== confirmPassword) {
            req.flash('error', 'Passwords do not match.');
            return res.redirect(`/resetpassword/${token}`);
        }

        // Hash the new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        const user = await User.findById(tokenData.userId);
        user.password = passwordHash;
        await user.save();

        // Remove the token from the database
        await Token.deleteOne({ Token: token });
        
        // Set success flash message
        req.flash('success', 'Password reset successfully.');


        res.redirect('/login');
    } catch (error) {
        console.log(error.message);
    }
}



const verifyLogin = async(req, res) => {
    try{
        // console.log(req.body);
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({email: email});
        
        if(userData){
            const passwordMatch = await bcrypt.compare(password, userData.password);
            
            if(passwordMatch){
                if(!userData.is_blocked){
                    if(!userData.is_verified){
                        console.log("Non verified user reverifying");
                        sendOTPVerificationEmail(userData, res);
                        // res.render('user/login', {message:"Your email is not verified...!!!"});
                    }
                    else{
                        req.session.userid = userData._id;
                        res.redirect('/');
                    }
                }
                else{
                    req.flash('error', 'Your account is temporarily suspended... Please contact Admin')
                    res.redirect('/login');
                    console.log("User Blocked");
                }
                
            }
            else {
                // res.render('user/login',{message:"Email or Password is Incorrect...!!!"});
                req.flash('error', 'Email or Password is Incorrect...!!!')
                res.redirect('/login');
                console.log("Wrong Password");
            }
        }
        else{
            // res.render('user/login',{message:"Email or Password is Incorrect...!!!"});
            req.flash('error', 'Email or Password is Incorrect...!!!')
            res.redirect('/login');
            console.log("Wrong Email");
        }

    } catch (error) {
        console.log(error.message);
    }
}



const userLogout = async (req, res) => {
    try {
        req.session.userid = null
        res.redirect('/login');
        
    } catch (error) {
        console.log(error.message);
    }
}


const loadLogin = async (req, res) => {
    try {
        res.render('user/login', { message: "" })
    }
    catch(error) {
        console.log(error.message);
    }
}

const loadAboutUs = async (req, res) => {
    try {
        res.render('user/aboutUs')
    }
    catch(error) {
        console.log(error.message);
    }
}

const loadContactUs = async (req, res) => {
    try {
        res.render('user/contactUs')
    }
    catch(error) {
        console.log(error.message);
    }
}

const ITEMS_PER_PAGE = 8; // Adjust this according to our preference

const loadHome = async (req, res) => {
  const page = parseInt(req.query.page) || 1;

  try {
    const totalItems = await Products.countDocuments({ is_listed: true });
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const categories = await Category.find({is_listed: true})
    const products = await Products.find({ is_listed: true })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

      // Access cart and wishlist counts from res.locals
    const cartCount = res.locals.cartCount;
    const wishlistCount = res.locals.wishlistCount;

    res.render('user/home', { userAuthenticated: req.session.userid, products, currentPage: page, totalPages, cartCount, wishlistCount, categories });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
}



const loadProductDetails = async (req, res) => {
    try {
        const userId = req.session.userid;
        const productId = req.params.productId;

        // Check if productId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        console.log("Reached above product finding");
        const product = await Products.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if the product is already in the cart
        const cart = await Cart.findOne({ userid: userId, 'product.productid': productId });
        let alreadyInCart = false;

        // If the product is in the cart, set alreadyInCart to true
        if (cart) {
            alreadyInCart = true;
        }

        const wishlist = await Wishlist.findOne({ userid: userId, 'product.productid': productId });
        let alreadyInWishlist = false;

        // If the product is in the cart, set alreadyInCart to true
        if (wishlist) {
            alreadyInWishlist = true;
        }

        res.render('user/productDetailsPage', { product, userId, alreadyInCart, alreadyInWishlist });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const loadPaymentPolicy = async (req, res) => {
    try {
        res.render("user/paymentpolicy");
    } catch (error) {
        console.log(error);
    }
}

const ITEMS_PER_PAGE_SHOP = 9;

const loadAllProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    try {
        const categoriesQueryParam = req.query.categories;
        const minPrice = parseInt(req.query.minPrice) || 0;
        const maxPrice = parseInt(req.query.maxPrice) || 10000; // Assuming 1000 is the maximum price
        const searchTerm = req.query.search;

        let filter = { is_listed: true };

        if (categoriesQueryParam) {
            const categoryIds = categoriesQueryParam.split(',');
            filter.category = { $in: categoryIds };
        }

        // Add price range filter
        filter.price = { $gte: minPrice, $lte: maxPrice };

        if (searchTerm) {
            // Assuming 'name' is the field you want to search in
            // Adjust this according to your schema
            filter.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                // Add more fields here if you want to search in other fields
            ];
        }

        const totalItems = await Products.countDocuments(filter);
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE_SHOP);
        const categories = await Category.find({is_listed: true});

        const products = await Products.find(filter)
            .populate('category')
            .skip((page - 1) * ITEMS_PER_PAGE_SHOP)
            .limit(ITEMS_PER_PAGE_SHOP);

        if (req.xhr) {
            res.render("partials/productList", { products, currentPage: page, totalPages });
        } else {
            res.render("user/allproducts", { products, currentPage: page, totalPages, categories });
        }

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}


// const loadAllProducts = async (req, res) => {
//     const page = parseInt(req.query.page) || 1;
//     try {
//         const categoriesQueryParam = req.query.categories;
//         let categoryFilter = {};

//         if (categoriesQueryParam) {
//             const categoryIds = categoriesQueryParam.split(',');
//             categoryFilter = { category: { $in: categoryIds } };
//         }

//         const totalItems = await Products.countDocuments({ is_listed: true, ...categoryFilter });
//         const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE_SHOP);
//         const categories = await Category.find({is_listed: true});

//         const products = await Products.find({ is_listed: true, ...categoryFilter })
//             .populate('category')
//             .skip((page - 1) * ITEMS_PER_PAGE_SHOP)
//             .limit(ITEMS_PER_PAGE_SHOP);

//         if (req.xhr) {
//             res.render("partials/productList", { products, currentPage: page, totalPages });
//         } else {
//             res.render("user/allproducts", { products, currentPage: page, totalPages, categories });
//         }

//     } catch (error) {
//         console.log(error);
//         res.status(500).send('Internal Server Error');
//     }
// }


module.exports ={
    loadRegister,
    insertUser,
    loadOTP,
    sendOTPVerificationEmail,
    resendOTP,
    verifyOTP,
    verifyLogin,

    loadForgotPassword,
    submitForgotPassword,
    loadResetPassword,
    submitResetPassword,

    
    userLogout,
    loadLogin,
    loadHome,
    loadAboutUs,
    loadContactUs,
    loadProductDetails,
    loadPaymentPolicy,

    loadAllProducts,
}