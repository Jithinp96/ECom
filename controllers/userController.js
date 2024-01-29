const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
// const userAuth = require("../middlewares/userAuth")

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
        res.render('registration')
    } catch(error) {
        console.log(error);
    }
}


const insertUser = async (req, res) => {
    try{

        const exist = await User.findOne({email:req.body.email})

        if(exist){
            req.flash('email', 'Email already exists');
            res.render('registration');
        }
        else{
            const spassword = await securePassword(req.body.password);
            
            const user = User({
                email: req.body.email,
                fname: req.body.fname,
                lname: req.body.lname,
                mobile:req.body.mobile,
                password: spassword,
                is_admin: 0,
                is_blocked:0,
                is_verified: 0,
            });

            await user.save();
            sendOTPVerificationEmail(user, res);
            // if(userData){
            //     res.redirect('./login')
            // }
            // else{
            //     res.render('registration', {message: "Your registration has been failed...!!!"});
            // }
        }
    } catch(error){
        console.log(error.message);
    }
}


const sendOTPVerificationEmail = async ({email}, res) => {
    try {
        // console.log("Hello");
        let transporter = nodemailer.createTransport({
            service:'gmail',
            host:'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'jithinyt07@gmail.com',
                pass: 'wlxw pbyh qrxj clna'
            }
        })
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        console.log("OTP: "+otp);

        // mail options
        const mailOptions = {
            from: 'jithinyt07@gmail.com',
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
        console.log(message.error);
    }
}

// const loadOTP = async (req, res) => {
//     try {
//         const email = request.query.email;
//         res.render('otpVerification',{email: email})
//     }
//     catch(error) {
//         console.log(error.message);
//     }
// }

const loadOTP = async (req, res) => {
    try {
        const email = req.query.email;
        res.render('OTPVerification', {email: email});

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
            // req.flash('error', 'OTP expired');
            res.redirect('/login')
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


                    // req.flash('error', 'you are blocked from this contact with admin');
                    res.redirect('/login')

                }

            }
        } else {
            // req.flash('error', 'otp is incorrect you have to verifey again login to get otp');
            res.redirect('/login')

        }

    } catch (error) {
        console.log(error);
    }
};


// /////////////////////// resend otp
// const resendOtp = async (req, res) => {
//     try {

//         const userEmail = req.query.email;
//         await userOTPVerification.deleteMany({email: userEmail});
//         console.log(userOTPVerification)
//         console.log("User Email:", userEmail);
//         if (userEmail) {
//             sendOTPVerificationEmail({
//                 email: userEmail
//             }, res);
//         } else {

//             console.log("User email not provided in the query");

//         }

//     } catch (error) {
//         console.log(error);

//     }
// }





const verifyLogin = async(req, res) => {
    try{
        // console.log(req.body);
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({email: email});
        
        if(userData){
            const passwordMatch = await bcrypt.compare(password, userData.password);
            
            if(passwordMatch && !userData.is_blocked){
                if(!userData.is_verified){
                    res.render('login',{message:"Email is not verified...!!!"});
                }
                else{
                    req.session.userid = userData._id;
                    res.redirect('/');
                    // console.log(req.session.userid);
                }
                
            }
            else {
                res.render('login',{message:"Email and Password is incorrect...!!!"});
            }
        }
        else{
            res.render('login',{message:"Email and Password is incorrect...!!!"});
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
        res.render('login')
    }
    catch(error) {
        console.log(error.message);
    }
}

const loadAboutUs = async (req, res) => {
    try {
        res.render('aboutUs')
    }
    catch(error) {
        console.log(error.message);
    }
}

const loadContactUs = async (req, res) => {
    try {
        res.render('contactUs')
    }
    catch(error) {
        console.log(error.message);
    }
}

const loadHome = async (req, res) => {
    try {
        const products = await Products.find({ is_listed: true });
        res.render('home',{userAuthenticated: req.session.userid, products })
    }
    catch(error) {
        console.log(error.message);
    }
}

const loadProductDetails = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Products.findById(productId);
        res.render('productDetailsPage',{product})
    }
    catch(error) {
        console.log(error.message);
    }
}


module.exports ={
    loadRegister,
    insertUser,
    loadOTP,
    sendOTPVerificationEmail,
    // resendOtp,
    verifyOTP,
    verifyLogin,
    userLogout,
    loadLogin,
    loadHome,
    loadAboutUs,
    loadContactUs,
    loadProductDetails,
}