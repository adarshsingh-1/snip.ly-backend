const validator = require('validator');
const Link = require('../models/links');

// NORMALIZE AND VALIDATE URL
const normalizeUrl = (url) => {
  if (!url) return null;
  
  let normalized = validator.trim(url);

  if (!normalized.match(/^https?:\/\//i)) {
    normalized = `http://${normalized}`;
  }

  if (!validator.isURL(normalized, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
    allow_underscores: true
  })) {
    return null;
  }

  return normalized;
};

// CREATE LINK
exports.createLink = async (req, res) => {
  try {
    // IMPORT nanoid (ESM ONLY)
    const { customAlphabet } = await import('nanoid');
    const nanoid = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', 6);

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

    let shortId;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      shortId = nanoid();
      const exists = await Link.findOne({ shortId });
      if (!exists) break;
      attempts++;
    }

    if (attempts === maxAttempts) {
      return res.status(500).json({ message: 'Failed to generate unique short ID' });
    }

    const link = await Link.create({
      shortId,
      originalUrl: normalizedUrl,
      userId: req.userId
    });

    const shortDomain = process.env.SHORT_DOMAIN || `http://localhost:${process.env.PORT || 3000}`;

    return res.status(201).json({
      ...link.toObject(),
      shortUrl: `${shortDomain}/${shortId}`
    });

  } catch (err) {
    console.error('Create link error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET USER LINKS
exports.getUserLinks = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const links = await Link.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.json(Array.isArray(links) ? links : []);
  } catch (err) {
    console.error('Get links error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE LINK
exports.deleteLink = async (req, res) => {
  try {
    const link = await Link.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    await Link.deleteOne({ _id: req.params.id });
    return res.json({ message: 'Link deleted successfully' });

  } catch (err) {
    console.error('Delete link error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// REDIRECT LINK
exports.redirectLink = async (req, res) => {
  try {
    const link = await Link.findOne({ shortId: req.params.shortId });
    if (!link) {
      return res.status(404).send('Link not found');
    }

    link.clicks += 1;
    await link.save();

    const target = link.originalUrl.match(/^https?:\/\//i)
      ? link.originalUrl
      : `https://${link.originalUrl}`;

    return res.redirect(target);

  } catch (err) {
    console.error('Redirect error:', err);
    return res.status(500).send('Server error');
  }
};
