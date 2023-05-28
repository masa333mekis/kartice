const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
}, { collection: 'users' });

userSchema.pre('save', async function (next) {
  try {
    // Generate a salt with a factor of 10
    const salt = await bcrypt.genSalt(10);

    // Hash the password using the salt
    const hashedPassword = await bcrypt.hash(this.password, salt);

    // Replace the plain-text password with the hashed password
    this.password = hashedPassword;

    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.isValidPassword = async function (password) {
  try {
    // Compare the provided password with the hashed password
    return await bcrypt.compare(password, this.password);
  } catch (err) {
    throw err;
  }
};

module.exports = mongoose.model('User', userSchema);