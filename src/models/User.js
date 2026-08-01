import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  country: {
    type: String,
    lowercase: true,
  },
  otp: String,
  otp_expiry: Date,
  state: String,
  age: Number,
  university: String,
  faculty: String,
  department: String,
  profile_picture: {
    type: String,
    default: ''
  },
  total_score: {
    type: Number,
    default: 0
  },
  is_verified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Hash password before saving to database
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create a compound index for leaderboard sorting by country
userSchema.index({ country: 1, total_score: -1 });

const User = mongoose.model('User', userSchema);

export default User;
