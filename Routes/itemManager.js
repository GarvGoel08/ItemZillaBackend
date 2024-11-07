const express = require("express");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const path = require("path");
const { Storage } = require('@google-cloud/storage');
const FetchUser = require('../middleware/FetchUser')
const mongoose = require('mongoose');
const Item = require('../Schemas/Item');
const User = require('../Schemas/User');

const router = express.Router();

require('dotenv').config();

const storage = new Storage({
    projectId: process.env.FIREBASE_PROJECT_ID,
    credentials: {
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
    }
});

const bucketName = 'ecommerce-95870.appspot.com';
const storageBucket = storage.bucket(bucketName);
const storageOptions = multer.memoryStorage();
const upload = multer({ storage: storageOptions });

router.post('/Add',FetchUser, upload.single('itemImage'), async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (user.seller) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { ItemName, ItemDescription, quantity, price, discount, type } = req.body;
            const { originalname, buffer } = req.file;

            const fileName = Date.now() + '_' + originalname;
            const file = storageBucket.file(fileName);
            const stream = file.createWriteStream({
                metadata: {
                    contentType: req.file.mimetype,
                },
                resumable: false,
            });

            stream.on('error', (err) => {
                console.error(err);
                return res.status(500).send('Error uploading image to storage.');
            });

            stream.on('finish', async () => {
                const newItem = new Item({
                    ItemName,
                    ItemDescription,
                    quantity,
                    type,
                    price,
                    discount,
                    image: fileName,
                    Seller: {
                        ID: userId,
                        Name: user.name,
                    },
                });

                await newItem.save();

                res.status(201).json({ message: 'Item added successfully.' });
            });

            stream.end(buffer);
        }
        else{
            res.status(500).send('User not a Authorised Seller');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/Get', async (req, res) => {
    try {
        const items = await Item.find();
        const itemsWithImageUrl = items.map(item => ({
            ...item.toObject(),
            imageUrl: `https://storage.googleapis.com/${bucketName}/${item.image}`,
        }));

        return res.json(itemsWithImageUrl);
    }
    catch (error) {
        console.log(error);
        return res.status(420).json({ error: 'DB Error' });
    }
})

router.get("/GetItem", async (req, res) => {
    const ItemID = req.header("ItemID");
    try {
        const items = await Item.findById(ItemID);
  
        return res.json(items);
    }
    catch (error) {
        console.log(error);
        return res.status(420).json({ error: 'DB Error' });
    }
  })

module.exports = router;
