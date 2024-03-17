const {Offer} = require("../models/offerModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");

const loadOffer = async (req, res) => {
    try {
        const offers = await Offer.find();
        res.render ('offerlist', { offers });
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).send('An error occurred while fetching offers.');
    }
}

const loadAddOffer = async (req, res) => {
    try {
        res.render ('addoffer');
    } catch (error) {
        console.log(error);
    }
}

const addOffer = async (req, res) => {
    try {
        // Extract offer details from the request body
        const { offerName, discountPercentage, startDate, expiryDate } = req.body;

        // Create a new Offer document
        const newOffer = new Offer({
            offerName,
            discountPercentage,
            startDate,
            expiryDate
        });

        // Save the new offer to the database
        await newOffer.save();
        res.redirect('/admin/offer');
    } catch (error) {
        console.error('Error adding offer:', error);
        res.status(500).send('An error occurred while adding the offer.');
    }
}

const loadEditOffer = async (req, res) => {
  try {
    const offerId = req.params.offerId;
    const offer = await Offer.findById(offerId);

    if (!offer) {
      return res.status(404).send('Offer not found');
  }

    res.render('editoffer', {offer: offer})
  } catch (error) {
    console.log(error);
  }
}

const editOffer = async (req, res) => {
  try {
    const offerId = req.params.offerId;
    const {
      offerName, 
      discountPercentage,
      startDate,
      expiryDate
    } = req.body;

    await Offer.findByIdAndUpdate(offerId, {
      offerName: offerName,
      discountPercentage: discountPercentage,
      startDate: startDate,
      expiryDate: expiryDate,
    });

    res.redirect('/admin/offer');

  } catch (error) {
    console.log(error);
  }
}

const loadProductApplyOffer = async (req, res) => {
    try {
        const offers = await Offer.find();
        const productId = req.query.id
        const product = await Product.findOne({_id:productId})

        res.render("selectproductofferlist", { offers, productId, product });
    } catch (error) {
        console.log(error);
    }
}

const applyProductOffer = async (req,res)=>{
    try {
      const {offer,product} = req.body;
      const offerId = offer;
      const off = await Offer.findOne({_id:offerId})
      const currentDate = new Date()
     
     await Product.findByIdAndUpdate(
        {_id:product},
        {
          $set:{
            offer:offerId
          }
        }
      )
      res.json({success:true})
      
    } catch (error) {
      console.log(error.message);
    }
}

const removeProductOffer = async (req,res)=>{
    try {
      const {offerId , productId} = req.body
      await Product.findByIdAndUpdate(
        {_id:productId},
        {$unset:{offer:''}}
      )
      res.json({success:true})
    } catch (error) {
      console.log(error.message);
    }
}

const loadCategoryApplyOffer = async (req, res) => {
    try {
        const offers = await Offer.find();
        const categoryId = req.query.id
        const category = await Category.findOne({_id:categoryId})

        res.render("selectcategoryofferlist", { offers, categoryId, category });
    } catch (error) {
        console.log(error);
    }
}

const applyCategoryOffer = async (req,res)=>{
    try {
      const {offer,category} = req.body;
      const offerId = offer;
      const off = await Offer.findOne({_id:offerId})
      const currentDate = new Date()
     
     await Category.findByIdAndUpdate(
        {_id:category},
        {
          $set:{
            offer:offerId
          }
        }
      )
      res.json({success:true})
      
    } catch (error) {
      console.log(error.message);
    }
}

const removeCategoryOffer = async (req,res)=>{
    try {
      const {offerId , categoryId} = req.body
      await Category.findByIdAndUpdate(
        {_id:categoryId},
        {$unset:{offer:''}}
      )
      res.json({success:true})
    } catch (error) {
      console.log(error.message);
    }
}


module.exports = {
    loadOffer,
    loadAddOffer,
    addOffer,
    loadEditOffer,
    editOffer,
    loadProductApplyOffer,
    applyProductOffer,
    removeProductOffer,
    loadCategoryApplyOffer,
    applyCategoryOffer,
    removeCategoryOffer,
    
}