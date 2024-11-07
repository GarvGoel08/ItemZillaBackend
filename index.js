const express = require('express')
const app = express()
require("dotenv").config();
const port = 5000
const cors = require('cors');
const {connectToDatabase} = require("./db");
connectToDatabase(); 
app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://item-zilla-frontend.vercel.app', 'http://item-zilla-frontend.vercel.app'],
    credentials: true,
  })
);

app.use('/api/auth', require('./Routes/auth'));
app.use('/api/categories', require('./Routes/categoryManager'));
app.use('/api/items', require('./Routes/itemManager'));
app.use('/api/orders', require('./Routes/OrderManager'));
app.use('/api/address', require('./Routes/AddressManager'));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
