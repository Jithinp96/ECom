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

// ========== FOR VIEWING LOGIN OR USER PROFILE OPTION ON NAVBAR ===========
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

// ========== FOR CHECKING WHETHER A USER IS BLOCKED OR NOT ===========
const checkBlockedStatus = async (req, res, next) => {
    try {
        const userId = req.session.userid;
        if (userId) {
            const userData = await Users.findById(userId);

            if (userData && userData.is_blocked) {
                req.session.userid = null;
                return res.redirect('/login');
            }
        }
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
}