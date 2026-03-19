import React from 'react';

function SkillProfileCard({
  name,
  avatarInitials,
  githubUsername,
  selfAssessment = [],
  githubScore = [],
  recommendedTasks = []
}) {
  // Combine skills to ensure we iterate over all unique techs
  const allTechs = Array.from(
    new Set([
      ...selfAssessment.map((s) => s.tech),
      ...githubScore.map((g) => g.tech)
    ])
  );

  // Calculate overall match score
  let totalSelf = 0;
  let totalGit = 0;
  let count = 0;

  const combinedSkills = allTechs.map((tech) => {
    const self = selfAssessment.find((s) => s.tech === tech)?.rating || 0;
    const git = githubScore.find((g) => g.tech === tech)?.score || 0;
    
    if (self > 0 && git > 0) {
      totalSelf += self;
      totalGit += git;
      count++;
    }

    const difference = Math.abs(self - git);
    const hasInconsistency = difference > 30;

    return { tech, self, git, hasInconsistency };
  });

  const avgSelf = count > 0 ? totalSelf / count : 0;
  const avgGit = count > 0 ? totalGit / count : 0;
  
  // Overall match calculation: How close is the relative self-rating to github rating?
  // If they are perfectly matched, it's 100%. If self is 100 and git is 0, it's 0%.
  let overallMatch = 100;
  if (count > 0) {
      const avgDiff = Math.abs(avgSelf - avgGit);
      overallMatch = Math.max(0, 100 - avgDiff);
  } else if (githubScore.length === 0 && selfAssessment.length > 0) {
      overallMatch = 0; // No evidence to back up claims
  }

  const matchScore = Math.round(overallMatch);

  const getMatchColor = (score) => {
    if (score > 75) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (score >= 50) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-rose-100 text-rose-800 border-rose-200';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 w-full max-w-md relative font-sans">
      {/* Top Section: Avatar & Info */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-xl shadow-inner">
            {avatarInitials}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{name}</h2>
            {githubUsername && (
              <a
                href={`https://github.com/${githubUsername}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-slate-500 hover:text-primary-600 transition flex items-center gap-1 mt-0.5"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                  />
                </svg>
                {githubUsername}
              </a>
            )}
          </div>
        </div>

        {/* Overall Score Badge */}
        <div
          className={`px-3 py-1.5 rounded-lg border font-bold text-sm flex items-center gap-1 shadow-sm ${getMatchColor(
            matchScore
          )}`}
          title="Overall Skill Match Score"
        >
          {matchScore}% Match
        </div>
      </div>

      {/* Skills Match Section */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-100 pb-2">
          Skill Verification
        </h3>
        <div className="space-y-4">
          {combinedSkills.map((skill) => (
            <div key={skill.tech} className="space-y-1 relative">
              <div className="flex justify-between items-end text-sm font-medium text-slate-700 mb-1">
                <span>{skill.tech}</span>
                {skill.hasInconsistency && (
                  <div className="flex items-center group cursor-help absolute right-0 -top-1">
                    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="absolute right-0 bottom-full mb-1 w-max px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition shadow-lg pointer-events-none z-10">
                      Inconsistency detected
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3 items-center">
                {/* Self Rated Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full relative group">
                  <div 
                    className="absolute left-0 top-0 h-full bg-blue-500 rounded-full" 
                    style={{ width: `${Math.min(100, Math.max(0, skill.self))}%` }}
                  ></div>
                  <div className="absolute left-0 -bottom-4 text-[10px] text-slate-400 font-medium whitespace-nowrap">Self: {skill.self}</div>
                </div>
                
                {/* Github Evidence Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full relative group">
                  <div 
                    className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${Math.min(100, Math.max(0, skill.git))}%` }}
                  ></div>
                  <div className="absolute left-0 -bottom-4 text-[10px] text-slate-400 font-medium whitespace-nowrap">Git: {skill.git}</div>
                </div>
              </div>
            </div>
          ))}
          {combinedSkills.length === 0 && (
            <p className="text-sm text-slate-500 italic">No skill data available.</p>
          )}
        </div>
      </div>

      {/* Recommended For Section */}
      {recommendedTasks && recommendedTasks.length > 0 && (
        <div className="mt-8 pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">
            Best Suited For
          </p>
          <div className="flex flex-wrap gap-2">
            {recommendedTasks.map((task, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-md border border-slate-200"
              >
                {task}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SkillProfileCard;
