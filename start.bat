@echo off
echo Starting SkillSynk Server and Client...

:: Start the server in a new terminal window
start "SkillSynk Server" cmd /k "cd /d "%~dp0server" && npm run dev"

:: Start the client in a new terminal window
start "SkillSynk Client" cmd /k "cd /d "%~dp0client" && npm run dev"

echo Both windows launched!
