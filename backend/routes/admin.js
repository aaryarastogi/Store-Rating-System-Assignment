const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const { userValidationRules, storeValidationRules, validate } = require('../utils/validators');

router.use(auth);
router.use(authorize('system_administrator'));

router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const totalStores = await pool.query('SELECT COUNT(*) FROM stores');
    const totalRatings = await pool.query('SELECT COUNT(*) FROM ratings');

    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      totalStores: parseInt(totalStores.rows[0].count),
      totalRatings: parseInt(totalRatings.rows[0].count),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.post('/stores', storeValidationRules(), validate, async (req, res) => {
  try {
    const { name, email, address } = req.body;
    const existingStore = await pool.query('SELECT id FROM stores WHERE email = $1', [email]);

    if (existingStore.rows.length > 0) {
      return res.status(400).json({ message: 'Store already exists with this email' });
    }

    const result = await pool.query(
      'INSERT INTO stores (name, email, address) VALUES ($1, $2, $3) RETURNING *',
      [name, email, address || null]
    );

    res.status(201).json({
      message: 'Store added successfully',
      store: result.rows[0],
    });
  } catch (error) {
    console.error('Add store error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stores', async (req, res) => {
  try {
    const { name, email, address, sortBy = 'name', sortOrder = 'ASC' } = req.query;

    let query = 'SELECT s.*, COALESCE(AVG(r.rating), 0) as rating FROM stores s LEFT JOIN ratings r ON s.id = r.store_id';
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (name) {
      conditions.push(`s.name ILIKE $${paramCount}`);
      params.push(`%${name}%`);
      paramCount++;
    }

    if (email) {
      conditions.push(`s.email ILIKE $${paramCount}`);
      params.push(`%${email}%`);
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
    const validSortFields = ['name', 'email', 'address', 'rating'];
    const validSortOrder = ['ASC', 'DESC'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const order = validSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

    if (sortField === 'rating') {
      query += ` ORDER BY rating ${order}`;
    } else {
      query += ` ORDER BY s.${sortField} ${order}`;
    }

    const result = await pool.query(query, params);

    res.json({
      stores: result.rows.map(store => ({
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        rating: parseFloat(store.rating).toFixed(2),
      })),
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/users', userValidationRules(), validate, async (req, res) => {
  try {
    const { name, email, password, address, role, store_id } = req.body;
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    const validRoles = ['system_administrator', 'normal_user', 'store_owner'];
    const userRole = validRoles.includes(role) ? role : 'normal_user';
    if (userRole === 'store_owner' && store_id) {
      const storeExists = await pool.query('SELECT id FROM stores WHERE id = $1', [store_id]);
      if (storeExists.rows.length === 0) {
        return res.status(400).json({ message: 'Store not found' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (name, email, password, address, role, store_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, address, role, store_id',
      [name, email, hashedPassword, address || null, userRole, store_id || null]
    );

    res.status(201).json({
      message: 'User added successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Add user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { name, email, address, role, sortBy = 'name', sortOrder = 'ASC' } = req.query;

    let query = 'SELECT u.*, s.name as store_name FROM users u LEFT JOIN stores s ON u.store_id = s.id';
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (name) {
      conditions.push(`u.name ILIKE $${paramCount}`);
      params.push(`%${name}%`);
      paramCount++;
    }

    if (email) {
      conditions.push(`u.email ILIKE $${paramCount}`);
      params.push(`%${email}%`);
      paramCount++;
    }

    if (address) {
      conditions.push(`u.address ILIKE $${paramCount}`);
      params.push(`%${address}%`);
      paramCount++;
    }

    if (role) {
      conditions.push(`u.role = $${paramCount}`);
      params.push(role);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const validSortFields = ['name', 'email', 'address', 'role'];
    const validSortOrder = ['ASC', 'DESC'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const order = validSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

    query += ` ORDER BY u.${sortField} ${order}`;

    const result = await pool.query(query, params);

    res.json({
      users: result.rows.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        store_id: user.store_id,
        store_name: user.store_name,
      })),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      'SELECT u.*, s.name as store_name FROM users u LEFT JOIN stores s ON u.store_id = s.id WHERE u.id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];
    let userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      store_id: user.store_id,
      store_name: user.store_name,
    };
    if (user.role === 'store_owner' && user.store_id) {
      const ratingResult = await pool.query(
        'SELECT COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as total_ratings FROM ratings WHERE store_id = $1',
        [user.store_id]
      );

      userData.rating = parseFloat(ratingResult.rows[0].average_rating).toFixed(2);
      userData.total_ratings = parseInt(ratingResult.rows[0].total_ratings);
    }

    res.json({ user: userData });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;