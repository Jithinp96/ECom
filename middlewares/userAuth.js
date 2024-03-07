const Users = require("../models/userModel");
const Category = require("../models/categoryModel");

const isLogin = async(req, res, next) => {
    try{
        if(req.session.userid){
            next();
        }
        else {
            res.redirect('/login');
        }
    } catch(error) {
        console.log(error.message);
    }
}

const isLogout = async(req, res, next) => {
    try{
        
        if(!req.session.userid){
            next();
        }else{
            res.redirect('/');
        }
    } catch(error) {
        console.log(error.message);
    }
}

const isAuthenticated = async (req, res, next) => {
    try {
        if (req.session && req.session.userid) {
            res.locals.userAuthenticated = true;
            return next();
        } else {
            res.locals.userAuthenticated = false;
            return next();
        }
    } catch (error) {
        console.log(error);
    }
};

const checkBlockedStatus = async (req, res, next) => {
    try {
        const userId = req.session.userid;
        // console.log("userId", userId);

        if (userId) {
            const userData = await Users.findById(userId);
            // console.log("userData: ", userData);

            if (userData && userData.is_blocked) {
                // Log out the user and redirect to the login page
                req.session.userid = null;
                //req.flash('error', 'Admin has blocked this account. Please contact support for assistance.');
                return res.redirect('/login');
            }
        }

        next();
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


const loadCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({ is_listed: true });
        res.locals.categories = categories;

        next();
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = {
    isLogin,
    isLogout,
    isAuthenticated,
    checkBlockedStatus,
    loadCategories,
}