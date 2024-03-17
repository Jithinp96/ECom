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
        // console.log("cart: ", cart);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

// const loadCart = async (req, res) => {
//     try {
//         const userId = req.session.userid;
//         let cart = await Cart.findOne({ userid: userId }).populate({
//             path: "product.productid",
//             model: 'Products', // Assuming 'Product' is the model name
//             select: 'name price image quantity', // Include 'quantity' in the select field
//         });

//         if (!cart) {
//             return res.render('user/cart', { cartProduct: [], subtotal: 0, offerDiscount: 0, cartId: null }); // Pass cartId as null when cart doesn't exist
//         }

//         // Recalculate offer discount for each product in the cart
//         let totalOfferDiscount = 0;
//         for (let product of cart.product) {
//             const productDetails = await Product.findById(product.productid).populate('offer').populate('category', 'offer');
//             let bestOffer = null;

//             // Check if the product has an offer
//             if (productDetails.offer && productDetails.offer.is_active) {
//                 bestOffer = productDetails.offer;
//             }

//             // Check if the category has an offer
//             if (productDetails.category && productDetails.category.offer && productDetails.category.offer.is_active) {
//                 // If the category has an offer and it's better than the product's offer, use it
//                 if (!bestOffer || productDetails.category.offer.discountPercentage > bestOffer.discountPercentage) {
//                     bestOffer = productDetails.category.offer;
//                 }
//             }

//             // Recalculate the offer discount for the product
//             const offerDiscount = bestOffer ? productDetails.price * (bestOffer.discountPercentage / 100) : 0;
//             totalOfferDiscount += offerDiscount * product.quantity; // Accumulate the total offer discount

//             // Update the product's offerDiscount in the cart
//             product.offerDiscount = offerDiscount;
//         }

//         // Update the cart's offerDiscount
//         cart.offerDiscount = totalOfferDiscount;

//         // Calculate subtotal
//         const subtotal = cart.product.reduce((acc, cur) => acc + (cur.quantity * cur.productid.price - cur.offerDiscount), 0);

//         await cart.save(); // Save the updated cart

//         res.render('user/cart', { cartProduct: cart.product, subtotal, offerDiscount: cart.offerDiscount, cartId: cart._id }); // Pass cartId to the template
//     } catch (error) {
//         console.log(error);
//         res.status(500).send('Internal Server Error'); // Return appropriate error response
//     }
// };


// const loadCart = async (req, res) => {
//     try {
//         const userId = req.session.userid;
//         const cart = await Cart.findOne({ userid: userId }).populate({
//             path: "product.productid",
//             model: Product, 
//             select: 'name price image',
//         });

//         if (!cart) {
//             return res.render('user/cart', { cartProduct: [], subtotal: 0 });
//         }

//         const subtotal = cart.subTotal;
//         const offerDiscount = cart.offerDiscount;
        
//         res.render('user/cart', { cartProduct: cart.product, subtotal, offerDiscount} );
//         console.log("cart: ", cart);

//     } catch (error) {
//         console.log(error);
//     }
// };

// const addToCart = async (req, res) => {
//     try {
//         const { productId, userId, quantity } = req.body;

//         let userCart = await Cart.findOne({ userid: userId });

//         const product = await Product.findById(productId).populate('offer').populate('category', 'offer');

//         let bestOffer = null;
//         let bestOfferType = null;

//         if (product.offer && product.offer.is_active) {
//             bestOffer = product.offer;
//             bestOfferType = 'product';
//         }

//         if (product.category && product.category.offer && product.category.offer.is_active) {
            
//             if (!bestOffer || product.category.offer.discountPercentage > bestOffer.discountPercentage) {
//                 bestOffer = product.category.offer;
//                 bestOfferType = 'category';
//             }
//         }

//         const offerDiscount = bestOffer ? product.price * (bestOffer.discountPercentage / 100) : 0;

//         if (!userCart) {
//             const cart = new Cart({
//                 userid: userId,
//                 product: [
//                     {
//                         productid: product._id,
//                         quantity: quantity,
//                         totalPrice: quantity * (product.price - offerDiscount),
//                         offerDiscount: offerDiscount,
//                         image: product.image[0],
//                     },
//                 ],
//             });

//             cart.subTotal = cart.product.reduce((acc, cur) => acc + cur.totalPrice, 0);
//             cart.grandTotal = cart.subTotal - cart.couponDiscount;

//             await cart.save();

//             res.status(200).json({ message: 'Product added to cart successfully', isProductInCart: false });
//             return;
//         }

