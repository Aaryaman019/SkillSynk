const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables based on the root directory
dotenv.config({ path: '../.env' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'SkillSynk API is running' });
});

// Import Routes
const authRoutes = require('./routes/auth');
const projectsRoutes = require('./routes/projects');
const teamRoutes = require('./routes/team');
const tasksRoutes = require('./routes/tasks');
const skillsRoutes = require('./routes/skills');

// Use Routes
app.use('/auth', authRoutes);
app.use('/projects', projectsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/team', teamRoutes);
app.use('/tasks', tasksRoutes);
app.use('/skills', skillsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
