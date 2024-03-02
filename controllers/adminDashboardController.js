const Users = require("../models/userModel");
const Orders = require("../models/orderModel")
const Products = require("../models/productModel")

const loadDashboard = async (req,res) => {
    try{
        const userCount = await Users.countDocuments();
        const orderCount = await Orders.countDocuments();
        res.render('adminDashboard', { userCount, orderCount });
    } catch (error) {
        console.log(error);
    }
    
}

const loadSalesReport = async (req, res) => {
    try {
        const orders = await Orders.find().populate('userId').populate('products.productId');
        res.render("salesreport", { orders });
    } catch (error) {
        console.log(error);
        
    }
}


const generateSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
  
        const startDateTime = new Date(`${startDate}T00:00:00.000Z`);
        const endDateTime = new Date(`${endDate}T23:59:59.999Z`);

        const orders = await Orders.find({ date: { $gte: startDateTime, $lte: endDateTime } }).populate('userId').populate('products.productId');
        
        res.render('salesreport', { orders })

    } catch (error) {
        console.error("Error generating sales report:", error);
        return res.status(500).json({ error: "Failed to generate sales report" });
    }
};


module.exports = {
    loadDashboard,
    loadSalesReport,
    generateSalesReport,
}