//         const existingProduct = userCart.product.find(product => String(product.productid) === productId);

//         if (existingProduct) {
//             existingProduct.quantity += parseInt(quantity);
//             existingProduct.totalPrice = existingProduct.quantity * (product.price - offerDiscount);
//             existingProduct.offerDiscount = offerDiscount;
//             userCart.product.push({
//                 productid: product._id,
//                 quantity: quantity,
//                 totalPrice: quantity * (product.price - offerDiscount),
//                 offerDiscount: offerDiscount,
//                 image: product.image[0],
//             });
//         }

//         userCart.subTotal = userCart.product.reduce((acc, cur) => acc + cur.totalPrice, 0);
//         userCart.grandTotal = userCart.subTotal - userCart.couponDiscount;

//         await userCart.save();

//         res.status(200).json({ message: 'Product added to cart successfully', isProductInCart: !!existingProduct });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };


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



// const addToCart = async (req, res) => {
//     try {
//         const { productId, userId, quantity } = req.body;
//         let userCart = await Cart.findOne({ userid: userId });

//         if (!userCart) {
//             const product = await Product.findById(productId);
//             const cart = new Cart({
//                 userid: userId,
//                 product: [
//                     {
//                         productid: product._id,
//                         quantity: quantity,
//                         totalPrice: quantity * product.price,
//                         image: product.image[0],
//                     },
//                 ],
//             });

//             cart.subTotal = cart.product.reduce((acc, cur) => acc + cur.totalPrice, 0);
//             console.log("cart.subTotal: ", cart.subTotal);
//             console.log("cart.product.offerDiscount: ", cart.product.offerDiscount);
//             console.log("cart.couponDiscount: ", cart.couponDiscount);

//             cart.grandTotal = cart.subTotal - cart.couponDiscount;
//             console.log("cart.grandTotal: ", cart.grandTotal);

//             await cart.save();
//             res.status(200).json({ message: 'Product added to cart successfully', isProductInCart: false });
//             return; 
//         }
        
//         const existingProduct = userCart.product.find(product => String(product.productid) === productId);
//         const product = await Product.findById(productId);

//         if (existingProduct) {
//             existingProduct.quantity += parseInt(quantity);
//             existingProduct.totalPrice = existingProduct.quantity * product.price;
//         } else {
//             userCart.product.push({
//                 productid: product._id,
//                 quantity: quantity,
//                 totalPrice: quantity * product.price,
//                 image: product.image[0],
//             });
//         }
//         userCart.subTotal = userCart.product.reduce((acc, cur) => acc + cur.totalPrice, 0);
//         userCart.grandTotal = userCart.subTotal - userCart.couponDiscount;

//         await userCart.save();

//         res.status(200).json({ message: 'Product added to cart successfully', isProductInCart: !!existingProduct });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };


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
        // console.log("bestOffer: ", bestOffer);
        // console.log(("bestOfferType: ", bestOfferType));

        // let bestOffer = null;
        // let bestOfferType = null;

        // // Check if the product has an offer
        // if (product.offer && product.offer.is_active) {
        //     bestOffer = product.offer;
        //     bestOfferType = 'product';
        // }

        // // Check if the category has an offer
        // if (product.category && product.category.offer && product.category.offer.is_active) {
        //     // If the category has an offer and it's better than the product's offer, use it
        //     if (!bestOffer || product.category.offer.discountPercentage > bestOffer.discountPercentage) {
        //         bestOffer = product.category.offer;
        //         bestOfferType = 'category';
        //     }
        // }

        // Calculate the offer discount based on the best offer for the new quantity
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



// const cartquantity = async (req, res) => {
//     try {
//         const { cartId, productId, quantity } = req.body;
        
//         const product = await Product.findById(productId).populate('offer').populate('category', 'offer');
//         const productPrice = product.price;

//         const userId = req.session.userid;

//         const existingCart = await Cart.findById(cartId);

//         if (!existingCart) {
//             return res.status(404).json({ success: false, message: "Cart not found" });
//         }

//         const productToUpdate = existingCart.product.find(p => p.productid.equals(productId));

//         if (!productToUpdate) {
//             return res.status(404).json({ success: false, message: "Product not found in the cart" });
//         }

//         let bestOffer = null;
//         let bestOfferType = null;

//         // Check if the product has an offer
//         if (product.offer && product.offer.is_active) {
//             bestOffer = product.offer;
//             bestOfferType = 'product';
//         }

