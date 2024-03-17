const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Product = require("../models/productModel")
const Cart = require("../models/cartModel");
const Wallet = require("../models/walletModel");
const easyinvoice = require('easyinvoice');

const loadAdminOrderList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = 4;

        const orders = await Order.paginate({}, { page, limit: perPage, populate: 'userId', sort: { date: -1 } });
        const products = await Product.find();
        res.render('orderList', { orders: orders.docs, products, currentPage: page, totalPages: orders.totalPages });
    } catch (error) {
        console.log(error.message);
    }
}

const updateOrderStatus = async (req, res) => {
    try {
        console.log("Inside updateOrderStatus fn");
        console.log("req.body: ", req.body);
        const { orderId, productId, newStatus,  productIdOg} = req.body;
        console.log("newStatus: ", newStatus);
        
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const product = order.products.find(prod => prod._id == productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found in the order' });
        }

        if ((newStatus === 'Cancelled' && (order.paymentMode === 'razorpay' || order.paymentMode === 'wallet')) || 
            newStatus === 'Returned') {
            const wallet = await Wallet.findOne({ user: order.userId });

            wallet.balance += product.total;
            wallet.walletHistory.push({
                amount: product.total,
                type: 'Credit',
                reason: `Order ${newStatus === 'Cancelled' ? 'cancellation' : 'return'} refund`,
                orderId: orderId,
                orderId2: order.orderId,
                date: new Date()
            });

            await wallet.save();
        }

        if (newStatus === 'Returned' || newStatus === 'Cancelled') {
            console.log("productId inside the quantity update: ", productIdOg);
            const productToUpdate = await Product.findById({_id:productIdOg});
            console.log("productToUpdate: ", productToUpdate);
            if (!productToUpdate) {
                return res.status(404).json({ error: 'Product not found in the database' });
            }
            productToUpdate.quantity += product.quantity;
            await productToUpdate.save();
        }

        product.orderStatus = newStatus;

        await order.save();

        res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};




module.exports = {
    loadAdminOrderList,
    updateOrderStatus,
}