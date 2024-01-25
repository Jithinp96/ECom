const Products = require('../models/productModel');
const Category = require('../models/categoryModel');
const multer = require('multer');


const loadProductList = async (req,res) => {
    try{
        const products = await Products.find();
        res.render('productList',{'products':products});
    } catch (error) {
        console.log(error);
    }
    
}

const loadCategory = async (req, res) => {
    try {
        const category = await Category.find()
        res.render('addProduct', {categories: category});
    } catch (error) {
        console.log(error);
    }
}

const addProduct = async (req, res) => {
    // console.log("hji");
    try {
      const { name, price, quantity, category, description } = req.body;
  
      const images = req.files.map(file => file.filename);

      // Assuming 'image' is an array of strings (file paths or base64 encoded images)
      const newProduct = new Products({
        name: name,
        price: price,
        quantity:quantity,
        category: category,
        description: description,
        image: images
      });
  
      await newProduct.save();
  
      res.redirect('/admin/product'); // Redirect to a suitable route after successful submission
    } catch (error) {
      console.error(error);
      req.flash('err', 'Error saving product. Please try again.'); // Flash an error message
      res.redirect('/admin/addproduct'); // Redirect to the add products page
    }
};


const loadEditProduct = async (req, res) => {
    try {
        const category = await Category.find()
        res.render('editProduct', {categories: category});
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    loadProductList,
    loadCategory,
    addProduct,
    loadEditProduct,
}