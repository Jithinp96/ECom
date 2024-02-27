const express = require("express");
const mongoose = require("mongoose");
const session = require('express-session')
const flash = require('express-flash');
const nocache = require('nocache');
const app = express();
const path = require("path");
require("dotenv").config(); 
app.use(express.json());
app.use(nocache());

mongoose.connect(process.env.mongodblink);





app.use(express.static(path.join(__dirname,'public')))
app.use(express.static(path.join(__dirname,'public/uploads')))

app.use(session({
  secret: 'SECRET_KEY', // Change this to a long, random string
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));
app.use(flash());

//FOR USER ROUTES
const userRoute = require('./routes/userRoute');
app.use('/',userRoute);


//FOR admin ROUTES
const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute);

app.listen(4000, function() {
    console.log("Server Started...!!!");
});


