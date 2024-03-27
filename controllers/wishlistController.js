const Cart = require("../models/cartModel");
const Product = require('../models/productModel');
const User = require("../models/userModel");
const Wishlist = require("../models/wishlistModel");

// ========== FOR LOADING WISHLIST PAGE ===========
const loadWishlist = async (req, res) => {
    try {
        let userId = req.session.userid;
        const wishlistProduct = await Wishlist.find({ userid: userId }).populate({
            path: "product.productid",
            model: Product, 
            select: 'name price quantity image',
        });
        res.render('user/wishlist', {wishlistProduct, userId})
    } catch (error) {
        console.log("Error in catch", error);
    }
}

// ========== FOR ADDING A PRODUCT TO WISHLIST ===========
const addToWishlist = async (req, res) => {
    try {
        const { productId, userId } = req.body;
        const existingProduct = await Wishlist.findOne({ userid: userId, 'product.productid': productId });

        if (existingProduct) {
            return res.status(400).json({ message: 'Product already exists in the wishlist' });
        }

        const wishlistItem = {
            productid: productId,
        
        };

        await Wishlist.findOneAndUpdate(
            { userid: userId },
            { $push: { product: wishlistItem } },
            { upsert: true }
        );

        res.json({ message: 'Product added to wishlist successfully' });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ========== FOR REMOVING AN ITEM FROM WISHLIST ===========
const removeFromWishlist = async (req, res) => {
    try {
        const productId = req.params.productId
        const userId = req.session.userid;

        const userWishlist = await Wishlist.findOne({ userid: userId });

        if (userWishlist) {
            userWishlist.product = userWishlist.product.filter(product => String(product.productid) !== productId);
            await userWishlist.save();

            res.status(200).json({ message: 'Product removed from wishlist successfully' });
        } else {
            res.status(404).json({ error: 'Wishlist not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    loadWishlist,
    addToWishlist,
    removeFromWishlist,
}