const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishlistModel");

// ========== MIDDLEWARE TO FETCH CART AND WISHLIST COUNT TO SHOW ON NAVBAR ===========
const fetchCartAndWishlistCounts = async (req, res, next) => {
    try {
        const totalCartItems = await Cart.findOne({ userid: req.session.userid })
            .select('product')
            .lean();

        if (totalCartItems) {
            const totalQuantity = totalCartItems.product.reduce((total, item) => total + item.quantity, 0);
            res.locals.cartCount = totalQuantity;
        } else {
            res.locals.cartCount = 0;
        }
        
        const totalWishlistItems = await Wishlist.findOne({ userid: req.session.userid })
            .select('product')
            .lean();

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
