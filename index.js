const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/Elegify");

const express = require("express");
const app = express();

const nocache = require('nocache');
app.use(nocache());

const path = require("path");

require("dotenv").config();

app.use(express.static(path.join(__dirname,'public')))

//FOR USER ROUTES
const userRoute = require('./routes/userRoute');
app.use('/',userRoute);

app.listen(4000, function() {
    console.log("Server Started...!!!");
});


