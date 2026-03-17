const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/project/:projectId', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({ where: { projectId: parseInt(req.params.projectId) }});
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const task = await prisma.task.create({ data: req.body });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
