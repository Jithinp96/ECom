const Users = require("../models/userModel");
const Orders = require("../models/orderModel")
const bcrypt = require("bcrypt");
const adminAuth = require("../middlewares/adminAuth");

const loadAdminLogin = async(req, res) => {
    try {
        res.render('adminLogin');
    } catch (error) {
        console.log(error);
    }
}

const adminVerifyLogin = async(req, res) => {
    try{
        const adminEmail = req.body.adminEmail;
        const adminPassword = req.body.adminPassword;
        
        if(adminEmail == process.env.adminEmail && adminPassword == process.env.adminPassword){
            // Session variable for the authenticated admin
            req.session.admin = {email: adminEmail};
            res.redirect('/admin/dashboard');
    
        }
        else{
            res.render('adminLogin',{message:"Email and Password is incorrect...!!!"});
        }
    } catch (error) {
        console.log(error);
    }
}




// const adminLogout = async (req, res) => {
//     try {
//         req.session.admin = null
//         res.redirect('/admin');
        
//     } catch (error) {
//         console.log(error.message);
//     }
// }

const loadUserList = async (req,res) => {
    try{
        const users = await Users.find()
        res.render('userList',{ users: users});
    } catch (error) {
        console.log(error);
    }
    
}

const toggleUserStatus = async (req, res) => {
    try {
        // console.log("inside toggle fn top");
        const userId = req.params.id;
        const user = await Users.findById(userId);

        if (user) {
            user.is_blocked = !user.is_blocked;
            await user.save();

            res.json({ success: true, message: 'User status toggled successfully', isBlocked: user.is_blocked });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
    }
};


module.exports ={
    loadAdminLogin,
    adminVerifyLogin,
    loadUserList,
    toggleUserStatus,
    // adminLogout
}