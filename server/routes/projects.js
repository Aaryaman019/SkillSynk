const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Using Gemini API key from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({ include: { tasks: true, teamMembers: true }});
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const project = await prisma.project.create({ data: req.body });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/suggest-tech-stack', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Project name and description are required.' });
    }

    const systemPrompt = `You are a Senior Technical Architect.
Your goal is to suggest a modern, practical tech stack for a new project based on its name and description.
Rules:
1. Suggest exactly 4 to 8 core technologies (e.g., Frontend, Backend, Database, Framework, Deployment).
2. Output STRICTLY a valid JSON array of strings.
Example output format:
["React", "TypeScript", "Node.js", "PostgreSQL", "TailwindCSS"]
Do not include markdown formatting or any other text.`;

    const userPrompt = `
Project Name: ${name}
Description: ${description}

Provide the JSON array of technologies:`;

    let suggestedStack = null;
    let warnings = [];

    if (GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.0-flash",
          generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
        const responseText = result.response.text();
        
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestedStack = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.error("Gemini API Error (suggest-tech-stack):", err);
        warnings.push('AI service returned an error. Using fallback tech stack.');
      }
    } else {
      warnings.push('No Gemini API Key configured. Using fallback tech stack.');
    }

    if (!suggestedStack || !Array.isArray(suggestedStack) || suggestedStack.length === 0) {
      suggestedStack = ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'TailwindCSS'];
    }

    return res.status(200).json({
      suggestions: suggestedStack,
      warnings
    });

  } catch (error) {
    console.error('Tech Stack Generation Error:', error);
    res.status(500).json({ error: 'Internal server error while generating tech stack.' });
  }
});


router.post('/generate-plan', async (req, res) => {
  try {
    const { project, team } = req.body;

    if (!project || !team || team.length === 0) {
      return res.status(400).json({ error: 'Project details and at least 1 team member required.' });
    }

    // Extract developer names to strictly enforce assignment constraints
    const developerNames = team.map(m => m.name).join(', ');

    // 1. Prepare Prompt
    const systemPrompt = `You are a Senior Technical Project Manager. 
Your goal is to take a project description, tech stack, and a team of developers with varying skills and daily capacities, and break the work down into a concrete JSON task plan.
Rules:
1. Break the project into 8-15 specific tasks based on the description and tech stack.
2. For each task specify: title, complexity (LOW/MEDIUM/HIGH/CRITICAL), requiredTechnology, estimatedHours, and assignedDeveloper.
3. You must assign each task to exactly one of these developers: ${developerNames}. Use these exact names in the assignedDeveloper field. Never use 'Unknown' or any other name not in this list.
4. IMPORTANT: Workload balancing - DO NOT assign more than 40% of the total estimated project hours to any single developer.
5. If a developer has very low or no matching technical skills, assign them documentation, testing, or DevOps setup tasks.
6. Output STRICTLY valid JSON matching the format:
{
  "tasks": [
    {
      "title": "string",
      "complexity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "requiredTechnology": "string",
      "estimatedHours": 0,
      "assignedDeveloper": "string"
    }
  ],
  "estimatedCompletionDate": "string",
  "warnings": []
}
Do not include markdown blocks or any other text.`;

    const userPrompt = `
Project Name: ${project.name}
Description: ${project.description}
Tech Stack: ${project.techStack.join(', ')}

Team:
${JSON.stringify(team, null, 2)}

Provide the JSON plan:`;

    let aiPlanData = null;
    let warnings = [];

    // 2. Call Gemini API
    if (GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.0-flash",
          generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
        const responseText = result.response.text();
        
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiPlanData = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.error("Gemini API Error:", err);
        warnings.push('AI service returned an error. Using fallback generator.');
      }
    } else {
      warnings.push('No Gemini API Key configured. Using fallback mock plan generator.');
    }

    // --- FALLBACK MOCK LOGIC ---
    if (!aiPlanData || !aiPlanData.tasks) {
       const mockTasks = [];
       // Distribute generic tasks
       project.techStack.forEach((tech, i) => {
         const dev = team[i % team.length];
         mockTasks.push({
           title: `Setup ${tech} infrastructure and boilerplate`,
           complexity: i === 0 ? 'CRITICAL' : 'HIGH',
           requiredTechnology: tech,
           estimatedHours: 8,
           assignedDeveloper: dev.name
         });
         mockTasks.push({
           title: `Implement core features for ${tech}`,
           complexity: 'MEDIUM',
           requiredTechnology: tech,
           estimatedHours: 12,
           assignedDeveloper: dev.name
         });
       });
       // Add generic docs and testing
       const remainingDev = team[team.length - 1];
       mockTasks.push({
         title: `Write technical specs and API documentation`,
         complexity: 'LOW',
         requiredTechnology: 'Markdown',
         estimatedHours: 4,
         assignedDeveloper: remainingDev.name
       });
       mockTasks.push({
         title: `Configure E2E testing suite`,
         complexity: 'MEDIUM',
         requiredTechnology: 'Testing',
         estimatedHours: 6,
         assignedDeveloper: remainingDev.name
       });
       
       const estimatedCompletionDate = new Date();
       estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + 14);

       aiPlanData = { 
         tasks: mockTasks,
         estimatedCompletionDate: estimatedCompletionDate.toISOString().split('T')[0],
         warnings: ["Using fallback mock plan because Gemini API call failed or was missing."]
       };
    }

    // Collect any warnings returned from the AI response itself
    if (aiPlanData.warnings && Array.isArray(aiPlanData.warnings)) {
      warnings = [...warnings, ...aiPlanData.warnings];
    }

    // 3. Return Full Plan
    return res.status(200).json({
      tasks: aiPlanData.tasks,
      estimatedCompletionDate: aiPlanData.estimatedCompletionDate || new Date().toISOString().split('T')[0],
      warnings
    });

  } catch (error) {
    console.error('Plan Generation Error:', error);
    res.status(500).json({ error: 'Internal server error while generating plan.' });
  }
});

module.exports = router;
