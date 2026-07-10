const path = require('path');
const dotenv = require('dotenv');
const { checkAdminAccess } = require('../../server/lib/adminAccess');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const isAdmin = await checkAdminAccess(token);
        return res.status(200).json({ isAdmin });
    } catch (error) {
        console.error('Admin status check failed:', error);
        return res.status(500).json({ isAdmin: false });
    }
};
