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

// Serve static assets from the client build folder in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));

  // Catch-all route to serve the React SPA index.html for client-side routing
  app.get('*splat', (req, res, next) => {
    // Skip API routes so they fall through or return 404
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Nakma Server is Running');
  });
}

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
