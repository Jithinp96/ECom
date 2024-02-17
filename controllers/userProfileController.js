const User = require('../models/userModel');
const Products = require("../models/productModel");
const Order = require("../models/orderModel");

const loadUserProfile = async (req, res) => {
    try {
        const userId = req.session.userid;
        const user = await User.findById(userId);
        const userAddress = user.address;

        const order = await Order.find({userId: userId}).populate({
            path: 'products.productId',
            model: Order,
            select: 'name price quantity date image'
        });

        res.render('userprofile', { user, userAddress, order });
    } catch (error) {
        console.log(error);
    }
}

const addAddress = async(req, res) => {
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

const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.userid;
        const addressId = req.params.addressId;

        // Find the user and remove the specified address
        const user = await User.findById(userId);
        user.address.pull({ _id: addressId });
        await user.save();

        res.json({ success: true, message: 'Address deleted successfully.' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ success: false, message: 'Failed to delete address.' });
    }
};

// Express Route to Fetch Address Details by ID
const loadEditAddress = async (req, res) => {
    try {
        const userId = req.session.userid; // Assuming you have user authentication and the user ID is available in the request
        const addressId = req.params.id;
        const user = await User.findById(userId); // Fetch the user document
        const address = user.address.id(addressId); // Get the specific address by its ID
        res.json(address); // Send the address details as JSON response
    } catch (error) {
        console.error('Error fetching address details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateAddress = async (req, res) => {
    try {
        const userId = req.session.userid; // Assuming you have user authentication and the user ID is available in the request
        const addressId = req.params.id;
        const updatedAddress = req.body; // Updated address details sent in the request body
        const user = await User.findById(userId); // Fetch the user document
        const address = user.address.id(addressId); // Get the specific address by its ID
        // Update the address fields
        address.name = updatedAddress.name;
        address.housename = updatedAddress.housename;
        address.street = updatedAddress.street;
        address.city = updatedAddress.city;
        address.pin = updatedAddress.pin;
        address.mobile = updatedAddress.mobile;
        await user.save(); // Save the updated user document
        res.json({ success: true }); // Send success response
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const loadOrderDetails = async(req, res) => {
    try {
        const userId = req.session.userid;
        const orderId = req.params.Id;
        // Query the Order model to find the order with the given orderId
        const order = await Order.findOne({ _id: orderId, userId: userId }).populate({
            path: 'products.productId',
            model: Products,
            select: 'name price quantity' // Select the fields you need from the Product model
        });
        if (!order) {
            // Handle case where order is not found
            return res.status(404).send('Order not found');
        }

        // Render the 'orderdetails' view and pass the order data to it
        res.render('orderdetails', { order });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    }

const orderCancel = async (req, res) => {
    const { orderId, productId } = req.params;
    const { reason } = req.body; // Get the reason from the request body

    try {
        // Find the order by orderId and productId
        const order = await Order.findOneAndUpdate(
            { _id: orderId, 'products._id': productId },
            { 
                $set: { 
                    'products.$.orderStatus': 'Cancelled', 
                    'products.$.reason': reason // Update the reason field
                } 
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order or product not found' });
        }

        res.json({ message: 'Item cancelled successfully', order });
    } catch (error) {
        console.error('Error cancelling item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


module.exports = {
    loadUserProfile,
    addAddress,
    deleteAddress,
    loadEditAddress,
    updateAddress,
    loadOrderDetails,
    orderCancel,
}