//         // Check if the category has an offer
//         if (product.category && product.category.offer && product.category.offer.is_active) {
//             // If the category has an offer and it's better than the product's offer, use it
//             if (!bestOffer || product.category.offer.discountPercentage > bestOffer.discountPercentage) {
//                 bestOffer = product.category.offer;
//                 bestOfferType = 'category';
//             }
//         }

//         // Calculate the offer discount based on the best offer
//         const offerDiscount = bestOffer ? productPrice * (bestOffer.discountPercentage / 100) : 0;

//         productToUpdate.quantity = quantity;
//         productToUpdate.totalPrice = quantity * (productPrice - offerDiscount); // Apply the discount
//         productToUpdate.offerDiscount = offerDiscount; // Save the discount

//         existingCart.subTotal = existingCart.product.reduce((total, product) => {
//             return total + product.totalPrice;
//         }, 0);
//         existingCart.grandTotal = existingCart.subTotal - existingCart.couponDiscount;
//         const updatedCart = await existingCart.save();

//         res.json({
//             success: true,
//             message: "Quantity updated successfully",
//             updatedTotalPrice: productToUpdate.totalPrice,
//             totalPriceTotal: existingCart.subTotal,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: "Internal server error" });
//     }
// };


// const cartquantity = async (req, res) => {
//     try {
//         const { cartId, productId, quantity } = req.body;
        
//         const product = await Product.findById(productId);
//         const productPrice = product.price;

//         const userId = req.session.userid;

//         const existingCart = await Cart.findById(cartId);

//         if (!existingCart) {
//             return res.status(404).json({ success: false, message: "Cart not found" });
//         }

//         const productToUpdate = existingCart.product.find(p => p.productid.equals(productId));

//         if (!productToUpdate) {
//             return res.status(404).json({ success: false, message: "Product not found in the cart" });
//         }

//         productToUpdate.quantity = quantity;
//         productToUpdate.totalPrice = quantity * productPrice;

//         existingCart.subTotal = existingCart.product.reduce((total, product) => {
//             return total + product.totalPrice;
//         }, 0);
//         existingCart.grandTotal = existingCart.subTotal - existingCart.couponDiscount;
//         const updatedCart = await existingCart.save();

//         res.json({
//             success: true,
//             message: "Quantity updated successfully",
//             updatedTotalPrice: productToUpdate.totalPrice,
//             totalPriceTotal: existingCart.subTotal,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: "Internal server error" });
//     }
// };

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

const removeFromCart = async (req, res) => {
    // console.log("Inside the remove controller");
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

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.userid;
        const paymentMethod = req.body.paymentMethod;
        const selectedAddress = req.body.selectedAddress;
        const paymentId = req.body.paymentId;
        const cartId = req.session.userid;
        let orderStatus;
        // console.log("paymentId: ", paymentId);

        const cart = await Cart.findOne({ userid: cartId });

        if (!cart) {
            console.error('Cart not found for user:', userId);
            return res.redirect('/error');
        }
        // console.log("cart: ", cart);

        // const offerDiscount = cart.product.reduce((total, product) => total + (product.offerDiscount * product.quantity), 0);
        const { couponDiscount, subTotal, grandTotal } = cart;

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
            // offerDiscount: offerDiscount,
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

        console.log("orderData: ", orderData);

        const orderInstance = new Order(orderData);
        await orderInstance.save();

        await Cart.findOneAndDelete({ userid: req.session.userid });
        console.log("After delete cart");
        
        if(orderStatus != 'Pending') {
            console.log("Inside not pendinf order status: ", orderStatus);
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
            console.log("inside orderstatus pending: ", orderStatus);
            const options = {
                amount:  req.body.amount * 100,
                currency: "INR",
                receipt: "" + orderInstance._id,
              };
              instance.orders.create(options, function (err, order) {
                if (err) {
                  console.log(err);
                }
                console.log("order created by razorpay: ", order);
                res.json({hashedOrderId ,order });
            
        });
    }
        
    } catch (error) {
        console.log("Inside last catch");
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing the order or updating product stock.' });
    }
};



function generateOrderId() {
    const timestamp = Date.now().toString(); 
    const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `OD${timestamp}${randomDigits}`;
}


