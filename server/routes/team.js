const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  try {
    const teamMember = await prisma.teamMember.create({ data: req.body });
    res.status(201).json(teamMember);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:projectId', async (req, res) => {
  try {
    const team = await prisma.teamMember.findMany({ 
      where: { projectId: parseInt(req.params.projectId) },
      include: { user: true }
    });
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
