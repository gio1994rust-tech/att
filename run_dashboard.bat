@echo off
chcp 65001 >nul
title ระบบตรวจเช็คเวลาเข้า-ออกงานพนักงาน (SQLite 3 Dashboard)
echo ================================================================
echo   ระบบ Time Attendance Dashboard (ขับเคลื่อนด้วยฐานข้อมูล SQLite 3)
echo ================================================================
echo.

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo กำลังเปิดระบบผ่าน Local Web Server (http://localhost:8000)...
    start "" http://localhost:8000/index.html
    python -m http.server 8000
) else (
    echo กำลังเปิดไฟล์ index.html ในเว็บเบราว์เซอร์...
    start "" "%~dp0index.html"
)
exit
