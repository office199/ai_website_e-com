#!/usr/bin/env node
/**
 * Create (or promote) an administrator account in MongoDB.
 *
 * Usage examples:
 *   node backend/scripts/create-admin.js --email owner@example.com --password "S3cure!pass" --name "Store Owner"
 *   ADMIN_EMAIL=owner@example.com ADMIN_PASSWORD='S3cure!pass' ADMIN_NAME='Store Owner' \
 *     node backend/scripts/create-admin.js
 *
 * Or from the backend/ folder:
 *   npm run create:admin -- --email owner@example.com --password 'S3cure!pass' --name 'Store Owner'
 *
 * If the email already exists the user's role is upgraded to "admin" (and the
 * password is reset only when --password is supplied).
 *
 * Requires backend/.env with MONGODB_URI configured (same as the API server).
 */

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = true;
    }
  }
  return out;
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = (args.email || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = args.password || process.env.ADMIN_PASSWORD || '';
  const name = (args.name || process.env.ADMIN_NAME || 'Administrator').trim();

  const { MONGODB_URI } = process.env;
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set. Configure backend/.env before running this script.');
    process.exit(1);
  }
  if (!isValidEmail(email)) {
    console.error('A valid --email (or ADMIN_EMAIL) is required.');
    process.exit(1);
  }
  if (password && password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }
  if (name.length < 2 || name.length > 80) {
    console.error('Name must be between 2 and 80 characters.');
    process.exit(1);
  }

  const userSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
      passwordHash: { type: String, required: true, select: false },
      role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    },
    { timestamps: true }
  );

  const User = mongoose.models.User || mongoose.model('User', userSchema);

  await mongoose.connect(MONGODB_URI);

  try {
    const existing = await User.findOne({ email }).select('+passwordHash');

    if (existing) {
      const updates = { role: 'admin', name };
      if (password) {
        updates.passwordHash = await bcrypt.hash(password, 12);
      }
      await User.updateOne({ _id: existing._id }, { $set: updates });
      console.log(`Promoted existing user ${email} to administrator.`);
      if (!password) {
        console.log('(Password not changed. Pass --password to reset it.)');
      }
    } else {
      if (!password) {
        console.error('This email does not exist yet — you must supply --password to create a new admin.');
        process.exit(1);
      }
      const passwordHash = await bcrypt.hash(password, 12);
      await User.create({ name, email, passwordHash, role: 'admin' });
      console.log(`Created administrator ${email}.`);
    }

    console.log('You can now log in at /login and open /admin.');
  } catch (err) {
    console.error('Failed to create administrator:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
