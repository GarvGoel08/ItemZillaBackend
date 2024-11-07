const express = require('express');
const router = express.Router();
const FetchUser = require('../middleware/FetchUser');
const Address = require('../Schemas/Address');

router.post('/Add', FetchUser, async (req, res) => {
  try {
    const { UserID } = req.user.id;
    const {
      AddressName,
      StreetAdress,
      Apartment,
      Town,
      Pincode,
      Mobile,
      Email,
    } = req.body;

    const existingAddress = await Address.findOne({
      UserID,
      AddressName,
      StreetAdress,
      Apartment,
      Town,
      Pincode,
      Mobile,
      Email,
    });

    if (existingAddress) {
      return res.json(existingAddress);
    }

    const newAddress = new Address({
      UserID,
      AddressName,
      StreetAdress,
      Apartment,
      Town,
      Pincode,
      Mobile,
      Email,
    });

    const address = await newAddress.save();
    res.json(address);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/Get', FetchUser, async (req, res) => {
  try {
    const { UserID } = req.user.id;
    const addresses = await Address.find({ UserID });
    res.json(addresses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/GetByID', FetchUser, async (req, res) => {
  try {
    const { UserID } = req.user.id;
    const {address} = req.body;

    // Check if the address belongs to the user
    if (!address || address.UserID.toString() !== UserID.toString()) {
      return res.status(404).json({ msg: 'Address not found' });
    }

    res.json(address);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Address not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
