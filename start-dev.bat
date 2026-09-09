@echo off
title Running All Services (IELC-CRM + WA-Baileys)
echo Starting services in separate windows...

start "Vite Dev" cmd /k "cd /d c:\PROJECT\WEBSITE\IELC-CRM && npm run dev"
start "Laravel Serve" cmd /k "cd /d c:\PROJECT\WEBSITE\IELC-CRM && php artisan serve"
start "Laravel Queue Worker" cmd /k "cd /d c:\PROJECT\WEBSITE\IELC-CRM && php artisan queue:work"
start "Laravel Reverb" cmd /k "cd /d c:\PROJECT\WEBSITE\IELC-CRM && php artisan reverb:start"
start "WA-Baileys Service" cmd /k "cd /d c:\PROJECT\WEBSITE\wa-baileys && npm start"

echo All 5 processes have been started in separate terminal windows.
pause
