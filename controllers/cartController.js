const Cart = require("../models/cartModel");
const Product = require('../models/productModel');
const User = require("../models/userModel");
const Order = require("../models/orderModel");
// const Coupon = require("../models/couponModel");
const Wallet = require("../models/walletModel");

const Razorpay = require('razorpay');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');


const instance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret:process.env.RAZORPAY_SECRET_KEY,
  });
  

// ========== FOR GENERATING A HASHED ORDERID ===========
function generateHash(data) {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
}


// ========== FOR LOADING CART PAGE ===========
const loadCart = async (req, res) => {
    try {
        const userId = req.session.userid;
        const cart = await Cart.findOne({ userid: userId }).populate({
            path: "product.productid",
            model: 'Products', 
            select: 'name price image quantity',
        });

        if (!cart) {
            return res.render('user/cart', { cartProduct: [], subtotal: 0, offerDiscount: 0, cartId: null }); // Pass cartId as null when cart doesn't exist
        }

        const subtotal = cart.subTotal;
        const offerDiscount = cart.offerDiscount;

        res.render('user/cart', { cartProduct: cart.product, subtotal, offerDiscount, cartId: cart._id }); // Pass cartId to the template
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};


// ========== FOR ADDING PRODUCTS TO CART ===========
const addToCart = async (req, res) => {
    try {
        const { productId, userId, quantity } = req.body;
        let userCart = await Cart.findOne({ userid: userId });
        const product = await Product.findById(productId).populate('offer').populate('category', 'offer');
        const { bestOffer, bestOfferType } = await product.determineBestOffer();
       
        const offerDiscount = bestOffer ? product.price * (bestOffer.discountPercentage / 100) : 0;

        if (!userCart) {
            const cart = new Cart({
                userid: userId,
                product: [
                    {
                        productid: product._id,
                        quantity: quantity,
                        totalPrice: quantity * (product.price - offerDiscount),
                        offerDiscount: offerDiscount,
                        image: product.image[0],
                    },
                ],
            });

            cart.subTotal = cart.product.reduce((acc, cur) => acc + cur.totalPrice, 0);
            cart.grandTotal = cart.subTotal - cart.couponDiscount;

            await cart.save();

            res.status(200).json({ message: 'Product added to cart successfully', isProductInCart: false });
            return;
        }

        const existingProduct = userCart.product.find(product => String(product.productid) === productId);

        if (existingProduct) {
            existingProduct.quantity += parseInt(quantity);
            existingProduct.totalPrice = existingProduct.quantity * (product.price - offerDiscount);
            existingProduct.offerDiscount = offerDiscount;
        } else {
            userCart.product.push({
                productid: product._id,
                quantity: quantity,
                totalPrice: quantity * (product.price - offerDiscount),
                offerDiscount: offerDiscount,
                image: product.image[0],
            });
        }

        userCart.subTotal = userCart.product.reduce((acc, cur) => acc + cur.totalPrice, 0);
        userCart.grandTotal = userCart.subTotal - userCart.couponDiscount;

        await userCart.save();

        res.status(200).json({ message: 'Product added to cart successfully', isProductInCart: !!existingProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


//============== FOR CHANGING THE QUANTITY IN CART ==============
const cartquantity = async (req, res) => {
    try {
        const { cartId, productId, quantity } = req.body;
        const product = await Product.findById(productId).populate('offer').populate('category', 'offer');
        const productPrice = product.price;
        const userId = req.session.userid;
        const existingCart = await Cart.findById(cartId);

        if (!existingCart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const productToUpdate = existingCart.product.find(p => p.productid.equals(productId));

        if (!productToUpdate) {
            return res.status(404).json({ success: false, message: "Product not found in the cart" });
        }

        const { bestOffer, bestOfferType } = await product.determineBestOffer();
        const offerDiscount = bestOffer ? productPrice * (bestOffer.discountPercentage / 100) * quantity : 0;

        productToUpdate.quantity = quantity;
        productToUpdate.totalPrice = quantity * (productPrice)- offerDiscount;
        productToUpdate.offerDiscount = offerDiscount;

        existingCart.subTotal = existingCart.product.reduce((total, product) => {
            return total + product.totalPrice;
        }, 0);
        existingCart.grandTotal = existingCart.subTotal - existingCart.couponDiscount;
        const updatedCart = await existingCart.save();

        res.json({
            success: true,
            message: "Quantity updated successfully",
            updatedTotalPrice: productToUpdate.totalPrice,
            totalPriceTotal: existingCart.subTotal,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ========== FOR LOADING CHECKOUT PAGE ===========
const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.userid;
        const user = await User.findById(userId);
        const userAddresses = user.address;

        const wallet = await Wallet.findOne({ user: userId });

        const cart = await Cart.findOne({ userid: userId }).populate({
            path: "product.productid",
            model: Product, 
            select: 'name price',
        });
        
        if (!cart || !cart.product || cart.product.length === 0 ) {
            req.flash('error', 'Unable to proceed as your cart is empty.');
            res.redirect('/cart');
        }
        else{
            const subTotal = cart.subTotal;
            const couponDiscount = cart.couponDiscount
            const grandTotal = cart.grandTotal;
            const walletBalance = wallet.balance;
            res.render('user/checkout', { 
                checkoutProduct: cart.product, userAddresses, couponDiscount, subTotal, grandTotal, 
                walletBalance: walletBalance 
            },);
        }
    } catch (error) {
        console.log(error);
    }
};

// ========== FOR REMOVING ITEMS FROM CART ===========
const removeFromCart = async (req, res) => {
    try {
        const userId = req.session.userid;
        const productIdToRemove = req.params.productId;

        const userCart = await Cart.findOne({ userid: userId });

        if (userCart) {
            
            userCart.product = userCart.product.filter(product => String(product.productid) !== productIdToRemove);
            
            userCart.subTotal = userCart.product.reduce(
                (total, product) => total + product.totalPrice,
                0
            );
            userCart.grandTotal = userCart.subTotal - userCart.couponDiscount;
            userCart.couponDiscount = 0;
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


// ========== FOR ADDING ADDRESS AT CHECKOUT PAGE ===========
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

// ========== FOR PLACING ORDER ===========
const placeOrder = async (req, res) => {
    try {
        const userId = req.session.userid;
        const paymentMethod = req.body.paymentMethod;
        const selectedAddress = req.body.selectedAddress;
        const paymentId = req.body.paymentId;
        const cartId = req.session.userid;
        let orderStatus;
        const cart = await Cart.findOne({ userid: cartId });

        if (!cart) {
            console.error('Cart not found for user:', userId);
            return res.redirect('/error');
        }
        const { couponDiscount, subTotal, grandTotal } = cart;

        let paymentStatus;
        let paymentMessage;
        const generatedOrderId = generateOrderId();

        
        switch (paymentMethod) {
            case 'wallet':
                console.log("Wallet selected");
    
                
                try {
                    const wallet = await Wallet.findOne({ user: userId });
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
                        orderStatus = 'Placed';
                        paymentStatus = 'success'
                        
                    } else {
                        throw new Error("Insufficient funds in the wallet");
                    }
                } catch (error) {
                    console.error("Error processing wallet payment:", error);
                }
                break;
            case 'razorpay':
                console.log("Inside razorpay case");
                orderStatus = 'Pending';
                paymentStatus = 'success'
                break;
            case 'cod':
                if (grandTotal > 1000) {
                    return res.status(200).json({ success: false, message: 'Cash on Delivery not available for order above ₹1000' });
                } else {
                    orderStatus = 'Placed';
                    paymentStatus = 'success';
                    
                }
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
                productId: product.productid._id,
                name: product.productid.name,
                price: product.productid.price,
                offerDiscount: product.offerDiscount,
                quantity: product.quantity,
                total: product.totalPrice,
                orderStatus: orderStatus,
                image: product.productid.image[0],
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
        
        if(orderStatus != 'Pending') {
            for (const product of products) {
                try {
    
                    const productInStock = await Product.findById(product.productId);
    
                    if (productInStock) {
                        productInStock.quantity -= product.quantity;
                        await productInStock.save();
                    } else {
                        console.error(`Product with ID ${product.productId} not found in the stock database`);
                    }
                } catch (error) {
                    console.error('Error updating product stock:', error);
                    return res.status(500).json({ success: false, message: 'An error occurred while updating product stock.' });
                }
            }
            res.status(200).json({ success: true, hashedOrderId });
        }
        
        if(orderStatus == 'Pending') {
            const options = {
                amount:  req.body.amount * 100,
                currency: "INR",
                receipt: "" + orderInstance._id,
              };
              instance.orders.create(options, function (err, order) {
                if (err) {
                  console.log(err);
                }
                res.json({hashedOrderId ,order });
            
        });
    }
        
    } catch (error) {
        console.log("Inside last catch");
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing the order or updating product stock.' });
    }
};


// ========== FOR GENERATING AN ORDERID ===========
function generateOrderId() {
    const timestamp = Date.now().toString(); 
    const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `OD${timestamp}${randomDigits}`;
}


// ========== RAZORPAY PAYMENT VERIFICATION ===========
const verifyPayment = async (req, res) => {
    try {
        const { payment, order } = req.body;
        const userId = req.session.user?._id;
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY);
        hmac.update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id);
        const hmacValue = hmac.digest("hex");

        if (hmacValue === payment.razorpay_signature) {
            console.log("order.receipt: ", order.receipt);

            const orderid = order.receipt
            const matchedOrder  = await Order.findOne(
                { userId: req.session.userid, _id:orderid  }
            );

            if (!matchedOrder) {
                throw new Error('Order not found');
            }
    
            for (let product of matchedOrder.products) {
                const productToUpdate = await Product.findOne({ _id: product.productId });

                if (!productToUpdate) {
                    throw new Error(`Product with ID ${product.productId} not found`);
                }
    
                productToUpdate.quantity -= product.quantity;
    
                productToUpdate.quantity = Math.max(0, productToUpdate.quantity);
    
                await productToUpdate.save();
            }

           const up = await Order.updateOne(
                {"_id": order.receipt}, {
                    $set: { "products.$[].orderStatus": "Placed" }
                }
            )
                
            if(req.body.id != undefined) {
                res.status(200).json({ success: true, hashedOrderId: req.body.id });
            }
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.redirect('/500');
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

// ========== FOR LOADING ORDER CONFIRMATION AFTER SUCCESSFUL ORDER ===========
const loadOrderConfirmation = async (req, res) => {
    try {
        const hashedOrderId = req.params.Id;
        const order = await Order.findOne({ hashedOrderId:hashedOrderId });
        const user = await User.findById(order.userId);

        if (!order) {
            return res.status(404).render('user/error', { message: 'Order not found' });
        }
        res.render('user/orderconfirmation', { order,  user});
    } catch (error) {
        console.log(error);
        res.status(500).render('user/error', { message: 'Internal server error' });
    }
}


// ========== FOR CONTINUING FAILED PAYMENT AT ORDER DETAILS PAGE ===========
const continuePayment = async(req, res) => {
    try {
        const { amount, orderId } = req.body;
        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: "" + orderId,
          };
          instance.orders.create(options, function (err, order) {
            if (err) {
              console.log(err);
            }
            res.status(201).json({ success: true, order });
        });
        
    } catch (error) {
        
    }
}

// ========== RAZORPAY VERIFICATION AT CONTINUE PAYMENT ===========
const continueVerifyPayment = async (req, res) => {
    try {
        const { payment, order } = req.body;
        const userId = req.session.user?._id;
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY);
        hmac.update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id);
        const hmacValue = hmac.digest("hex");

        if (hmacValue === payment.razorpay_signature) {
            const orderid = order.receipt
            const matchedOrder  = await Order.findOne(
                { userId: req.session.userid, _id:orderid  }
            );

            if (!matchedOrder) {
                throw new Error('Order not found');
            }
    
            for (let product of matchedOrder.products) {
                const productToUpdate = await Product.findOne({ _id: product.productId });

                if (!productToUpdate) {
                    throw new Error(`Product with ID ${product.productId} not found`);
                }
    
                productToUpdate.quantity -= product.quantity;
                productToUpdate.quantity = Math.max(0, productToUpdate.quantity);
    
                await productToUpdate.save();
            }

           const up = await Order.updateOne(
                {"_id": order.receipt}, {
                    $set: { "products.$[].orderStatus": "Placed" }
                })

            if(req.body.id != undefined) {
                res.status(200).json({ success: true, hashedOrderId: req.body.id });
            }
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.redirect('/500');
    }
};

module.exports = {
    loadCart,
    addToCart,
    loadCheckout,
    removeFromCart,
    checkoutAddAddress,
    generateRazorpay,
    placeOrder,
    verifyPayment,
    loadOrderConfirmation,
    cartquantity,
    continuePayment,
    continueVerifyPayment,
}