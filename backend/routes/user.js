const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const { ratingValidationRules, passwordUpdateValidationRules, validate } = require('../utils/validators');

router.use(auth);
router.use(authorize('normal_user'));
router.get('/stores', async (req, res) => {
  try {
    const { name, address, sortBy = 'name', sortOrder = 'ASC' } = req.query;

    let query = 'SELECT s.*, COALESCE(AVG(r.rating), 0) as rating FROM stores s LEFT JOIN ratings r ON s.id = r.store_id';
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (name) {
      conditions.push(`s.name ILIKE $${paramCount}`);
      params.push(`%${name}%`);
      paramCount++;
    }

    if (address) {
      conditions.push(`s.address ILIKE $${paramCount}`);
      params.push(`%${address}%`);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY s.id';
    const validSortFields = ['name', 'address', 'rating'];
    const validSortOrder = ['ASC', 'DESC'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const order = validSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

    if (sortField === 'rating') {
      query += ` ORDER BY rating ${order}`;
    } else {
      query += ` ORDER BY s.${sortField} ${order}`;
    }

    const result = await pool.query(query, params);
    const userId = req.user.id;
    const userRatings = await pool.query(
      'SELECT store_id, rating FROM ratings WHERE user_id = $1',
      [userId]
    );

    const userRatingsMap = {};
    userRatings.rows.forEach(r => {
      userRatingsMap[r.store_id] = r.rating;
    });

    res.json({
      stores: result.rows.map(store => ({
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        rating: parseFloat(store.rating).toFixed(2),
        userRating: userRatingsMap[store.id] || null,
      })),
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/stores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const storeResult = await pool.query(
      'SELECT s.*, COALESCE(AVG(r.rating), 0) as rating FROM stores s LEFT JOIN ratings r ON s.id = r.store_id WHERE s.id = $1 GROUP BY s.id',
      [id]
    );

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const store = storeResult.rows[0];
    const userRatingResult = await pool.query(
      'SELECT rating FROM ratings WHERE user_id = $1 AND store_id = $2',
      [userId, id]
    );

    res.json({
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        rating: parseFloat(store.rating).toFixed(2),
        userRating: userRatingResult.rows.length > 0 ? userRatingResult.rows[0].rating : null,
      },
    });
  } catch (error) {
    console.error('Get store details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.post('/ratings', ratingValidationRules(), validate, async (req, res) => {
  try {
    const { store_id, rating } = req.body;
    const user_id = req.user.id;

    const storeExists = await pool.query('SELECT id FROM stores WHERE id = $1', [store_id]);
    if (storeExists.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }
    const existingRating = await pool.query(
      'SELECT id FROM ratings WHERE user_id = $1 AND store_id = $2',
      [user_id, store_id]
    );

    if (existingRating.rows.length > 0) {
      const result = await pool.query(
        'UPDATE ratings SET rating = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND store_id = $3 RETURNING *',
        [rating, user_id, store_id]
      );

      return res.json({
        message: 'Rating updated successfully',
        rating: result.rows[0],
      });
    } else {
      const result = await pool.query(
        'INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3) RETURNING *',
        [user_id, store_id, rating]
      );

      return res.status(201).json({
        message: 'Rating submitted successfully',
        rating: result.rows[0],
      });
    }
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/ratings/:id', ratingValidationRules(), validate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const user_id = req.user.id;

    const result = await pool.query(
      'UPDATE ratings SET rating = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [rating, id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Rating not found or unauthorized' });
    }

    res.json({
      message: 'Rating updated successfully',
      rating: result.rows[0],
    });
  } catch (error) {
    console.error('Update rating error:', error);
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