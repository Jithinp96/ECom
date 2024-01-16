const express = require("express");
const admin_route = express();

admin_route.set('view engine', 'ejs');
admin_route.set('views','./views/admin');

const bodyParser = require("body-parser");
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));

const adminController = require("../controllers/adminController");

admin_route.get('/login',adminController.loadAdminLogin);
admin_route.post('/login',adminController.adminVerifyLogin);

admin_route.get('/dashboard', adminController.loadDashboard);
admin_route.get('/userlist', adminController.loadUserList);

module.exports = admin_route;