const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const storeOwnerRoutes = require('./routes/storeOwner');
const { auth } = require('./middleware/auth');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const { pool } = require('./config/database');
    const result = await pool.query(
      'SELECT id, name, email, address, role, store_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/store-owner', storeOwnerRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Database connection: OK`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error.message);
    console.error('Please ensure PostgreSQL is running and the database exists.');
    console.error('You can create the database with: createdb store_rating_db');
    console.error(`Starting server anyway on port ${PORT} - database operations will fail until connected.`);
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} (database not connected)`);
    });
  });

module.exports = app;