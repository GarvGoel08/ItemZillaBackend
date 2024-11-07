const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require('crypto');
require("dotenv").config();

const Item = require('../Schemas/Item');
const Order = require("../Schemas/Order.js");
const FetchUser = require("../middleware/FetchUser.js");
const razorpay = new Razorpay({
  key_id: process.env.RP_KEY,
  key_secret: process.env.RP_SECRET,
});

router.get('/get-orders', FetchUser, async(req,res) => {
  const userId = req.user.id;
  const orders = await Order.find({
    UserID: new mongoose.Types.ObjectId(userId),
  });
  return res.json(orders);
})

router.post("/create-order", FetchUser, async (req, res) => {
  try {
    const { items, addressId, paymentMethod } = req.body;
    const userId = req.user.id;
    console.log(addressId);
    let orderDate;
    let orderAmount = 0;

    items.forEach((item) => {
      orderAmount +=
        item.quantity * 100 * (item.price - (item.price * item.discount) / 100);
    });

    if (paymentMethod === "razorpay") {

      const razorpayOrder = await createRazorpayOrder(orderAmount);

      res.status(201).json({
        message: "Razorpay order created successfully.",
        razorpayOrder: razorpayOrder,
      });
    } else if (paymentMethod === "cod") {
      orderDate = new Date();
      const order = new Order({
        UserID: new mongoose.Types.ObjectId(userId),
        OrderDate: orderDate,
        Items: items.map((item) => ({
          item: new mongoose.Types.ObjectId(item._id),
          quantity: item.quantity,
          pricePerItem: item.price*(1-item.discount/100),
        })),
        Address: addressId,
        COD: true,
        OrderStatus: "Order Placed",
      });

      await order.save();

      for (const item of items) {
        const updatedItem = await Item.findByIdAndUpdate(
          item._id,
          {
            $inc: { quantity: -item.quantity },
          },
          { new: true }
        );
      }

      res.status(201).json({
        message: "Order created successfully.",
      });
    } else {
      return res.status(400).json({ message: "Invalid payment method." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

async function createRazorpayOrder(orderAmount) {
  return new Promise((resolve, reject) => {
    razorpay.orders.create(
      {
        amount: orderAmount,
        currency: "INR",
        receipt: "order_receipt",
        payment_capture: 1,
      },
      (error, order) => {
        if (error) {
          console.error(error);
          reject("error");
        } else {
          resolve(order);
        }
      }
    );
  });
}

router.post("/paymentverification", FetchUser,async(req,res)=>{
  const { items, addressId, paymentMethod } = req.body;
  const userId = req.user.id;
  const razorpay_order_id = req.header('razorpay_order_id')
  const razorpay_signature = req.header('razorpay_signature')
  const razorpay_payment_id = req.header('razorpay_payment_id')
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedsgnature =crypto.createHmac('sha256',process.env.RP_SECRET).update(body.toString()).digest('hex')
  const isauth = expectedsgnature === razorpay_signature;
  if(isauth){
    orderDate = new Date();
    const order = new Order({
      UserID: new mongoose.Types.ObjectId(userId),
      OrderDate: orderDate,
      Items: items.map((item) => ({
        item: new mongoose.Types.ObjectId(item._id),
        quantity: item.quantity,
        pricePerItem: item.price,
      })),
        Address: addressId,
        COD: false,
      OrderStatus: "Order Placed",
    });
    await order.save();

    for (const item of items) {
      const updatedItem = await Item.findByIdAndUpdate(
        item._id,
        {
          $inc: { quantity: -item.quantity },
        },
        { new: true }
      );
    }
   
    res.status(201).json({success:true});
  }
  else{
   res.status(400).json({success:false});
  }
})

module.exports = router;
