const bcrypt = require("bcrypt");

const loadAdminLogin = async(req, res) => {
    try {
        res.render('adminLogin');
    } catch (error) {
        console.log(error.message);
    }
}

const adminVerifyLogin = async(req, res) => {
    try{
        const adminEmail = req.body.adminEmail;
        const adminPassword = req.body.adminPassword;
        
        if(adminEmail == process.env.adminEmail){
            
            if(adminPassword == process.env.adminPassword){
                    res.redirect('/admin/dashboard');
            }
            else {
                res.render('adminLogin',{message:"Email and Password is incorrect...!!!"});
            }
        }
        else{
            res.render('adminLogin',{message:"Email and Password is incorrect...!!!"});
        }

    } catch (error) {
        console.log(error.message);
    }
}


const loadDashboard = async (req,res) => {
    try{
        res.render('adminDashboard');
    } catch (error) {
        console.log(message.error);
    }
    
}


const loadUserList = async (req,res) => {
    try{
        res.render('userList');
    } catch (error) {
        console.log(message.error);
    }
    
}

module.exports ={
    loadAdminLogin,
    adminVerifyLogin,
    loadDashboard,
    loadUserList
}