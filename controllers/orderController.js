const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Product = require("../models/productModel")
const Cart = require("../models/cartModel");
const Wallet = require("../models/walletModel");


const loadAdminOrderList = async (req, res) => {
    try {
        // Fetch orders from the database
        const orders = await Order.find().populate('userId', 'fname');
    
        // Render the 'orderlist' view and pass the orders as a variable
        res.render('orderlist', { orders });
    } catch (error) {
        console.log(error);
    }
} 


const updateOrderStatus = async (req, res) => {
    try {
        console.log("Inside updateOrderStatus fn");
        const { orderId, productId, newStatus } = req.body;
        console.log("newStatus: ", newStatus);
        
        // Find the order by its ID
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Find the product within the order by its ID
        const product = order.products.find(prod => prod._id == productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found in the order' });
        }

        // If the new status is 'Cancelled' or 'Returned' and payment mode is 'razorpay' or 'wallet'
        if ((newStatus === 'Cancelled' || newStatus === 'Returned') && 
            (order.paymentMode === 'razorpay' || order.paymentMode === 'wallet')) {
            // Fetch user's wallet details
            const wallet = await Wallet.findOne({ user: order.userId });

            // Update wallet balance and transaction history
            wallet.balance += product.total;
            wallet.walletHistory.push({
                amount: product.total,
                type: 'Credit',
                reason: `Order ${newStatus === 'Cancelled' ? 'cancellation' : 'return'} refund`,
                orderId: orderId,
                orderId2: order.orderId,
                date: new Date()
            });

            // Save the updated wallet balance and transaction history
            await wallet.save();
        }

        // Update the status of the found product
        product.orderStatus = newStatus;

        // Save the updated order
        await order.save();

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