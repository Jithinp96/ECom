const Products = require('../models/productModel');
const Category = require('../models/categoryModel');
const multer = require('multer');

// ========== FOR LOADING PRODUCT LIST ===========
const loadProductList = async (req,res) => {
    try{
        const products = await Products.find().populate('category');
        res.render('productList',{'products':products});
    } catch (error) {
        console.log(error);
    }
    
}

// ========== FOR SHOWING CATEGORY IN ADD PRODUCT PAGE ===========
const loadCategory = async (req, res) => {
    try {
        const category = await Category.find()
        res.render('addProduct', {categories: category});
    } catch (error) {
        console.log(error);
    }
}

// ========== FOR ADDING PRODUCT ===========
const addProduct = async (req, res) => {
    try {

        const { name, price, quantity, category, description } = req.body;
        let images = req.files.map(file => file.filename);

        const deletedImages = req.body.deletedImages ? JSON.parse(req.body.deletedImages) : [];
        images = images.filter(image => !deletedImages.includes(image));

        const newProduct = new Products({
            name: name,
            price: price,
            quantity: quantity,
            category: category,
            description: description,
            image: images
        });
        await newProduct.save();

        res.redirect('/admin/product');
    } catch (error) {
        console.error(error);
        req.flash('err', 'Error saving product. Please try again.');
        res.redirect('/admin/addproduct');
    }
};

// ========== FOR CHANGING PRODUCT STATUS TO LISTED AND UNLISTED ===========
const toggleProductStatus = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Products.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'product not found' });
        }

        
        product.is_listed = !product.is_listed;
        await product.save();

        res.json({
            success: true,
            product: {
                _id: product._id,
                is_listed: product.is_listed,
            },
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// ========== FOR EDITING A PRODUCT DETAILS ===========
const loadEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        const category = await Category.find();
        const product = await Products.findById(productId).populate('category');

        if (!product) {
            
            return res.status(404).send('Product not found');
        }

        res.render('editProduct', { categories: category, product: product });
    } catch (error) {
        console.error('Error in loadEditProduct controller:', error);
        res.status(500).send('Internal Server Error');
    }
}

// ========== FOR EDITING A PRODUCT ===========
const editProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, price, quantity, category, description } = req.body;
        const images = req.files ? req.files.map(file => file.filename) : [];
        const existingProduct = await Products.findById(productId);
      
        const imagesToDelete = req.body.deletedImages;

        await Products.findByIdAndUpdate(productId, {
            name: name,
            price: price,
            quantity: quantity,
            category: category,
            description: description,
           
            image: images.length > 0 ? images : existingProduct.image
        });

        if (imagesToDelete && imagesToDelete.length > 0) {
            for (const imageFilename of imagesToDelete) {
                await Products.updateOne({ _id: productId }, { $pull: { image: imageFilename } });
            }
            console.log('Images deleted successfully from the database.');
        }
        res.redirect('/admin/product'); 
    } catch (error) {
        console.log(error.message);
        req.flash('err', 'Error editing product. Please try again');
    }
};

module.exports = {
    loadProductList,
    loadCategory,
    addProduct,
    loadEditProduct,
    toggleProductStatus,
    editProduct,
}