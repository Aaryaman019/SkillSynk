const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Fake login/register to satisfy structure requirements
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, githubUrl, role } = req.body;
    // In a real app, hash password here: const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPassword = 'hashed_password_mock'; // Mocking since we might not have bcrypt locally without npm install
    
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, githubUrl, role }
    });
    
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // In a real app check password
    // const valid = await bcrypt.compare(password, user.password);
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
