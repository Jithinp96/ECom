const User = require('../models/userModel');
const bcrypt = require('bcrypt');

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
    }
    catch(error) {
        console.log(error.message);
    }
}

const loadOtp = async (req, res) => {
    try {
        res.render('otpVerification')
    }
    catch(error) {
        console.log(error.message);
    }
}

const insertUser = async (req, res) => {


    try{

        const exist = await User.findOne({email:req.body.email})

        if(exist){
            res.render('registration', {message: "Your registration has been failed...!!!"});
        }else{

        

        const spassword = await securePassword(req.body.password);

    
        
        const user = User({
            email: req.body.email,
            name: req.body.name,
            mobile:req.body.mobile,
            password: spassword,
            is_admin: 0
        });

        const userData = await user.save();

        if(userData){
            res.redirect('./login')
        }
        else{
            res.render('registration', {message: "Your registration has been failed...!!!"});
        }
    }
    } catch(error){
        console.log(error.message);
    }
}

const verifyLogin = async(req, res) => {
    try{
        console.log(req.body);
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({email: email});
        
        if(userData){
            const passwordMatch = await bcrypt.compare(password, userData.password);
            
            if(passwordMatch){
                // if(userData.is_verified === 0){
                //     res.render('home');

                // }
                // else{
                    console.log("hello");
                    req.session.user_id = userData._id;
                    res.redirect('/home');
                // }
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
        req.session.destroy();
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
        res.render('home')
    }
    catch(error) {
        console.log(error.message);
    }
}

module.exports ={
    loadRegister,
    insertUser,
    verifyLogin,
    userLogout,
    loadLogin,
    loadHome,
    loadAboutUs,
    loadContactUs,
    loadOtp
}