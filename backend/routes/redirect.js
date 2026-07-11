const express = require('express');
const router = express.Router();
const Url = require('../models/Url');

// The GET Route for Redirection (MongoDB only)
router.get('/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    const urlDoc = await Url.findOne({ shortId });

    if (urlDoc) {
      // Increment click analytics and save
      urlDoc.clicks++;
      await urlDoc.save();
      // Redirect to the original URL
      return res.redirect(urlDoc.originalUrl);
    } else {
      return res.status(404).json('No URL found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});

module.exports = router;
