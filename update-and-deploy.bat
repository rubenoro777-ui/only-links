@echo off
cd /d "C:\Users\Rubes\Documents\Claude\Projects\Only Links"
echo ============================================
echo   Step 1/3: Updating Next.js (security patch)
echo ============================================
echo.
call pnpm install
echo.
echo ============================================
echo   Step 2/3: Building locally to confirm
echo ============================================
echo.
call npx next build
if errorlevel 1 (
  echo.
  echo ******** BUILD FAILED ********
  echo Copy the red error above and paste it to Claude.
  echo.
  pause
  exit /b 1
)
echo.
echo ============================================
echo   Step 3/3: Deploying to Vercel (production)
echo   If it asks anything, just press Enter.
echo ============================================
echo.
call vercel --prod
echo.
echo Done. Copy the URL (or any error) above and paste it to Claude.
pause
