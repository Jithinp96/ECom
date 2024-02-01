const Cart = require("../models/cartModel");
const Product = require('../models/productModel');
const User = require("../models/userModel");

const loadCart = async (req, res) => {
    try {
        let userId = req.session.userid;
        const cartProduct = await Cart.find({ userid: userId }).populate({
            path: "product.productid",
            model: Product, // Use the actual Product model
            select: 'name price image',
        });
        // console.log("Cart Product:", cartProduct);

        // res.render('cart', { cartProduct });

        // Calculate the sum of total prices for the current user's cart
        const grandTotal = cartProduct.reduce((acc, cartItem) => {
            return acc + cartItem.product.reduce((acc, product) => {
                return acc + product.totalPrice;
            }, 0);
        }, 0);

        res.render('cart', { cartProduct, grandTotal });

    } catch (error) {
        console.log(error);
    }
};

const addToCart = async (req, res) => {
    try {
        const { productId, userId, quantity } = req.body;

        // Find the cart for the user
        const userCart = await Cart.findOne({ userid: userId });

        // Find the product in the cart
        const existingProduct = userCart.product.find(product => String(product.productid) === productId);

        // Find the product details
        const product = await Product.findOne({ _id: productId });

        if (!userCart) {
            // If the user doesn't have a cart, create a new one
            const cart = new Cart({
                userid: userId,
                product: [
                    {
                        productid: product._id,
                        quantity: quantity,
                        totalPrice: quantity * product.price,
                        image: product.image[0],
                    },
                ],
            });

            await cart.save();

            res.status(200).json({ message: 'Product added to cart successfully', isProductInCart: false });
        } else if (existingProduct) {
            // If the product already exists in the cart, update the quantity
            existingProduct.quantity += parseInt(quantity);
            existingProduct.totalPrice = existingProduct.quantity * product.price;

            await userCart.save();

            res.status(200).json({ message: 'Product added to cart successfully', isProductInCart: true });
        } else {
            // If the product doesn't exist in the cart, add a new entry
            userCart.product.push({
                productid: product._id,
                quantity: quantity,
                totalPrice: quantity * product.price,
                image: product.image[0],
            });

            await userCart.save();

            res.status(200).json({ message: 'Product added to cart successfully', isProductInCart: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const loadCheckout = async(req, res) => {
    try {
        let userId = req.session.userid;
        const checkoutProduct = await Cart.find({ userid: userId }).populate({
            path: "product.productid",
            model: Product, // Use the actual Product model
            select: 'name price',
        });
        // res.render('checkout', {checkoutProduct});

        const grandTotal = checkoutProduct.reduce((acc, checkoutItem) => {
            return acc + checkoutItem.product.reduce((acc, product) => {
                return acc + product.totalPrice;
            }, 0);
        }, 0);

        res.render('checkout', { checkoutProduct, grandTotal });

    } catch (error) {
        console.log(error);
    }
}

const removeFromCart = async (req, res) => {
    try {
        const userId = req.session.userid;
        const productIdToRemove = req.params.productId;

        // Find the cart for the user
        const userCart = await Cart.findOne({ userid: userId });

        if (userCart) {
            // Remove the product from the product array
            userCart.product = userCart.product.filter(product => String(product.productid) !== productIdToRemove);
            
            // Save the updated cart
            await userCart.save();

            res.status(200).json({ message: 'Product removed from cart successfully' });
        } else {
            res.status(404).json({ error: 'Cart not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const checkoutAddAddress = async(req, res) => {
    try {
        const user = await User.findById(req.session.userid)

        // Add the address details to the user's address array
        user.address.push({
            name: req.body.name,
            housename: req.body.housename,
            street: req.body.street,
            city: req.body.city,
            pin: req.body.pin,
            mobile: req.body.mobile
        });

        // Save the user with the new address to MongoDB
        const savedUser = await user.save();

        res.status(200).json({ message: 'Address saved successfully', user: savedUser });
    } catch (error) {
        console.error('Error saving address:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    loadCart,
    addToCart,
    loadCheckout,
    removeFromCart,
    checkoutAddAddress
}