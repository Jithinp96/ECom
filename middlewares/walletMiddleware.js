const Wallet = require("../models/walletModel");

// ========== FOR CREATING A WALLET FOR NEWLY REGISTERING USER ===========
const createWalletForUser = async (req, res, next) => {
    try {
        const newUser = req.user;

        if (!newUser) {
            return res.status(400).send({ error: 'User data not found.' });
        }

        const existingWallet = await Wallet.findOne({ user: newUser._id });
        if (existingWallet) {
            return res.status(400).send({ error: 'Wallet already exists for this user.' });
        }

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