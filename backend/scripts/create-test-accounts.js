'use strict';

const path = require('node:path');
require('dotenv').config({
  path: path.join(__dirname, '..', '.env')
});

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const { User } = require('../src/models');

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askHidden(question) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;

    if (!input.isTTY || typeof input.setRawMode !== 'function') {
      reject(new Error(
        'Hidden password input requires an interactive Termux terminal.'
      ));
      return;
    }

    let value = '';
    let finished = false;
    process.stdout.write(question);
    input.setEncoding('utf8');
    input.setRawMode(true);
    input.resume();

    function cleanup() {
      if (finished) return;
      finished = true;
      input.removeListener('data', onData);
      input.setRawMode(false);
      process.stdout.write('\n');
    }

    function onData(key) {
      if (key === '\u0003') {
        cleanup();
        reject(new Error('Cancelled by user.'));
        return;
      }

      if (key === '\r' || key === '\n') {
        cleanup();
        resolve(value);
        return;
      }

      if (key === '\u007f' || key === '\b') {
        value = value.slice(0, -1);
        return;
      }

      if (key >= ' ' && key !== '\u001b') {
        value += key;
      }
    }

    input.on('data', onData);
  });
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function collectAccount(role) {
  console.log(`\n=== ${role.toUpperCase()} TEST ACCOUNT ===`);

  const name = await ask('Full name: ');
  const email = (await ask('Email address: ')).toLowerCase();
  const phone = await ask('Phone (optional, press Enter to skip): ');

  let storeName = '';
  if (role === 'seller') {
    storeName = await ask('Test store name: ');
  }

  const password = await askHidden('Password (minimum 8 characters): ');
  const confirmPassword = await askHidden('Confirm password: ');

  if (!name || name.length > 120) {
    throw new Error('Name is required and must be 120 characters or fewer.');
  }
  if (!validEmail(email)) {
    throw new Error(`Invalid email address for the ${role} account.`);
  }
  if (password.length < 8) {
    throw new Error('Password must contain at least 8 characters.');
  }
  if (password !== confirmPassword) {
    throw new Error('The passwords do not match.');
  }
  if (role === 'seller' && !storeName) {
    throw new Error('A store name is required for the seller account.');
  }

  return { role, name, email, phone, storeName, password };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing from backend/.env.');
  }

  console.log('MERXIOM LOCAL TEST-ACCOUNT CREATOR');
  console.log('This does not edit .env or change public registration.');
  console.log('Use test email addresses you control.');
  console.log('Existing accounts will never be overwritten.');

  const buyer = await collectAccount('buyer');
  const seller = await collectAccount('seller');

  if (buyer.email === seller.email) {
    throw new Error('Buyer and seller must have different email addresses.');
  }

  console.log('\nReview the account roles:');
  console.log(`Buyer:  ${buyer.email}`);
  console.log(`Seller: ${seller.email}`);
  console.log('Passwords are hidden and will not be displayed.');

  const confirmation = await ask(
    '\nType CREATE TEST ACCOUNTS to continue: '
  );

  if (confirmation !== 'CREATE TEST ACCOUNTS') {
    console.log('Cancelled. No accounts were created.');
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  });

  const emails = [buyer.email, seller.email];
  const existing = await User.find({ email: { $in: emails } })
    .select('email')
    .lean();

  if (existing.length) {
    throw new Error(
      'At least one email already exists. Nothing was created or modified. ' +
      'Choose two new email addresses and run the script again.'
    );
  }

  const accounts = [buyer, seller];
  const created = [];

  try {
    for (const account of accounts) {
      const userData = {
        name: account.name,
        email: account.email,
        phone: account.phone,
        passwordHash: await bcrypt.hash(account.password, 12),
        role: account.role,
        emailVerified: true
      };

      if (account.role === 'seller') {
        userData.store = {
          name: account.storeName,
          description: 'MERXIOM test store',
          verified: false
        };
      }

      const user = await User.create(userData);
      created.push(user._id);
      console.log(`Created verified ${account.role} test account: ${user.email}`);
    }

    console.log('\nSUCCESS: Both test accounts were created.');
    console.log('You can now test signing in with each account.');
    console.log('Seller store verification remains false.');
    console.log('This does not configure SMTP or real email delivery.');
  } catch (error) {
    if (created.length) {
      await User.deleteMany({ _id: { $in: created } });
      console.error('Partial creation was rolled back.');
    }
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(`\nSTOP: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
