@echo off
cd /d "C:\Users\Rubes\Documents\Claude\Projects\Only Links"

echo ============================================
echo   Step 0: Installing dependencies
echo ============================================
echo.
call pnpm install
if errorlevel 1 (
  echo.
  echo ******** INSTALL FAILED ********
  echo Try running: pnpm install
  echo.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   Step 1 of 3: Database migrations
echo ============================================
echo.
call node --env-file=.env.local scripts/migrate.mjs
if errorlevel 1 (
  echo.
  echo ******** MIGRATION FAILED ********
  echo Nothing was deployed. Copy the error above and paste it to Claude.
  echo.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   Step 2 of 3: Building (checking it compiles)
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
echo   Step 3 of 3: Deploying to production...
echo ============================================
echo.
call vercel --prod
echo.
echo Done. Copy the URL above (or any error) and paste it to Claude.
pause
