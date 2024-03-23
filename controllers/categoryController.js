const _ = require('lodash');
const Categories = require("../models/categoryModel");

// ========== FUNCTION FOR CHANGING TO TITLE CASE ===========
function toTitleCase(str) {
    return _.startCase(_.toLower(str));
}

// ========== FOR ADDING CATEGORY ===========
const addCategory = async (req, res) => {

    const { categoryName } = req.body;
    const titleCaseCategory = toTitleCase(categoryName);

    try {

        const exist = await Categories.findOne({name:titleCaseCategory});
        if(exist){
            console.log("Category already exist");
            res.status(200).json({ success: false, message: 'Category already exists' });
        }
        else{
            const newCategory = new Categories({
                name: titleCaseCategory
            })
            await newCategory.save();
            res.status(201).json({ success: true, message: 'Category added successfully', category: newCategory });
        }
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ========== FOR LOADING CATEGORY LISTING PAGE ===========
const loadCategoryList = async (req,res) => {
    try{
        const categories = await Categories.find()
        res.render('categoryList',{ categories: categories});
    } catch (error) {
        console.log(error);
    }
    
}

// ========== FOR CHANGING THE STATUS OF CATEGORY ===========
const toggleCategoryStatus = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const category = await Categories.findById(categoryId);

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        category.is_listed = !category.is_listed;
        await category.save();

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

// ========== FOR EDITING CATEGORY ===========
const editCategory = async (req, res) => {
    try {
        
        const category = await Categories.findById(req.body.id);

        if (!category) {
            return res.status(404).send({ success: false, message: 'Category not found' });
        }

        const newName = req.body.name;
        const titleCaseCategory = toTitleCase(newName);
        const existingCategory = await Categories.findOne({ name: titleCaseCategory });

        if (existingCategory && existingCategory._id.toString() !== category._id.toString()) {
            return res.status(201).json({ success: false, message: 'Category already exists' });
        }
        
        category.name = titleCaseCategory;
        await category.save();
        return res.status(201).json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
        console.log("Inside Catch");
        console.error(error.message);
        return res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
};


module.exports = {
    loadCategoryList,
    addCategory,
    toggleCategoryStatus,
    editCategory,
}