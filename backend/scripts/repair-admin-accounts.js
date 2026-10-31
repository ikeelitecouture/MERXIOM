require('dotenv').config({ path: '.env' });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const targets = [
  'danieladepoju446@gmail.com',
  'adepojufolashadeapeke@gmail.com'
];

const allowed = new Set(
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(Boolean)
);

if (!process.env.MONGODB_URI) {
  console.error('STOP: MONGODB_URI is missing from backend/.env');
  process.exit(1);
}

if (!targets.every(email => allowed.has(email))) {
  console.error('STOP: Both target emails must be present in ADMIN_EMAILS.');
  process.exit(1);
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve =>
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

function hiddenPassword(prompt) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;

    if (!input.isTTY || typeof input.setRawMode !== 'function') {
      reject(new Error('Hidden password input requires a normal Termux terminal.'));
      return;
    }

    let value = '';
    process.stdout.write(prompt);
    input.setEncoding('utf8');
    input.setRawMode(true);
    input.resume();

    const cleanup = () => {
      input.removeListener('data', onData);
      input.setRawMode(false);
      process.stdout.write('\n');
    };

    const onData = key => {
      if (key === '\u0003') {
        cleanup();
        reject(new Error('Cancelled.'));
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

      if (key >= ' ' && key !== '\u001b') value += key;
    };

    input.on('data', onData);
  });
}

async function main() {
  const passwords = [];

  for (const email of targets) {
    console.log('\nAdmin account:', email);

    let password;
    let confirmation;

    do {
      password = await hiddenPassword(
        'Choose a new password (minimum 12 characters): '
      );
      confirmation = await hiddenPassword('Enter it again: ');

      if (password.length < 12) {
        console.log('Use at least 12 characters.');
      } else if (password !== confirmation) {
        console.log('Passwords do not match. Try again.');
      }
    } while (password.length < 12 || password !== confirmation);

    passwords.push(password);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const { User } = require('../src/models');

  for (let i = 0; i < targets.length; i++) {
    const email = targets[i];
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        name: email.split('@')[0],
        phone: ''
      });
    }

    if (!user.name || !user.name.trim()) {
      user.name = email.split('@')[0];
    }

    user.passwordHash = await bcrypt.hash(passwords[i], 12);
    user.role = 'admin';
    user.emailVerified = true;
    user.resetCodeHash = undefined;
    user.resetExpiresAt = undefined;
    user.verificationCodeHash = undefined;
    user.verificationExpiresAt = undefined;

    await user.save();
    console.log('Admin account repaired:', email);
  }

  console.log('\nBoth admin accounts are ready for password login.');
  console.log('Passwords were not printed or saved by this script.');
}

main()
  .catch(error => {
    console.error('\nRepair failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
