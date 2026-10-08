@echo off
chcp 65001 >nul
title ระบบตรวจเช็คเวลาเข้า-ออกงานพนักงาน (PostgreSQL Enabled Dashboard)
echo ================================================================
echo   ระบบ Time Attendance Dashboard (PostgreSQL + Cloud DB Ready)
echo ================================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo กำลังเริ่มต้นระบบด้วย Node.js Server (พร้อมรองรับ PostgreSQL /api/db)...
    echo เปิดบราวเซอร์ที่: http://localhost:8000
    start "" http://localhost:8000
    node server.js
    exit /b
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo กำลังเปิดระบบผ่าน Python Web Server (http://localhost:8000)...
    start "" http://localhost:8000/index.html
    python -m http.server 8000
    exit /b
)

echo กำลังเปิดไฟล์ index.html ในเว็บเบราว์เซอร์...
start "" "%~dp0index.html"
exit
