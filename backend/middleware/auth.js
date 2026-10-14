// Compatibility export for routes that still need optional authentication.
// Authentication now uses opaque, revocable HTTP-only cookie sessions.
module.exports = require("./sessionAuth").optionalSession;
