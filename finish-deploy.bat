@echo off
cd /d "C:\Users\Rubes\Documents\Claude\Projects\Only Links"
echo ============================================
echo   Step 1/3: Updating Next.js (security patch)
echo ============================================
echo.
call pnpm install
echo.
echo ============================================
echo   Step 2/3: Adding Supabase keys to Vercel
echo   (If it says a variable already exists, that
echo    is fine - it's already set. Keep going.)
echo ============================================
echo.
call vercel env add NEXT_PUBLIC_SUPABASE_URL production < vercel-env-url.txt
call vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production < vercel-env-key.txt
echo.
echo ============================================
echo   Step 3/3: Deploying to production
echo   (If it asks anything, press Enter.)
echo ============================================
echo.
call vercel --prod
echo.
echo ============================================
echo   Done. Copy the production URL above
echo   (or any error) and paste it to Claude.
echo ============================================
pause
