const Cart = require("../models/cartModel");
const Product = require('../models/productModel');
const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponModel");
const Wallet = require("../models/walletModel");

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


// const loadCart = async (req, res) => {
//     try {
//         let userId = req.session.userid;
//         const cartProduct = await Cart.find({ userid: userId }).populate({
//             path: "product.productid",
//             model: Product, // Use the actual Product model
//             select: 'name price image',
//         });
//         // Calculate the sum of total prices for the current user's cart
//         const grandTotal = cartProduct.reduce((acc, cartItem) => {
//             return acc + cartItem.product.reduce((acc, product) => {
//                 return acc + product.totalPrice;
//             }, 0);
//         }, 0);

//         res.render('cart', { cartProduct, grandTotal });

//     } catch (error) {
//         console.log(error);
//     }
// };

const loadCart = async (req, res) => {
    try {
        let userId = req.session.userid;
        const cart = await Cart.findOne({ userid: userId }).populate({
            path: "product.productid",
            model: Product, 
            select: 'name price image',
        });
        // console.log("cart: ", cart);

        
        if (!cart) {
            return res.render('cart', { cartProduct: [], subtotal: 0 });
        }

        const subtotal = cart.subTotal;
        const offerDiscount = cart.offerDiscount;

        res.render('cart', { cartProduct: cart.product, subtotal, offerDiscount });

    } catch (error) {
        console.log(error);
    }
};


