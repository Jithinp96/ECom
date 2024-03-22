const {Offer} = require("../models/offerModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");

// ========== FOR LOADING OFFER LIST ===========
const loadOffer = async (req, res) => {
  try {
      const offers = await Offer.find();

      const currentDate = new Date();
        const activeOffers = [];
        const expiredOffers = [];

        offers.forEach(offer => {
            const startDate = new Date(offer.startDate);
            const expiryDate = new Date(offer.expiryDate);

            if (currentDate >= startDate && currentDate <= expiryDate) {
                activeOffers.push(offer);
            } else {
                expiredOffers.push(offer);
            }
        });


      res.render ('offerlist', { activeOffers, expiredOffers });
  } catch (error) {
      console.error('Error fetching offers:', error);
      res.status(500).send('An error occurred while fetching offers.');
  }
}

// ========== FOR LOADING ADD OFFER PAGE ===========
const loadAddOffer = async (req, res) => {
    try {
        res.render ('addoffer');
    } catch (error) {
        console.log(error);
    }
}

// ========== FOR ADDING AN OFFER ===========
const addOffer = async (req, res) => {
    try {
        const { offerName, discountPercentage, startDate, expiryDate } = req.body;

        const newOffer = new Offer({
            offerName,
            discountPercentage,
            startDate,
            expiryDate
        });

        await newOffer.save();
        res.redirect('/admin/offer');
    } catch (error) {
        console.error('Error adding offer:', error);
        res.status(500).send('An error occurred while adding the offer.');
    }
}

// ========== FOR LAODING EDIT OFFER PAGE ===========
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

// ========== FOR EDITING AN OFFER ===========
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

// ========== FOR LOADING THE PAGE FOR APPLYING PRODUCT OFFER ===========
const loadProductApplyOffer = async (req, res) => {
  try {
      const currentDate = new Date();
      const offers = await Offer.find();
      const productId = req.query.id;
      const product = await Product.findOne({_id: productId});

      // Separate offers into active and expired
      const activeOffers = offers.filter(offer => new Date(offer.expiryDate) > currentDate);
      const expiredOffers = offers.filter(offer => new Date(offer.expiryDate) <= currentDate);

      res.render("selectproductofferlist", { activeOffers, expiredOffers, productId, product });
  } catch (error) {
      console.log(error);
  }
}

// ========== FOR APPLYING AN OFFER TO PRODUCT ===========
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

// ========== FOR REMOVING A PRODUCT OFFER ===========
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

// ========== FOR LOADING THE PAGE FOR APPLYING CATEGORY OFFER ===========
const loadCategoryApplyOffer = async (req, res) => {
  try {
      const currentDate = new Date();
      const offers = await Offer.find();
      const categoryId = req.query.id
      const category = await Category.findOne({_id:categoryId})

      const activeOffers = offers.filter(offer => new Date(offer.expiryDate) > currentDate);
      const expiredOffers = offers.filter(offer => new Date(offer.expiryDate) <= currentDate);

      res.render("selectcategoryofferlist", { activeOffers, expiredOffers, categoryId, category });
  } catch (error) {
      console.log(error);
  }
}

// ========== FOR APPLYING CATEGORY OFFER ===========
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

// ========== FOR REMOVING CATEGORY OFFER ===========
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