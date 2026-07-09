const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db"); // <-- Import added

const app = express();

// Connect to Database
connectDB(); // <-- Function called

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("LinkShift Backend API is running!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is successfully running on port ${PORT}`);
});
// ... existing code ...
// Connect to Database
connectDB(); // <-- Function called

// Middleware
app.use(cors());
app.use(express.json());

// --- ADD THIS NEW ROUTE ---
app.use("/api", require("./routes/url"));
// --------------------------

app.get("/", (req, res) => {
  res.send("LinkShift Backend API is running!");
});
// ... existing code ...
