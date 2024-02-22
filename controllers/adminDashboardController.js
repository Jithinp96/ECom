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
        // Handle error appropriately
    }
}


const generateSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        console.log(startDate);
        // Convert dates to JavaScript Date objects with time included
        const startDateTime = new Date(`${startDate}T00:00:00.000+00:00`);
        const endDateTime = new Date(`${endDate}T23:59:59.999+00:00`);
        // Use aggregation to fetch orders within the specified date range
        const orders = await Orders.aggregate([
            {
                $match: {
                    date: { $gte: startDateTime, $lte: endDateTime },
                    'products.orderStatus': 'Delivered' // Add this condition to filter by Status
                },
            },
            {
                $lookup: {
                    from: 'users', // The name of the User model collection in MongoDB
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $unwind: '$user',
            },
            {
                $unwind: '$products',
            },
            {
                $lookup: {
                    from: 'products', // The name of the products model collection in MongoDB
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'products.productInfo',
                },
            },
            {
                $unwind: '$products.productInfo',
            },
            {
                $group: {
                    _id: '$_id',
                    user: { $first: '$user' },
                    products: { $push: '$products' },
                    total: { $sum: '$products.productInfo.total' },
                    date: { $first: '$date' },
                    // Add other fields you need to include in the result
                },
            },
        ]);

        // Log orders count and dates
        console.log("Orders Count:", orders);
        console.log("Start Date:", startDateTime);
        console.log("End Date:", endDateTime);

        return res.status(200).json({
            status: "success",
            data: {
                orders,
                startDate: startDateTime,
                endDate: endDateTime,
            },
        });
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