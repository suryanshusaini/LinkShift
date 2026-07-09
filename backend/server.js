const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors()); // Allows your React frontend to talk to this API
app.use(express.json()); // Allows your server to accept JSON data in request bodies

// A simple test route
app.get("/", (req, res) => {
  res.send("LinkShift Backend API is running!");
});

// Define the port (defaults to 5000 if not specified in .env)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is successfully running on port ${PORT}`);
});
