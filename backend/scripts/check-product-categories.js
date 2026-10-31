require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const { Product, Category } = require('../src/models');

(async () => {
  try {
    await connectDB();

    const categories = await Category.find({}).select('_id name slug active').lean();
    const validIds = new Set(categories.map(c => String(c._id)));
    const collection = mongoose.connection.collection(Product.collection.name);

    const total = await collection.countDocuments({});
    const cursor = collection.find(
      {},
      { projection: { name: 1, category: 1, status: 1, stock: 1, isPopular: 1 } }
    );

    let checked = 0;
    let invalidCount = 0;
    const examples = [];

    for await (const p of cursor) {
      checked++;
      const category = p.category;
      const valid = category != null &&
        typeof category === 'object' &&
        validIds.has(String(category));

      if (!valid) {
        invalidCount++;
        if (examples.length < 30) {
          examples.push({
            product: p.name || '(unnamed product)',
            category: category == null ? null : String(category),
            categoryType: category == null ? String(category) : typeof category,
            status: p.status || '(missing)',
            stock: p.stock ?? '(missing)'
          });
        }
      }
    }

    console.log('\n========== READ-ONLY CATEGORY AUDIT ==========');
    console.log('Products in database:', total);
    console.log('Products checked:', checked);
    console.log('Categories found:', categories.length);
    console.log('Products with missing/invalid category references:', invalidCount);
    console.log('\nExisting categories:');
    for (const c of categories) {
      console.log(`- ${c.name} | slug=${c.slug} | active=${c.active} | id=${c._id}`);
    }
    console.log('\nInvalid product examples (maximum 30):');
    console.log(JSON.stringify(examples, null, 2));
    console.log('\nNo database records were modified.');
  } catch (err) {
    console.error('Audit failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
