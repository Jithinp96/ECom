const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Product = require("../models/productModel")
const Cart = require("../models/cartModel");




const loadAdminOrderList = async (req, res) => {
    try {
        // Fetch orders from the database
        const orders = await Order.find().populate('userid', 'fname');
    
        // Render the 'orderlist' view and pass the orders as a variable
        res.render('orderlist', { orders });
    } catch (error) {
        console.log(error);
    }
} 

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;

        // Find and update the order status in the database
        await Order.findByIdAndUpdate(orderId, { 'products.0.orderStatus': newStatus });

        // Send a success response
        res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        // Handle errors and send an error response
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    loadAdminOrderList,
    updateOrderStatus,
}