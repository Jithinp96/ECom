const Cart = require("../models/cartModel");
const Product = require('../models/productModel');
const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');


const instance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret:process.env.RAZORPAY_SECRET_KEY,
  });
  
  
function generateHash(data) {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
}  


const loadCart = async (req, res) => {
    try {
        let userId = req.session.userid;
        const cartProduct = await Cart.find({ userid: userId }).populate({
            path: "product.productid",
            model: Product, // Use the actual Product model
            select: 'name price image',
        });
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
        let userCart = await Cart.findOne({ userid: userId });

        if (!userCart) {
            // If the user doesn't have a cart, create a new one
            const product = await Product.findById(productId);
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
            return; // Exit the function early
        }

        // Find the product in the cart
        const existingProduct = userCart.product.find(product => String(product.productid) === productId);

        // Find the product details
        const product = await Product.findById(productId);

        if (existingProduct) {
            // If the product already exists in the cart, update the quantity
            existingProduct.quantity += parseInt(quantity);
            existingProduct.totalPrice = existingProduct.quantity * product.price;
        } else {
            // If the product doesn't exist in the cart, add a new entry
            userCart.product.push({
                productid: product._id,
                quantity: quantity,
                totalPrice: quantity * product.price,
                image: product.image[0],
            });
        }

        await userCart.save();

        res.status(200).json({ message: 'Product added to cart successfully', isProductInCart: !!existingProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// const checkCartStatus = async (req, res) => {
//     try {
//         const { productId, userId } = req.body;

//         // Check if productId is a valid ObjectId
//         if (!mongoose.Types.ObjectId.isValid(productId)) {
//             return res.status(400).json({ error: 'Invalid product ID' });
//         }

//         // Find the user's cart
//         const userCart = await Cart.findOne({ userid: userId });

//         if (!userCart) {
//             return res.status(200).json({ isProductInCart: false });
//         }

//         // Check if the product exists in the cart
//         const isProductInCart = userCart.product.some(product => String(product.productid) === productId);

//         res.status(200).json({ isProductInCart });
//     } catch (error) {
//         console.error('Error checking cart status:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };


const loadCheckout = async(req, res) => {
    try {
        let userId = req.session.userid;

        // Fetch user addresses
        const user = await User.findById(userId);
        const userAddresses = user.address;

        // Fetch cart products
        const checkoutProduct = await Cart.find({ userid: userId }).populate({
            path: "product.productid",
            model: Product, // Use the actual Product model
            select: 'name price',
        });
        // res.render('checkout', {checkoutProduct});

        // Calculate grand total
        const grandTotal = checkoutProduct.reduce((acc, checkoutItem) => {
            return acc + checkoutItem.product.reduce((acc, product) => {
                return acc + product.totalPrice;
            }, 0);
        }, 0);

        console.log(grandTotal);

        res.render('checkout', { checkoutProduct, grandTotal, userAddresses });

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

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.userid;
        const paymentMethod = req.body.paymentMethod;
        const selectedAddress = req.body.selectedAddress;
        const paymentId = req.body.paymentId;
        const cartId = req.session.userid;
        // const cart = await Cart.findOne({ userid: cartId });

        const checkoutProduct = await Cart.find({ userid: req.session.userid }).populate({
            path: "product.productid",
            model: Product, // Use the actual Product model
            select: 'name price image', 
        });

        // console.log("checkoutProduct: ", checkoutProduct);

        const products = checkoutProduct.reduce((acc, checkoutItem) => {
            return acc.concat(checkoutItem.product.map((product, index) => ({
                productid: product.productid._id,
                name: product.productid.name,
                price: product.productid.price,
                quantity: product.quantity,
                total: product.totalPrice,
                orderStatus: 'Placed',
                image: product.productid.image[0],  
            }
            )));
        }, []);

        // console.log("products: ", products);

        // Find the user by ID and retrieve the selected address
        const user = await User.findById(req.session.userid).lean();

        if (!user) {
            // Handle the case where the user is not found
            console.error('User not found');
            return res.redirect('/error');
        }

        const selectedAddressObj = user.address.find(address => address._id.toString() === selectedAddress);

        if (!selectedAddressObj) {
            // Handle the case where the selected address is not found
            console.error('Selected address not found');
            return res.redirect('/error');
        }

        // console.log("userId: ", userId);
        // console.log(("user: ", user));
        

        const subtotal = products.reduce((acc, product) => acc + product.total, 0);

        // Generate a unique order ID
        const orderId = generateOrderId();
        // Hash the order ID
        const hashedOrderId = generateHash(orderId);

        const orderData = {
            hashedOrderId: hashedOrderId,
            orderId: orderId,
            userId: userId,
            products: products,
            paymentMode: paymentMethod,
            paymentId: paymentId,
            subtotal: subtotal,
            date: new Date(),
            address:{
                name:selectedAddressObj.name,
                housename:selectedAddressObj.housename,
                street:selectedAddressObj.street,
                city:selectedAddressObj.city,
                pin:selectedAddressObj.pin,
                mobile:selectedAddressObj.mobile
            },
    
        };

        const orderInstance = new Order(orderData);
        await orderInstance.save(); // Save the order to the database

        // Clear the user's cart after placing the order
        // await Cart.deleteOne({ userid: userId });

        res.status(200).json({ success: true, hashedOrderId });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing the order or updating product stock.' });
    }
}

// Function to generate a unique order ID (OD + timestamp + random number)
function generateOrderId() {
    const timestamp = Date.now().toString(); // Get the current timestamp in milliseconds
    const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0'); // Generate a random 6-digit number
    return `OD${timestamp}${randomDigits}`;
}

const verifyPayment = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { payment, order } = req.body;
        const orderId = order.receipt;

        const crypto = require('crypto');
        let hmac = crypto.createHmac('sha256', 'XEwHXRnbP4kAiT17e5nWBbLk');
        hmac.update(payment.razorpay_order_id + '|' + payment.razorpay_payment_id);
        hmac = hmac.digest('hex');

        if (hmac === payment.razorpay_signature) {
            const orderDetails = await Order.findById(orderId);

            if (!orderDetails) {
                console.error('Order not found:', orderId);
                return res.status(404).json({ error: 'Order not found' });
            }

            orderDetails.paymentStatus = "Razorpay";
            await orderDetails.save();

            const cartDeleteResult = await Cart.deleteOne({ userid: userId });

            if (!cartDeleteResult.ok) {
                console.error('Error deleting cart items for user:', userId);
                return res.status(500).json({ error: 'Error deleting cart items' });
            }

            return res.json({ payment: true });
        } else {
            console.error('Razorpay signature mismatch');
            return res.status(400).json({ error: 'Razorpay signature mismatch' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({ error: 'Error verifying payment' });
    }
};


const generateRazorpay = (orderid, adjustedAmount) => {
    return new Promise((resolve, reject) => {
        const options = {
            amount: adjustedAmount,
            currency: "INR",
            receipt: "" + orderid
        };
        instance.orders.create(options, function (err, order) {
            if (err) {
                console.error("Error generating Razorpay order:", err);
                reject(err); // Reject the promise with the error object
            } else {
                resolve(order); // Resolve the promise with the order object
            }
        });
    });
};

const loadOrderConfirmation = async (req, res) => {
    try {
        const hashedOrderId = req.params.Id;
        console.log("req.params.id: ", req.params.Id);
        console.log("hashedOrderId: ", hashedOrderId);
        // Fetching order details from the database using the hashed order ID
        const order = await Order.findOne({ hashedOrderId:hashedOrderId });
        console.log("order: ", order);

        const user = await User.findById(order.userId);
        // console.log("user: ", user);
        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }
        res.render('orderconfirmation', { order,  user});
    } catch (error) {
        console.log(error);
        res.status(500).render('error', { message: 'Internal server error' });
    }
}

module.exports = {
    loadCart,
    addToCart,
    // checkCartStatus,
    loadCheckout,
    removeFromCart,
    checkoutAddAddress,
    generateRazorpay,
    placeOrder,
    verifyPayment,
    loadOrderConfirmation,
}