const verifyPayment = async (req, res) => {
    try {
        console.log("Inside verify payment");
        const { payment, order } = req.body;
        console.log("payment: ", payment);
        console.log("order: ", order);
        const userId = req.session.user?._id;
        console.log(req.body);
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY);
        hmac.update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id);
        const hmacValue = hmac.digest("hex");

        if (hmacValue === payment.razorpay_signature) {

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
                    orderStatus: "Placed", // Updated order status
                    image: product.productid.image[0],
                })));
            }, []);
    

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
            console.log("order.receipt: ", order.receipt);
            const Dorder = await Order.findById({ _id: order.receipt });
            console.log("Order inside verify payment: ", Dorder);
            console.log("payment.razorpay_payment_id: ", payment.razorpay_payment_id);

            // Update order status to "Placed"
           const up = await Order.updateOne(
                {"_id": order.receipt}, {
                    $set: { "products.$[].orderStatus": "Placed" }
                })
                
                
           console.log('up:', up)

            console.log('req.body.id:', req.body.id);
            if(req.body.id != undefined) {
                res.status(200).json({ success: true, hashedOrderId: req.body.id });
            }
        }
    } catch (error) {
        // Handle errors and redirect to an error page
        console.error('Error verifying payment:', error);
        return res.redirect('/500');
    }
};


// const verifyPayment = async (req, res) => {
//     try {
//         console.log("Inside verify payment");
//         const { payment, order } = req.body;
//         console.log("payment: ", payment);
//         console.log("order: ", order);
//         const userId = req.session.user?._id;
//         console.log(req.body);
//         const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY);
//         hmac.update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id);
//         const hmacValue = hmac.digest("hex");

//         if (hmacValue === payment.razorpay_signature) {

//             const checkoutProduct = await Cart.find({ userid: req.session.userid }).populate({
//                 path: "product.productid",
//                 model: Product,
//                 select: 'name price image',
//             });
    
//             const products = checkoutProduct.reduce((acc, checkoutItem) => {
//                 return acc.concat(checkoutItem.product.map((product, index) => ({
//                     productId: product.productid._id,
//                     name: product.productid.name,
//                     price: product.productid.price,
//                     offerDiscount: product.offerDiscount,
//                     quantity: product.quantity,
//                     total: product.totalPrice,
//                     orderStatus: orderStatus,
//                     image: product.productid.image[0],
//                 })));
//             }, []);
    

//             for (const product of products) {
//                 try {
    
//                     const productInStock = await Product.findById(product.productId);
    
//                     if (productInStock) {
//                         productInStock.quantity -= product.quantity;
//                         await productInStock.save();
//                     } else {
//                         console.error(`Product with ID ${product.productId} not found in the stock database`);
//                     }
//                 } catch (error) {
//                     console.error('Error updating product stock:', error);
//                     return res.status(500).json({ success: false, message: 'An error occurred while updating product stock.' });
//                 }
//             }
//             console.log("order.receipt: ", order.receipt);
//             const Dorder = await Order.findById({ _id: order.receipt });
//             console.log("Order inside verify payment: ", Dorder);
//             console.log("payment.razorpay_payment_id: ", payment.razorpay_payment_id);

//             await Order.findByIdAndUpdate(order.receipt, { orderStatus: "Placed" });

//             console.log('req.body.id:', req.body.id);
//             if(req.body.id != undefined) {
//                 res.status(200).json({ success: true, hashedOrderId: req.body.id });
    
//             }
            
//         }
       
       
//     } catch (error) {
//         // Handle errors and redirect to an error page
//         console.error('Error verifying payment:', error);
//         return res.redirect('/500');
//     }
// };



// const verifyPayment = async (req, res) => {
//     try {
//         const userId = req.session.user_id;
//         const { payment, order } = req.body;
//         const orderId = order.receipt;

//         const crypto = require('crypto');
//         let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);
//         hmac.update(payment.razorpay_order_id + '|' + payment.razorpay_payment_id);
//         hmac = hmac.digest('hex');

//         if (hmac === payment.razorpay_signature) {
//             const orderDetails = await Order.findById(orderId);

//             if (!orderDetails) {
//                 console.error('Order not found:', orderId);
//                 return res.status(404).json({ error: 'Order not found' });
//             }

//             orderDetails.paymentStatus = "Razorpay";
//             await orderDetails.save();

//             const cartDeleteResult = await Cart.deleteOne({ userid: userId });

//             if (!cartDeleteResult.ok) {
//                 console.error('Error deleting cart items for user:', userId);
//                 return res.status(500).json({ error: 'Error deleting cart items' });
//             }

//             return res.json({ payment: true });
//         } else {
//             console.error('Razorpay signature mismatch');
//             return res.status(400).json({ error: 'Razorpay signature mismatch' });
//         }
//     } catch (error) {
//         console.error('Error verifying payment:', error);
//         return res.status(500).json({ error: 'Error verifying payment' });
//     }
// };


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
    cartquantity,
}