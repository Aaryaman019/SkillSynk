const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Secure Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, teamId } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Auto-generate name from email prefix 
    const name = email.split('@')[0];

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: { 
        email, 
        password: hashedPassword, 
        name, 
        role: role || 'developer',
        teamId: teamId || null
      }
    });

    // Auto log-in seamlessly after register
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, teamId: user.teamId } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Secure Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) return res.status(404).json({ error: 'Invalid email or password' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, teamId: user.teamId } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Secure Settings Update Endpoint
router.put('/settings', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch(e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const userId = decoded.userId;
    const { teamId, currentPassword, newPassword } = req.body;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const updateData = {};
    if (teamId !== undefined) {
      updateData.teamId = teamId;
    }
    
    if (currentPassword && newPassword) {
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ error: 'Incorrect current password' });
      updateData.password = await bcrypt.hash(newPassword, 10);
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });
    
    res.json({ message: 'Settings updated', user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, teamId: updatedUser.teamId } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
