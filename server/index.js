const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { checkAdminAccess } = require('./lib/adminAccess');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Nakma Server is Running');
});

app.get('/api/auth/admin-status', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const isAdmin = await checkAdminAccess(token);
    res.json({ isAdmin });
  } catch (error) {
    console.error('Admin status check failed:', error);
    res.status(500).json({ isAdmin: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
