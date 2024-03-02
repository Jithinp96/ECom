const Products = require('../models/productModel');
const Category = require('../models/categoryModel');
const multer = require('multer');


const loadProductList = async (req,res) => {
    try{
        const products = await Products.find().populate('category');
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

// const addProduct = async (req, res) => {
//     console.log("Inside Add Product controller");
//     try {
//       const { name, price, quantity, category, description } = req.body;
//       console.log("name: ", name);
//       console.log("price: ", price);
//       console.log("quantity: ", quantity);
//       console.log("category: ", category);
//       console.log("description: ", description);
  
//       const images = req.files.map(file => file.filename);

//       const newProduct = new Products({
//         name: name,
//         price: price,
//         quantity:quantity,
//         category: category,
//         description: description,
//         image: images
//       });
      
//       console.log("Just above the save newProduct");
//       await newProduct.save();
  
//       res.redirect('/admin/product'); 
//     } catch (error) {
//       console.error(error);
//       req.flash('err', 'Error saving product. Please try again.'); 
//       res.redirect('/admin/addproduct'); 
//     }
// };

// const addProduct = async (req, res) => {
//     console.log("Inside Add Product controller");
//     try {
//         const { name, price, quantity, category, description } = req.body;
//         console.log("name: ", name);
//         console.log("price: ", price);
//         console.log("quantity: ", quantity);
//         console.log("category: ", category);
//         console.log("description: ", description);

//         // Process uploaded images
//         let images = req.files.map(file => file.filename);

//         // Handle removed images
//         const removedImages = req.body.deletedImages || [];
//         images = images.filter(image => !removedImages.includes(image));

//         // Delete removed images from storage if any
//         if (removedImages.length > 0) {
//             for (const imageFilename of removedImages) {
//                 // Delete the removed image from storage
//                 deleteImageFromStorage(imageFilename);
//             }
//             console.log('Deleted images from storage successfully.');
//         }

//         // Create a new product object with the processed images
//         const newProduct = new Products({
//             name: name,
//             price: price,
//             quantity: quantity,
//             category: category,
//             description: description,
//             image: images
//         });

//         console.log("Just above the save newProduct");
//         await newProduct.save();

//         res.redirect('/admin/product');
//     } catch (error) {
//         console.error(error);
//         req.flash('err', 'Error saving product. Please try again.');
//         res.redirect('/admin/addproduct');
//     }
// };

const addProduct = async (req, res) => {
    try {
        // Parse form data
        const { name, price, quantity, category, description } = req.body;
        let images = req.files.map(file => file.filename);

        // Handle removed images
        const deletedImages = req.body.deletedImages ? JSON.parse(req.body.deletedImages) : [];
        images = images.filter(image => !deletedImages.includes(image)); // Exclude removed images

        // Save product details to the database
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