const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/users');

// Password validation helper
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return errors;
};

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Sanitize and validate name
    const sanitizedName = validator.trim(name);
    if (validator.isEmpty(sanitizedName)) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }
    if (sanitizedName.length < 2 || sanitizedName.length > 50) {
      return res.status(400).json({ message: 'Name must be between 2 and 50 characters' });
    }

    // Sanitize and validate email
    const sanitizedEmail = validator.normalizeEmail(email);
    if (!validator.isEmail(sanitizedEmail)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Validate password complexity
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Password does not meet requirements',
        errors: passwordErrors 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: sanitizedName,
      email: sanitizedEmail,
      password: hashedPassword
    });

    res.status(201).json({ 
      message: 'User registered successfully',
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Sanitize email
    const sanitizedEmail = validator.normalizeEmail(email);
    if (!validator.isEmail(sanitizedEmail)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};