const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/Elegify");

const express = require("express");
const app = express();

const session = require('express-session');
const crypto = require("crypto");

const nocache = require('nocache');
app.use(nocache());

const path = require("path");

require("dotenv").config(); //FOR THE >ENV FILE

app.use(express.static(path.join(__dirname,'public')))

app.use(session({
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: true,
}))

//FOR USER ROUTES
const userRoute = require('./routes/userRoute');
app.use('/',userRoute);


//FOR admin ROUTES
const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute);

app.listen(4000, function() {
    console.log("Server Started...!!!");
});


