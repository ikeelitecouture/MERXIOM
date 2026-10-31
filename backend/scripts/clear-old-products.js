require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env')
});

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const { Product } = require('../src/models');

(async () => {
  try {
    await connectDB();

    const before = await Product.collection.countDocuments({});
    console.log('Products before cleanup:', before);

    const result = await Product.collection.deleteMany({});
    const remaining = await Product.collection.countDocuments({});

    console.log('Products deleted:', result.deletedCount);
    console.log('Products remaining:', remaining);

    if (remaining !== 0) {
      throw new Error('Products remain after cleanup.');
    }

    console.log('SUCCESS: product collection is empty.');
  } catch (error) {
    console.error('CLEANUP FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
