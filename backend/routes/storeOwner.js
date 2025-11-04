const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const { passwordUpdateValidationRules, validate } = require('../utils/validators');
router.use(auth);
router.use(authorize('store_owner'));

router.get('/dashboard', async (req, res) => {
  try {
    const user_id = req.user.id;
    const userResult = await pool.query('SELECT store_id FROM users WHERE id = $1', [user_id]);

    if (userResult.rows.length === 0 || !userResult.rows[0].store_id) {
      return res.status(400).json({ message: 'Store owner is not associated with a store' });
    }

    const store_id = userResult.rows[0].store_id;

    const storeResult = await pool.query('SELECT * FROM stores WHERE id = $1', [store_id]);
    const store = storeResult.rows[0];

    const ratingResult = await pool.query(
      'SELECT COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as total_ratings FROM ratings WHERE store_id = $1',
      [store_id]
    );
    const usersResult = await pool.query(
      `SELECT u.id, u.name, u.email, u.address, r.rating, r.created_at as rated_at 
       FROM ratings r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.store_id = $1 
       ORDER BY r.created_at DESC`,
      [store_id]
    );

    res.json({
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
      },
      averageRating: parseFloat(ratingResult.rows[0].average_rating).toFixed(2),
      totalRatings: parseInt(ratingResult.rows[0].total_ratings),
      users: usersResult.rows.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        rating: user.rating,
        ratedAt: user.rated_at,
      })),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.put('/password', passwordUpdateValidationRules(), validate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user_id = req.user.id;
    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [user_id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      hashedPassword,
      user_id,
    ]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;