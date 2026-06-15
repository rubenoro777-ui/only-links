@echo off
cd /d "C:\Users\Rubes\Documents\Claude\Projects\Only Links"
echo ============================================
echo   Step 1 of 2: Building (checking it compiles)
echo ============================================
echo.
call npx next build
if errorlevel 1 (
  echo.
  echo ******** BUILD FAILED ********
  echo Copy the red error text above and paste it to Claude.
  echo Deployment was NOT attempted.
  echo.
  pause
  exit /b 1
)
echo.
echo ============================================
echo   Step 2 of 2: Deploying to Vercel...
echo   (If it asks questions, just press Enter.)
echo ============================================
echo.
call vercel
echo.
echo Done. Copy the .vercel.app URL above and paste it to Claude.
pause
