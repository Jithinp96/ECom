const Wallet = require("../models/walletModel");

const createWalletForUser = async (req, res, next) => {
    try {
        // Assuming req.user contains the newly registered user object
        const newUser = req.user;

        // Check if req.user exists
        if (!newUser) {
            return res.status(400).send({ error: 'User data not found.' });
        }

        // Check if the user already has a wallet
        const existingWallet = await Wallet.findOne({ user: newUser._id });
        if (existingWallet) {
            return res.status(400).send({ error: 'Wallet already exists for this user.' });
        }

        // Create a new wallet for the user
        const newWallet = new Wallet({ user: newUser._id });
        await newWallet.save();

        next();
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Internal server error.' });
    }
};

module.exports = {
    createWalletForUser,
}