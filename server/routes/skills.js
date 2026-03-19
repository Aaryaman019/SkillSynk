const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// In-memory cache for GitHub API results to prevent rate limiting
// Structure: { [githubUsername]: { timestamp, data } }
const githubCache = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Helper to map GitHub languages to requested technologies
const mapLanguageToTech = (language) => {
  const langUpper = language.toUpperCase();
  // Basic mapping
  if (langUpper === 'JAVASCRIPT' || langUpper === 'TYPESCRIPT') return ['React', 'Node.js', 'Express', 'JavaScript', 'TypeScript'];
  if (langUpper === 'PYTHON') return ['Python', 'Django', 'Flask', 'FastAPI'];
  if (langUpper === 'JAVA') return ['Java', 'Spring'];
  if (langUpper === 'HTML' || langUpper === 'CSS') return ['HTML', 'CSS', 'Tailwind', 'Frontend'];
  if (langUpper === 'RUBY') return ['Ruby', 'Rails'];
  if (langUpper === 'PHP') return ['PHP', 'Laravel'];
  return [language]; // Default fallback
};

router.post('/analyze-github', async (req, res) => {
  try {
    const { githubUsername, technologies = [] } = req.body;

    if (!githubUsername) {
      return res.status(400).json({ error: 'GitHub username is required.' });
    }

    // 1. Check Cache
    const cachedItem = githubCache[githubUsername];
    if (cachedItem && (Date.now() - cachedItem.timestamp < CACHE_TTL)) {
      return res.status(200).json({
        ...cachedItem.data,
        cached: true
      });
    }

    // 2. Fetch User Repositories
    const reposResponse = await fetch(`https://api.github.com/users/${githubUsername}/repos?per_page=100&type=owner`, {
      headers: { 'User-Agent': 'SkillSynk-App' }
    });

    if (reposResponse.status === 404) {
      return res.status(404).json({ error: 'GitHub user not found.' });
    }
    
    if (reposResponse.status === 403 || reposResponse.status === 429) {
      // Rate limited
      return res.status(403).json({ 
        error: 'GitHub API rate limit exceeded. Please try again later or provide auth token.',
        isRateLimited: true,
        partialResult: { username: githubUsername, scores: [], analyzedAt: new Date().toISOString() }
      });
    }

    if (!reposResponse.ok) {
       throw new Error(`GitHub API error: ${reposResponse.statusText}`);
    }

    const repos = await reposResponse.json();

    if (!Array.isArray(repos) || repos.length === 0) {
      return res.status(200).json({
        username: githubUsername,
        scores: technologies.map(tech => ({ technology: tech, score: 0, evidenceRepos: 0 })),
        analyzedAt: new Date().toISOString(),
        message: 'User has no public repositories.'
      });
    }

    // 3. Fetch Languages per Repo
    const languageTotals = {}; // { 'JavaScript': 50000, 'Python': 10000 }
    const repoCounts = {}; // { 'JavaScript': 5, 'Python': 1 }
    let rateLimitedDuringAgg = false;

    // To respect rate limits slightly without tokens, we might only check the top 10 most recently updated repos.
    // For a robust system, we would check all, but for this exercise we cap it to prevent immediate 403 blocks.
    const reposToCheck = repos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 15);

    for (const repo of reposToCheck) {
      const langResponse = await fetch(repo.languages_url, {
        headers: { 'User-Agent': 'SkillSynk-App' }
      });

      if (langResponse.status === 403 || langResponse.status === 429) {
        rateLimitedDuringAgg = true;
        break; // Stop fetching more if limited
      }

      if (langResponse.ok) {
        const langs = await langResponse.json();
        Object.keys(langs).forEach(lang => {
          languageTotals[lang] = (languageTotals[lang] || 0) + langs[lang];
          repoCounts[lang] = (repoCounts[lang] || 0) + 1;
        });
      }
    }

    const totalBytesAllLangs = Object.values(languageTotals).reduce((sum, val) => sum + val, 0);

    // 4 & 5. Map to Requested Tech and Calculate Score (0-10)
    const scores = technologies.map(targetTech => {
      let matchedBytes = 0;
      let matchedRepos = 0;

      // Find all GitHub languages that map to this requested technology
      Object.keys(languageTotals).forEach(githubLang => {
        const mappedTechs = mapLanguageToTech(githubLang);
        // Case-insensitive inclusion check
        if (mappedTechs.some(t => t.toLowerCase() === targetTech.toLowerCase())) {
          matchedBytes += languageTotals[githubLang];
          matchedRepos += repoCounts[githubLang];
        }
      });

      let score = 0;
      if (totalBytesAllLangs > 0) {
        const percentage = (matchedBytes / totalBytesAllLangs) * 100;
        // Simple scoring algorithm:
        // 0% = 0
        // > 0% = 2 (basic exposure)
        // > 5% = 4
        // > 15% = 6
        // > 30% = 8
        // > 50% = 10 (expert/primary language)
        if (percentage > 50) score = 10;
        else if (percentage > 30) score = 8;
        else if (percentage > 15) score = 6;
        else if (percentage > 5) score = 4;
        else if (percentage > 0) score = 2;
      }

      return {
        technology: targetTech,
        score,
        evidenceRepos: matchedRepos
      };
    });

    const resultData = {
      username: githubUsername,
      scores,
      analyzedAt: new Date().toISOString(),
      wasTruncated: reposToCheck.length < repos.length,
      hitRateLimitDuringFetch: rateLimitedDuringAgg
    };

    // Store in cache
    githubCache[githubUsername] = {
      timestamp: Date.now(),
      data: resultData
    };

    return res.status(200).json(resultData);

  } catch (error) {
    console.error('GitHub Analysis Error:', error);
    res.status(500).json({ error: 'Internal server error during analysis.' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const skills = await prisma.skillAssessment.findMany({ where: { userId: parseInt(req.params.userId) }});
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const skill = await prisma.skillAssessment.create({ data: req.body });
    res.status(201).json(skill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
