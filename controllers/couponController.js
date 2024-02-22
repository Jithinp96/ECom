const Users = require("../models/userModel");
const Orders = require("../models/orderModel")
const Products = require("../models/productModel")
const Coupon = require("../models/couponModel")


const loadCouponPage = async (req, res) => {
    try {
        // Fetch all coupons from the database
        const coupons = await Coupon.find();

        // Pass the fetched coupons to the EJS template for rendering
        res.render("couponList", { coupons });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

const loadAddCoupon = async (req, res) => {
    try {
        res.render("addcoupon")
    } catch (error) {
        console.log(error);
    }
}

const addCoupon = async (req, res) => {
    try {
        // Create a new Coupon instance with data from the form
        const newCoupon = new Coupon({
            couponName: req.body.couponName,
            couponCode: req.body.couponCode,
            discountPercentage: req.body.discountPercentage,
            minAmount: req.body.minAmount,
            couponDescription: req.body.couponDescription,
            expiryDate: req.body.expiryDate
        });

        // Save the new coupon to the database
        const savedCoupon = await newCoupon.save();
        res.redirect('/admin/coupon');
        // res.status(201).json(savedCoupon);
    } catch (err) {
        console.error('Error saving coupon:', err.message);
        res.status(500).send('Internal Server Error');
    }
}

const deleteCoupon = async (req, res) => {
    const couponId = req.params.id;
    // console.log("Delete couponId: ", couponId);
    try {
        // Find the coupon by ID and delete it from the database
        await Coupon.findByIdAndDelete(couponId);
        res.sendStatus(204); // Send a "No Content" response if successful
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    loadCouponPage,
    loadAddCoupon,
    addCoupon,
    deleteCoupon,
}