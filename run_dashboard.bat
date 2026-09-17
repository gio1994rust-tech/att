@echo off
chcp 65001 >nul
title ระบบตรวจเช็คเวลาเข้า-ออกงานพนักงาน
echo กำลังเปิดระบบ Time Attendance Dashboard ในเว็บเบราว์เซอร์...
start "" "%~dp0index.html"
exit
