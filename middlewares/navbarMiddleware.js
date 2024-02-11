const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishlistModel");

// Middleware to fetch cart and wishlist counts to view on the navbar
const fetchCartAndWishlistCounts = async (req, res, next) => {
    try {
        //Count the total number of products in the cart and wishlist
        const totalCartItems = await Cart.findOne({ userid: req.session.userid })
            .select('product')
            .lean(); // lean() is to convert mongoose document to plain JavaScript object

        // Check if a cart document was found
        if (totalCartItems) {
            const totalQuantity = totalCartItems.product.reduce((total, item) => total + item.quantity, 0);
            res.locals.cartCount = totalQuantity;
        } else {
            res.locals.cartCount = 0;
        }
        
        const totalWishlistItems = await Wishlist.findOne({ userid: req.session.userid })
            .select('product')
            .lean();

        // Check if a wishlist document was found
        if (totalWishlistItems) {
            const wishlistItemCount = totalWishlistItems.product.length;
            res.locals.wishlistCount = wishlistItemCount;
        } else {
            res.locals.wishlistCount = 0; 
        }

        next();
    } catch (error) {
        next(); 
    }
};


module.exports = {
    fetchCartAndWishlistCounts
}
