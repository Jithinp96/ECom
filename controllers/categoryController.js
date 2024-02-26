const Categories = require("../models/categoryModel");


const addCategory = async (req, res) => {
    const { categoryName } = req.body;

    try {

        const exist = await Categories.findOne({name:categoryName});
        // console.log(exist);
        if(exist){
            req.flash('name', 'Category already exists');
        }
        else{
            const newCategory = new Categories({
                name: categoryName
            })
            await newCategory.save();
            res.status(201).json({ success: true, message: 'Category added successfully', category: newCategory });
        }
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const loadCategoryList = async (req,res) => {
    try{
        const categories = await Categories.find()
        res.render('CategoryList',{ categories: categories});
    } catch (error) {
        console.log(error);
    }
    
}

const toggleCategoryStatus = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const category = await Categories.findById(categoryId);

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Toggle the 'is_listed' property
        category.is_listed = !category.is_listed;
        await category.save();

        // Send the updated category information as JSON response
        res.json({
            success: true,
            category: {
                _id: category._id,
                is_listed: category.is_listed,
            },
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


const editCategory = async (req, res) => {
    try {
        
        const category = await Categories.findById(req.body.id);

        if (!category) {
            return res.status(404).send({ success: false, message: 'Category not found' });
        }

        
        const newName = req.body.name;
        const existingCategory = await Categories.findOne({ name: newName });

        if (existingCategory && existingCategory._id.toString() !== category._id.toString()) {
            return res.status(400).send({ success: false, message: 'Category name already exists' });
        }

       
        category.name = newName;
        await category.save();

        res.send({ success: true, message: 'Category updated successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
};


module.exports = {
    loadCategoryList,
    addCategory,
    toggleCategoryStatus,
    editCategory,
}