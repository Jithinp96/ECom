const Cart = require("../models/cartModel");
const Product = require('../models/productModel');
const User = require("../models/userModel");
const Wishlist = require("../models/wishlistModel");


const loadWishlist = async (req, res) => {
    try {
        let userId = req.session.userid;
        const wishlistProduct = await Wishlist.find({ userid: userId }).populate({
            path: "product.productid",
            model: Product, // Use the actual Product model
            select: 'name price quantity image',
        });
        res.render('user/wishlist', {wishlistProduct})
    } catch (error) {
        console.log(error);
    }
}

const addToWishlist = async (req, res) => {
    try {
        const { productId, userId } = req.body;

        // Check if the product already exists in the wishlist
        const existingProduct = await Wishlist.findOne({ userid: userId, 'product.productid': productId });

        if (existingProduct) {
            return res.status(400).json({ message: 'Product already exists in the wishlist' });
        }

        // If the product doesn't exist, add it to the wishlist
        const wishlistItem = {
            productid: productId,
            image: 'URL of the product image' // You need to define how you'll get the image URL
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

const removeFromWishlist = async (req, res) => {
    try {
        const productId = req.params.productId
        const userId = req.session.userid;

        // Find the wishlist for the user
        const userWishlist = await Wishlist.findOne({ userid: userId });

        if (userWishlist) {
            // Remove the product from the product array
            userWishlist.product = userWishlist.product.filter(product => String(product.productid) !== productId);
            
            // Save the updated wishlist
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