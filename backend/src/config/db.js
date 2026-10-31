const mongoose = require('mongoose');
async function connectDB() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('MERXIOM database connected');
}
module.exports = connectDB;
