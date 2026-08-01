import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Update user profile (Profile Completion step)
// @route   POST /api/user/profile
// @access  Private (Requires JWT)
router.post('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { country, state, age, university, faculty, department, profile_picture } = req.body;

    user.country = country || user.country;
    user.state = state || user.state;
    user.age = age || user.age;
    user.university = university || user.university;
    user.faculty = faculty || user.faculty;
    user.department = department || user.department;
    user.profile_picture = profile_picture || user.profile_picture;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      email: updatedUser.email,
      country: updatedUser.country,
      state: updatedUser.state,
      age: updatedUser.age,
      university: updatedUser.university,
      faculty: updatedUser.faculty,
      department: updatedUser.department,
      profile_picture: updatedUser.profile_picture,
      is_verified: updatedUser.is_verified,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

export default router;
