const express = require('express');
const { createLink, getUserLinks, redirectLink, deleteLink } = require('../controllers/linkController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, createLink);
router.get('/my', auth, getUserLinks);
router.delete('/:id', auth, deleteLink);

module.exports = router;