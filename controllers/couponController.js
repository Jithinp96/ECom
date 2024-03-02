const User = require("../models/userModel");
const Orders = require("../models/orderModel")
const Product = require("../models/productModel")
const Coupon = require("../models/couponModel")
const Cart = require("../models/cartModel");

const loadCouponPage = async (req, res) => {
    try {
        
        const coupons = await Coupon.find();

        
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
        
        const {
            couponCode,
            discountAmount,
            minOrderAmount,
            couponDescription,
            startDate,
            expiryDate,
        } = req.body;
      
        const newCoupon = new Coupon({
            couponCode: couponCode,
            discountAmount: discountAmount,
            minOrderAmount: minOrderAmount,
            couponDescription: couponDescription,
            startDate: startDate,
            expiryDate: expiryDate,
            active: true,
        });
        const newCouponSaved = await newCoupon.save();
        res.redirect('/admin/coupon');
        // res.status(201).json(savedCoupon);
    } catch (err) {
        console.error('Error saving coupon:', err.message);
        res.status(500).send('Internal Server Error');
    }
}

const deleteCoupon = async (req, res) => {
    const couponId = req.params.id;
    try {
        
        await Coupon.findByIdAndDelete(couponId);
        res.sendStatus(204); 
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}


// apply coupon
const applyCoupon = async (req, res) => {
    try {
        const userId = req.session.userid;
        const currentUser = await User.findOne({ _id: userId });
        const { couponCode } = req.body;
        const userCart = await Cart.findOne({ userid: userId }).populate(
            "product.productid"
        );
        const product = userCart.product;
        const usedCoupon = await Coupon.findOne({
            couponCode: couponCode,
            userUsed: { $in: [userId] },
        });

        if (usedCoupon) {
            console.log("Already used coupon");
            
            return res.json({ used: true, message: "Coupon is already used" });
        }
    
        const currentCoupon = await Coupon.findOne({
            couponCode: couponCode,
        });
    
        const totalAmount = product.reduce(
            (total, product) => total + product.totalPrice,
            0
        );
        const lastPrice = totalAmount - currentCoupon.discountAmount;
    
        if (currentCoupon) {

            const today = new Date();
            const couponStartDate = new Date(currentCoupon.startDate);
            const couponEndDate = new Date(currentCoupon.expiryDate);
    
            if (today >= couponStartDate && today <= couponEndDate) {
                if (totalAmount >= currentCoupon.minOrderAmount) {
                    const changeTotalPrice = totalAmount - currentCoupon.discountAmount;
                    const updatedGrandTotal = changeTotalPrice;
                    const updatedCart = await Cart.findOneAndUpdate(
                        { userid: userId },
                        { $set: { 
                            couponDiscount: currentCoupon.discountAmount,
                            grandTotal: updatedGrandTotal
                        } },
                        { new: true }
                    );
                    return res.json({ success: true, totalPrice: changeTotalPrice ,message : 'Coupon applied successfully'}); // Return to avoid multiple responses
                } else {
                    
                    return res.json({
                    limit: true,
                    message: `Total amount must be above ₹${currentCoupon.minOrderAmount}`,
                    });
                }
            } else {
                console.log("Coupon Expired else");
                return res.json({ expired: true, message: "Coupon is expired" });
            }
        } else {
            console.log("Coupon not found else");
            return res.json({ CodeErr: true, message: "Coupon not found" });
        }
        } catch (error) {
            console.log("Catch part");
            console.error(error);
            return res.json({ CodeErr: true, message: "Coupon not found" });
        }
  };

const removeCoupon = async (req, res) => {
    const userId = req.session.userid;

    try {
        const updatedCart = await Cart.findOneAndUpdate(
            { userid: userId },
            { $set: { couponDiscount: 0 } },
            { new: true }
        );

        if (!updatedCart) {
            throw new Error('Cart not found');
        }

        const { subTotal, offerDiscount, couponDiscount } = updatedCart;
        const newGrandTotal = subTotal - offerDiscount - couponDiscount;

        
        updatedCart.grandTotal = newGrandTotal;
        await updatedCart.save();
        res.json({ message: 'Coupon removed successfully', updatedCart: updatedCart });
    } catch (error) {
        console.error("Error removing coupon:", error);
        res.status(500).json({ error: 'Error removing coupon' });
    }
}

module.exports = {
    loadCouponPage,
    loadAddCoupon,
    addCoupon,
    deleteCoupon,
    applyCoupon,
    removeCoupon,
}