const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
// const userAuth = require("../middlewares/userAuth")
const Order = require("../models/orderModel");
const mongoose = require('mongoose');
const crypto = require('crypto');

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


const loadForgotPassword = async (req, res) => {
    try {
        res.render('forgotpassword');
    } catch (error) {
        console.log(error);
    }
}

const sendResetPasswordOTP = async (email) => {
    try {
        

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'jithinyt07@gmail.com',
                pass: 'wlxw pbyh qrxj clna'
            }
        });

        // Generate a random OTP
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        console.log(otp);

        // Mail options
        const mailOptions = {
            from: 'jithinyt07@gmail.com',
            to: email,
            subject: 'Reset Your Password',
            html: `Your OTP to reset your password is: <strong>${otp}</strong>. This OTP will expire in 1 minutes.`
        };

        // Hash the OTP for security
        const hashedOTP = await bcrypt.hash(otp, 10);

        // Save hashed OTP in the database
        const newOTPVerification = new UserOTPVerification({ email: email, otp: hashedOTP });
        await newOTPVerification.save();

        // Send email
        await transporter.sendMail(mailOptions);

        console.log('Reset password OTP sent successfully.');
    } catch (error) {
        console.error('Error sending reset password OTP:', error);
        throw error;
    }
};

const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        // Check if the email exists in the User schema
        const user = await User.findOne({ email : email });
        // console.log("User details found: "+ user);
        if (!user) {
             // If the email address is not registered, render the forgot password page with a message
             return res.status(400).send('Email address not registered');
            }
        else{
            await sendResetPasswordOTP(email);
            res.sendStatus(200);
        }
        
    } catch (error) {
        console.error('Error sending reset password OTP:', error);
        res.status(500).send('Failed to send OTP');
    }
};

const verifyPasswordResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        console.log(email, otp);
        // Retrieve hashed OTP from the database based on the user's email
        const otpVerification = await UserOTPVerification.findOne({ email });

        if (!otpVerification) {
            return res.status(400).json({ error: 'OTP verification failed' });
        }

        // Compare the hashed OTP stored in the database with the hashed OTP entered by the user
        const isMatch = await bcrypt.compare(otp, otpVerification.otp);

        if (isMatch) {
            console.log('OTP verified successfully from userController');
            // OTP is verified successfully, redirect to reset password page
            res.redirect('/resetpassword');
        } else {
            // OTP verification failed, send error message
            res.status(400).json({ error: 'OTP verification failed' });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const loadResetPassword = async(req, res) => {
    try {
        res.render('resetpassword');
    } catch (error) {
        console.log(error);
    }
}


const updatePassword = async (req, res) => {
    try {
        console.log("Inside updatePassword controller");
        
        const { email } = req.query; // Extract email from query parameters
        const { newPassword } = req.body; // Extract newPassword from request body
        
        console.log("Email from query: " + email);
        console.log("New password: " + newPassword);

        // Update the user's password in the database
        const user = await User.findOneAndUpdate({ email }, { password: newPassword });
        
        if (!user) {
            return res.status(404).send('User not found');
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).send('Failed to update password');
    }
};

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
                }
                
            }
            else {
                res.render('login',{message:"Email or Password is Incorrect...!!!"});
            }
        }
        else{
            res.render('login',{message:"Email or Password is Incorrect...!!!"});
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

// const loadHome = async (req, res) => {
//     try {
//         const products = await Products.find({ is_listed: true });
//         res.render('home',{userAuthenticated: req.session.userid, products })
//     }
//     catch(error) {
//         console.log(error.message);
//     }
// }

const ITEMS_PER_PAGE = 4; // Adjust this according to our preference

const loadHome = async (req, res) => {
  const page = parseInt(req.query.page) || 1;

  try {
    const totalItems = await Products.countDocuments({ is_listed: true });
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const products = await Products.find({ is_listed: true })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render('home', { userAuthenticated: req.session.userid, products, currentPage: page, totalPages });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
}

// const loadProductDetails = async (req, res) => {
//     try {
//         const userId=req.session.userid
//         const productId = req.params.productId;
//         const product = await Products.findById(productId);
//         res.render('productDetailsPage',{product,userId})
//     }
//     catch(error) {
//         console.log(error.message);
//     }
// }

const loadProductDetails = async (req, res) => {
    try {
        const userId = req.session.userid;
        const productId = req.params.productId;

        // Check if productId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const product = await Products.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.render('productDetailsPage', { product, userId });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const loadUserProfile = async (req, res) => {
    try {
        const userId = req.session.userid;
        const user = await User.findById(userId);
        const userAddress = user.address;

        const order = await Order.find({userid: userId}).populate({
            path: 'products.productid',
            model: Order,
            select: 'name price quantity date image'
        })

        res.render('userprofile', { user, userAddress, order });
    } catch (error) {
        console.log(error);
    }
}

const addAddress = async(req, res) => {
    try {
        const user = await User.findById(req.session.userid)

        // Add the address details to the user's address array
        user.address.push({
            name: req.body.name,
            housename: req.body.housename,
            street: req.body.street,
            city: req.body.city,
            pin: req.body.pin,
            mobile: req.body.mobile
        });

        // Save the user with the new address to MongoDB
        const savedUser = await user.save();

        res.status(200).json({ message: 'Address saved successfully', user: savedUser });
    } catch (error) {
        console.error('Error saving address:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.userid;
        const addressId = req.params.addressId;

        // Find the user and remove the specified address
        const user = await User.findById(userId);
        user.address.pull({ _id: addressId });
        await user.save();

        res.json({ success: true, message: 'Address deleted successfully.' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ success: false, message: 'Failed to delete address.' });
    }
};

module.exports ={
    loadRegister,
    insertUser,
    loadOTP,
    sendOTPVerificationEmail,
    // resendOtp,
    verifyOTP,
    loadForgotPassword,
    sendResetPasswordOTP,
    sendOTP,
    verifyPasswordResetOTP,
    loadResetPassword,
    updatePassword,
    verifyLogin,
    userLogout,
    loadLogin,
    loadHome,
    loadAboutUs,
    loadContactUs,
    loadProductDetails,
    loadUserProfile,
    addAddress,
    deleteAddress
}