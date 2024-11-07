const express = require("express");
const { body, validationResult } = require("express-validator");
const Category = require("../Schemas/Category");
const router = express.Router();
const Secret = process.env.AUTH_TOKEN;

router.post("/Add", async (req, res) => {
  const token = req.header("auth-token");
  if (token === Secret) {
    const { categoryName, categoryIcon } = req.body;
    const newItem = new Category({
      categoryName,
      categoryIcon,
    });

    await newItem.save();
    return res.status(201).json({ message: 'Category added successfully.' });
  }
});

router.get("/Get", async (req, res) => {
    try {
        const items = await Category.find();

        return res.json(items);
    }
    catch (error) {
        console.log(error);
        return res.status(420).json({ error: 'DB Error' });
    }
})



module.exports = router;