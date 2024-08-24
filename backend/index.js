const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Route
app.get("/", (req, res) => {
    try {
        res.status(200).send({"msg": "data connected"});
    } catch (error) {
        console.log(error);
        res.status(500).send({"error": error.message});
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
