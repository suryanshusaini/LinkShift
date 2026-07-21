const jwt = require("jsonwebtoken");

const optionalAuth = (req, res, next) => {
  // 1. Look for the wristband in the request headers
  const authHeader = req.header("Authorization");

  // 2. If there is no wristband, wave them through as anonymous (userId = null)
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.userId = null;
    return next();
  }

  // 3. If they have one, extract the token string
  const token = authHeader.split(" ")[1];

  try {
    // 4. Verify the wristband is real and hasn't expired using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. It's valid! Attach their unique user ID to the request object
    req.userId = decoded.userId;
    next();
  } catch (err) {
    // If the wristband is fake or expired, treat them as anonymous
    req.userId = null;
    next();
  }
};

module.exports = optionalAuth;