const addToCart = async (req, res) => {
    try {
        const { productId, userId, quantity } = req.body;

        
        let userCart = await Cart.findOne({ userid: userId });

        if (!userCart) {
           
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

            cart.subTotal = cart.product.reduce((acc, cur) => acc + cur.totalPrice, 0);
            cart.grandTotal = cart.subTotal - cart.offerDiscount - cart.couponDiscount;

            await cart.save();

            res.status(200).json({ message: 'Product added to cart successfully', isProductInCart: false });
            return; 
        }

        
        const existingProduct = userCart.product.find(product => String(product.productid) === productId);

        
        const product = await Product.findById(productId);

        if (existingProduct) {
            
            existingProduct.quantity += parseInt(quantity);
            existingProduct.totalPrice = existingProduct.quantity * product.price;
        } else {
            
            userCart.product.push({
                productid: product._id,
                quantity: quantity,
                totalPrice: quantity * product.price,
                image: product.image[0],
            });
        }
        userCart.subTotal = userCart.product.reduce((acc, cur) => acc + cur.totalPrice, 0);
        userCart.grandTotal = userCart.subTotal - userCart.offerDiscount - userCart.couponDiscount;

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


// const loadCheckout = async(req, res) => {
//     try {
//         let userId = req.session.userid;

//         // Fetch user addresses
//         const user = await User.findById(userId);
//         const userAddresses = user.address;

//         // Fetch cart products
//         const checkoutProduct = await Cart.find({ userid: userId }).populate({
//             path: "product.productid",
//             model: Product, // Use the actual Product model
//             select: 'name price',
//         });
//         // res.render('checkout', {checkoutProduct});

//         // Calculate grand total
//         const grandTotal = checkoutProduct.reduce((acc, checkoutItem) => {
//             return acc + checkoutItem.product.reduce((acc, product) => {
//                 return acc + product.totalPrice;
//             }, 0);
//         }, 0);

//         console.log(grandTotal);

//         res.render('checkout', { checkoutProduct, grandTotal, userAddresses });

//     } catch (error) {
//         console.log(error);
//     }
// }

const loadCheckout = async (req, res) => {
    try {
        let userId = req.session.userid;

        
        const user = await User.findById(userId);
        const userAddresses = user.address;

        const wallet = await Wallet.findOne({ user: userId })

        const cart = await Cart.findOne({ userid: userId }).populate({
            path: "product.productid",
            model: Product, 
            select: 'name price',
        });

        
        
        if (!cart) {
            req.flash('error', 'Unable to proceed as your cart is empty.');
            res.redirect('/cart');
        }
        else{
            const subTotal = cart.subTotal;
            const couponDiscount = cart.couponDiscount
            const discount = cart.offerDiscount+cart.couponDiscount;
            const grandTotal = cart.grandTotal;
            const walletBalance = wallet.balance;

            res.render('checkout', { 
                checkoutProduct: cart.product, userAddresses, couponDiscount, subTotal, discount, grandTotal, 
                walletBalance: walletBalance 
            },);
        }
        

    } catch (error) {
        console.log(error);
    }
};

const removeFromCart = async (req, res) => {
    console.log("Inside the remove controller");
    try {
        const userId = req.session.userid;
        const productIdToRemove = req.params.productId;

        
        const userCart = await Cart.findOne({ userid: userId });

        if (userCart) {
            
            userCart.product = userCart.product.filter(product => String(product.productid) !== productIdToRemove);
            
            
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

        
        user.address.push({
            name: req.body.name,
            housename: req.body.housename,
            street: req.body.street,
            city: req.body.city,
            pin: req.body.pin,
            mobile: req.body.mobile
        });

        
        const savedUser = await user.save();

        res.status(200).json({ message: 'Address saved successfully', user: savedUser });
    } catch (error) {
        console.error('Error saving address:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// const placeOrder = async (req, res) => {
//     try {
//         const userId = req.session.userid;
//         const paymentMethod = req.body.paymentMethod;
//         const selectedAddress = req.body.selectedAddress;
//         const paymentId = req.body.paymentId;
//         const cartId = req.session.userid;

//         const cart = await Cart.findOne({ userid: cartId });
//         if (!cart) {
//             console.error('Cart not found for user:', userId);
//             return res.redirect('/error'); 
//         }
//         console.log("cart: ", cart);

//         const { offerDiscount, couponDiscount, subTotal, grandTotal } = cart;
    
//         const checkoutProduct = await Cart.find({ userid: req.session.userid }).populate({
//             path: "product.productid",
//             model: Product, 
//             select: 'name price image', 
//         });

//         // console.log("checkoutProduct: ", checkoutProduct);

//         const products = checkoutProduct.reduce((acc, checkoutItem) => {
//             return acc.concat(checkoutItem.product.map((product, index) => ({
//                 productid: product.productid._id,
//                 name: product.productid.name,
//                 price: product.productid.price,
//                 offerDiscount: product.productid.offerDiscount,
//                 quantity: product.quantity,
//                 total: product.totalPrice,
//                 orderStatus: 'Placed',
//                 image: product.productid.image[2],  
//             }
//             )));
//         }, []);

//         // console.log("products: ", products);

        
//         const user = await User.findById(req.session.userid).lean();

//         if (!user) {
            
//             console.error('User not found');
//             return res.redirect('/error');
//         }

//         const selectedAddressObj = user.address.find(address => address._id.toString() === selectedAddress);

//         if (!selectedAddressObj) {
            
//             console.error('Selected address not found');
//             return res.redirect('/error');
//         }

//         // const subtotal = products.reduce((acc, product) => acc + product.total, 0);
        
        
//         const shippingTimeMs = 7 * 24 * 60 * 60 * 1000;
//         const estimatedDeliveryDate = new Date(Date.now() + shippingTimeMs);
//         // console.log("estimatedDeliveryDate: ", estimatedDeliveryDate);

        
//         const orderId = generateOrderId();
        
//         const hashedOrderId = generateHash(orderId);

//         const orderData = {
//             hashedOrderId: hashedOrderId,
//             orderId: orderId,
//             userId: userId,
//             products: products,
//             paymentMode: paymentMethod,
//             paymentId: paymentId,
//             subTotal: subTotal,
//             offerDiscount: offerDiscount,
//             couponDiscount: couponDiscount,
//             grandTotal: grandTotal,
//             date: new Date(),
//             edd: estimatedDeliveryDate,
//             address:{
//                 name:selectedAddressObj.name,
//                 housename:selectedAddressObj.housename,
//                 street:selectedAddressObj.street,
//                 city:selectedAddressObj.city,
//                 pin:selectedAddressObj.pin,
//                 mobile:selectedAddressObj.mobile
//             },
    
//         };

//         const orderInstance = new Order(orderData);
//         await orderInstance.save(); 
       
//         await Cart.findOneAndDelete({ userid: req.session.userid });
        

        

//         for(const product of products){
//             try {
//                 const productInStock = await Product.findById(product.productid);
//                 if(productInStock){
                    
//                     productInStock.quantity -= product.quantity;
//                     await productInStock.save();
//                 } else {
//                     console.error(`Product with ID ${product.productid} not found in the stock database`);
//                 }
//             } catch (error) {
//                 console.error('Error updating product stock:', error);
                
//                 return res.status(500).json({ success: false, message: 'An error occurred while updating product stock.' });
//             }
//         }

//         res.status(200).json({ success: true, hashedOrderId });
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).json({ success: false, message: 'An error occurred while processing the order or updating product stock.' });
//     }
// }


const placeOrder = async (req, res) => {
    try {
        const userId = req.session.userid;
        const paymentMethod = req.body.paymentMethod;
        const selectedAddress = req.body.selectedAddress;
        const paymentId = req.body.paymentId;
        const cartId = req.session.userid;

        const cart = await Cart.findOne({ userid: cartId });
        if (!cart) {
            console.error('Cart not found for user:', userId);
            return res.redirect('/error');
        }

        const { offerDiscount, couponDiscount, subTotal, grandTotal } = cart;
        // console.log("offerDiscount: ", offerDiscount);
        // console.log("couponDiscount: ", couponDiscount);
        // console.log("subTotal: ", subTotal);
        // console.log("grandTotal: ", grandTotal);

        let paymentStatus;
        let paymentMessage;
        const generatedOrderId = generateOrderId();

        
        switch (paymentMethod) {
            case 'wallet':
                console.log("Wallet selected");
    
                
                try {
                    const wallet = await Wallet.findOne({ user: userId });
                    // console.log("wallet: ", wallet);
                    if (!wallet) {
                        console.log("Inside not wallet if condn");
                        throw new Error("Wallet not found for the user");
                    }

                    
                    if (wallet.balance >= grandTotal) {
                        wallet.balance -= grandTotal;
                        wallet.walletHistory.push({
                            amount: grandTotal,
                            type: "Debit",
                            reason: "Order Payment",
                            orderId2: generatedOrderId,
                            date: new Date()
                        });

                        await wallet.save();
                        console.log("Wallet saved");
                        paymentStatus = 'success'
                        
                    } else {
                        // console.log("Inside else condn for less balance");
                        throw new Error("Insufficient funds in the wallet");
                    }
                } catch (error) {
                    // console.log("Inside catch");
                    console.error("Error processing wallet payment:", error);
                }
                break;
            case 'razorpay':
                paymentStatus = 'success'
                break;
            case 'cod':
                paymentStatus = 'success'
                break;
            default:
                console.error('Invalid payment method:', paymentMethod);
                return res.status(400).json({ success: false, message: 'Invalid payment method' });
        }
        if (paymentStatus !== 'success') {
            console.log("Payment status not success");
            return res.status(400).json({ success: false, message: paymentMessage });
        }
        const checkoutProduct = await Cart.find({ userid: req.session.userid }).populate({
            path: "product.productid",
            model: Product,
            select: 'name price image',
        });

        const products = checkoutProduct.reduce((acc, checkoutItem) => {
            return acc.concat(checkoutItem.product.map((product, index) => ({
                productid: product.productid._id,
                name: product.productid.name,
                price: product.productid.price,
                offerDiscount: product.productid.offerDiscount,
                quantity: product.quantity,
                total: product.totalPrice,
                orderStatus: 'Placed',
                image: product.productid.image[2],
            })));
        }, []);
        const user = await User.findById(req.session.userid).lean();

        if (!user) {
            console.log("Inside not user if condn");
            console.error('User not found');
            return res.redirect('/error');
        }

        const selectedAddressObj = user.address.find(address => address._id.toString() === selectedAddress);

        if (!selectedAddressObj) {
            console.error('Selected address not found');
            return res.redirect('/error');
        }

        const shippingTimeMs = 7 * 24 * 60 * 60 * 1000;
        const estimatedDeliveryDate = new Date(Date.now() + shippingTimeMs);

        
        const hashedOrderId = generateHash(generatedOrderId);

        const orderData = {
            hashedOrderId: hashedOrderId,
            orderId: generatedOrderId,
            userId: userId,
            products: products,
            paymentMode: paymentMethod,
            paymentId: paymentId,
            subTotal: subTotal,
            offerDiscount: offerDiscount,
            couponDiscount: couponDiscount,
            grandTotal: grandTotal,
            date: new Date(),
            edd: estimatedDeliveryDate,
            address: {
                name: selectedAddressObj.name,
                housename: selectedAddressObj.housename,
                street: selectedAddressObj.street,
                city: selectedAddressObj.city,
                pin: selectedAddressObj.pin,
                mobile: selectedAddressObj.mobile
            },
        };

        const orderInstance = new Order(orderData);
        await orderInstance.save();

        await Cart.findOneAndDelete({ userid: req.session.userid });

        for (const product of products) {
            try {
                const productInStock = await Product.findById(product.productid);
                if (productInStock) {
                    productInStock.quantity -= product.quantity;
                    await productInStock.save();
                } else {
                    console.error(`Product with ID ${product.productid} not found in the stock database`);
                }
            } catch (error) {
                console.error('Error updating product stock:', error);
                return res.status(500).json({ success: false, message: 'An error occurred while updating product stock.' });
            }
        }
        // console.log("Just above the order success");
        res.status(200).json({ success: true, hashedOrderId });
    } catch (error) {
        console.log("Inside last catch");
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing the order or updating product stock.' });
    }
};



function generateOrderId() {
    const timestamp = Date.now().toString(); 
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
                reject(err); 
            } else {
                resolve(order); 
            }
        });
    });
};

const loadOrderConfirmation = async (req, res) => {
    try {
        const hashedOrderId = req.params.Id;
        // console.log("req.params.id: ", req.params.Id);
        // console.log("hashedOrderId: ", hashedOrderId);
        
        const order = await Order.findOne({ hashedOrderId:hashedOrderId });
        // console.log("order: ", order);

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