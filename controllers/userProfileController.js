const User = require('../models/userModel');
const Products = require("../models/productModel");
const Order = require("../models/orderModel");
const Wallet = require("../models/walletModel");

// ========== FOR LOADING USER PROFILE ===========
const loadUserProfile = async (req, res) => {
    try {
        const userId = req.session.userid;
        const user = await User.findById(userId);
        const userAddress = user.address;
        const wallet = await Wallet.findOne({ user: userId });

        wallet.walletHistory.sort((a, b) => b.date - a.date);

        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 3;

        const options = {
            page: page,
            limit: size,
            sort: { date: -1 },
            populate: {
                path: 'products.productId',
                select: 'name price quantity date image'
            }
        };

        const result = await Order.paginate({ userId: userId }, options);
        const orders = result.docs;
        const totalPages = result.totalPages;

        res.render('user/userProfile', { user, userAddress, order: orders, wallet, currentPage: page, totalPages, pageSize: size });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

// ========== FOR CHANGING THE USER DETAILS ===========
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const updatedUser = {
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            mobile: req.body.mobile,
        };

        await User.findByIdAndUpdate(userId, updatedUser);
        res.send("User updated successfully");
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}

// ========== FOR ADDING A NEW ADDRESS ===========
const addAddress = async(req, res) => {
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

// ========== FOR DELETING AN ADDRESS ===========
const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.userid;
        const addressId = req.params.addressId;

        
        const user = await User.findById(userId);
        user.address.pull({ _id: addressId });
        await user.save();

        res.json({ success: true, message: 'Address deleted successfully.' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ success: false, message: 'Failed to delete address.' });
    }
};

// ========== FOR LOADING EDIT ADDRESS MODAL ===========
const loadEditAddress = async (req, res) => {
    try {
        const userId = req.session.userid; 
        const addressId = req.params.id;
        const user = await User.findById(userId); 
        const address = user.address.id(addressId); 
        res.json(address); 
    } catch (error) {
        console.error('Error fetching address details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ========== FOR UPDATING AN ADDRESS ===========
const updateAddress = async (req, res) => {
    try {
        const userId = req.session.userid; 
        const addressId = req.params.id;
        const updatedAddress = req.body; 
        const user = await User.findById(userId); 
        const address = user.address.id(addressId); 
       
        address.name = updatedAddress.name;
        address.housename = updatedAddress.housename;
        address.street = updatedAddress.street;
        address.city = updatedAddress.city;
        address.pin = updatedAddress.pin;
        address.mobile = updatedAddress.mobile;
        await user.save(); 
        res.json({ success: true }); 
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ========== FOR LOADING ORDER DETAILS PAGE ===========
const loadOrderDetails = async (req, res) => {
    try {
        const userId = req.session.userid;
        const orderId = req.params.Id;

        const order = await Order.findOne({ _id: orderId, userId: userId }).populate({
            path: 'products.productId',
            model: Products,
            select: 'name price quantity orderStatus' 
        });
        if (!order) {
            return res.status(404).send('Order not found');
        }

        const isProductDelivered = order.products.some(product => product.orderStatus === 'Delivered');
        res.render('user/orderdetails', { order, isProductDelivered });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

// ========== FOR CANCELLING AN ORDER ===========
const orderCancel = async (req, res) => {
    const { orderId, productId } = req.params;
    const { reason } = req.body; 

    try {
        const order = await Order.findOneAndUpdate(
            { _id: orderId, 'products._id': productId },
            {
                $set: {
                    'products.$.orderStatus': 'Cancelled',
                    'products.$.reason': reason 
                }
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order or product not found' });
        }

        order.products.forEach(async (product) => {
            await Products.updateOne(
                {_id: product.productId },
                { $inc: {quantity: product.quantity }}
            ).exec();
        });
        
        if (order.paymentMode === 'razorpay' || order.paymentMode === 'wallet') {
            const wallet = await Wallet.findOne({ user: order.userId });
            let cancelledAmount = 0;

            order.products.forEach((product) => {
                if (product.orderStatus === 'Cancelled') {
                    cancelledAmount += product.total;
                }
            });
            
            order.subtotal -= cancelledAmount;
            await order.save();
            wallet.balance += cancelledAmount;
            
            wallet.walletHistory.push({
                amount: cancelledAmount,
                type: 'Credit',
                reason: 'Order cancellation refund',
                orderId: orderId, 
                orderId2: order.orderId,
                date: new Date()
            });
            await wallet.save();
        }
        res.json({ message: 'Item cancelled successfully', order });
    } catch (error) {
        console.error('Error cancelling item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ========== FOR REQUESTING RETURN ===========
const orderReturnRequest = async (req, res) => {
    const orderId = req.params.orderId;
    const productId = req.params.productId;
    const { index, reason } = req.body;

    try {
        const order = await Order.findOneAndUpdate(
            { 
                _id: orderId,
                'products._id': productId
            },
            {
                $set: {
                    'products.$.reason': reason,
                    'products.$.orderStatus': 'Return Requested'
                }
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order or Product not found' });
        }

        res.status(200).json({ message: 'Return requested successfully', order: order });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ========== FOR DOWNLOADING INVOICE ===========
// const getInvoice = async (req, res) => {
//     try {
//         const orderid = req.params.id;
//         res.render("user/invoice")
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Internal Server Error');
//     }
// };
    
    


module.exports = {
    loadUserProfile,
    updateUser,
    addAddress,
    deleteAddress,
    loadEditAddress,
    updateAddress,
    loadOrderDetails,
    orderCancel,
    orderReturnRequest,
    // getInvoice,
}