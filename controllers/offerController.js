const {Offer} = require("../models/offerModel");

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
module.exports = {
    loadOffer,
    loadAddOffer,
    addOffer,
}