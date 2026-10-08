# att - ระบบตรวจสอบเวลาเข้า-ออกงานพนักงาน (Time Attendance Dashboard - SQLite 3 Edition)

ระบบหน้าเว็บสำหรับตรวจสอบและวิเคราะห์เวลาปฏิบัติงานพนักงาน (Time Attendance) จากไฟล์ Excel (`ExportTimePerson.xlsx`) และไฟล์ Raw Log จากเครื่องสแกนนิ้ว/ใบหน้า (`.dat`, `.txt` เช่น `CNYG221260238_attlog.dat`) โดยขับเคลื่อนด้วย **ฐานข้อมูล SQLite 3 ครบวงจร**

## ✨ ฟังก์ชันเด่น

- 🗄️ **ระบบฐานข้อมูล SQLite 3 เต็มรูปแบบ (Full SQLite 3 Architecture)**:
  - ข้อมูลทุกอย่างจัดเก็บใน SQLite (`attendance.db`): ทั้งข้อมูลพนักงาน (Employees), บันทึกเวลาลงงาน (Attendance Records), วันหยุดประจำสัปดาห์ (Day-Offs), วันหยุดยิม (Gym Holidays), เหตุผลการลา (Leave Reasons), และการตั้งค่าระบบ/ธีม (Settings)
  - แทนที่การใช้งาน LocalStorage เดิมด้วย SQLite 3 อย่างสมบูรณ์
  - รัน SQLite 3 บนเบราว์เซอร์ผ่าน WebAssembly (`sql.js`) พร้อมระบบ Auto-Persistence ลง IndexedDB ทำให้ข้อมูลไม่สูญหายเมื่อรีเฟรชหน้าเว็บ
  - มีปุ่ม **💾 ดาวน์โหลด .db (Export SQLite)** เพื่อนำไฟล์ฐานข้อมูลไปเปิดในโปรแกรม SQLite เช่น *DB Browser for SQLite*, *DBeaver* ได้ทันที
  - มีปุ่ม **📂 นำเข้า .db (Import SQLite)** เพื่อนำเข้าฐานข้อมูลสำรองหรือไฟล์ `.db` อื่นๆ เข้ามาแสดงผลได้แบบ Real-time
- 📊 **Single-Page Dashboard**: รวมทุกอย่างในหน้าเดียว ดูง่าย ไม่ต้องเปิดหลายหน้าต่าง
- ✂️ **ระบบตัดชื่อพนักงาน (Employee Exclusion)**:
  - ตัด Thiti (ID 10004) ออกเป็นค่าเริ่มต้นอัตโนมัติ
  - หน้าต่าง Import มีระบบ Checkbox เลือกตัด/นำเข้าพนักงานได้ทุกคนในไฟล์แบบ Real-time
- 🏖️ **ระบบจัดการวันหยุด & ตรวจสอบการลา (Staff Day-Offs & Gym Closures)**:
  - วันหยุดประจำสัปดาห์รายบุคคล (บันทึกลงตาราง `employee_dayoffs` ใน SQLite)
  - วันหยุดประจำยิม / วันปิดทำการพิเศษ (บันทึกลงตาราง `gym_holidays` ใน SQLite)
  - บันทึกการลาป่วย/ลาพักร้อน/ลากิจพร้อมหมายเหตุ (บันทึกลงตาราง `leave_reasons` ใน SQLite)
- 📥 **รองรับการนำเข้าไฟล์หลากหลายรูปแบบ**:
  - `.xlsx`, `.xls`, `.csv`
  - `.dat`, `.txt` (Biometric Punch Logs จากเครื่องสแกนนิ้ว/ใบหน้า)
  - บันทึกข้อมูลที่นำเข้าลงฐานข้อมูล SQLite อัตโนมัติ (รองรับทั้งโหมด Replace และ Merge)
- 🧭 **3 มุมมองข้อมูล**:
  1. สรุปภาพรวมรายบุคคล (Summary Matrix)
  2. ตารางลงเวลารายวัน (Daily Table) พร้อมส่งออก Excel สะอาด
  3. ปฏิทินลงเวลารายบุคคล (Monthly Calendar View)
- 🌓 **รองรับ Dark Mode / Light Mode** (บันทึกการตั้งค่าลงตาราง `app_settings` ใน SQLite)

## 🗃️ โครงสร้างตารางในฐานข้อมูล SQLite 3 (`attendance.db`)

1. `employees` — ข้อมูลพนักงาน (รหัสพนักงาน, ชื่อ, รหัสบัตร)
2. `attendance_records` — ประวัติการสแกนและคำนวณเวลาเข้า-ออกงานรายวัน
3. `employee_dayoffs` — กำหนดวันหยุดประจำสัปดาห์ของพนักงานแต่ละคน (เดิมคือ LocalStorage)
4. `gym_holidays` — กำหนดวันปิดทำการพิเศษของยิม (เดิมคือ LocalStorage)
5. `leave_reasons` — บันทึกประเภทการลาและหมายเหตุรายวัน (เดิมคือ LocalStorage)
6. `app_settings` — การตั้งค่าระบบ เช่น ธีม, ตัวกรองที่บันทึกไว้ (เดิมคือ LocalStorage)

## ⚙️ การประมวลผลข้อมูลใหม่ (Regenerate SQLite Database)

หากต้องการนำไฟล์ raw log ใหม่มาสร้างฐานข้อมูล SQLite:
```bash
python generate_cleaned_data.py
```
คำสั่งนี้จะสร้างไฟล์:
- `attendance.db` (ไฟล์ฐานข้อมูล SQLite 3 ไบนารี)
- `attendance_db.js` (ไฟล์ Base64 สำรองสำหรับเปิดผ่าน `file:///` ออฟไลน์)
- `ExportTimePerson_Cleaned.xlsx` (ไฟล์ Excel สะอาด)

## 💻 การเปิดใช้งานในเครื่อง (Local)

- ดับเบิลคลิกเปิดไฟล์ `run_dashboard.bat`
  - หากมี Node.js ระบบจะรันผ่าน `node server.js` (`http://localhost:8000`) พร้อมระบบ API เชื่อมต่อกับ PostgreSQL เต็มรูปแบบ
  - หรือรันผ่านคำสั่ง:
    ```bash
    npm start
    ```

## 🐘 ระบบ PostgreSQL Cloud (ซิงค์ข้อมูล Real-time ข้ามอุปกรณ์ ปลอดภัย 100%)

ระบบรองรับการเชื่อมต่อกับ **PostgreSQL** (เช่น Neon, Supabase, Vercel Postgres, Render, Railway):
- **ข้อมูลไม่สูญหายแน่นอน**: บันทึกลงเซิร์ฟเวอร์ PostgreSQL โดยตรง ข้อมูลวันลาและวันหยุดจะไม่หายเมื่อล้างแคชหรือเปลี่ยนเครื่อง
- **ซิงค์ข้อมูลข้ามเครื่อง Real-time**: เมื่อเพิ่ม/ลบวันหยุดยิม, วันลา, หรือกำหนดวันหยุดประจำตัว จะบันทึกลงฐานข้อมูลทันที ทำให้ทุกเครื่องเห็นตรงกัน
- **โหมด Hybrid ปลอดภัย**: 
  - หากเชื่อมต่อ PostgreSQL ได้: แสดงป้ายสถานะ `🐘 PostgreSQL (Active)`
  - หากเปิดแบบออฟไลน์/ยังไม่ได้ใส่ URL: ระบบยังใช้งานได้ปกติโดยไม่หยุดชะงัก
- **คำสั่ง Migration ย้ายข้อมูลเก่าทั้งหมด**:
  - เมื่อได้ `POSTGRES_URL` แล้ว สามารถรันคำสั่งย้ายประวัติเวลาทำงานและวันลาทั้งหมดไปยัง PostgreSQL ในคลิกเดียว:
    ```bash
    npm run migrate
    ```

## 🚀 วิธีตั้งค่าเชื่อมต่อ PostgreSQL ฟรี (เช่น Neon หรือ Supabase)

1. **สมัครและรับ Connection URL (ฟรี):**
   - **Neon (แนะนำ ง่ายและเร็วที่สุด):** เข้าเว็บ [neon.tech](https://neon.tech) สมัครฟรี > กด Create Project > คัดลอก Connection string (เช่น `postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require`)
   - **หรือ Supabase:** เข้าเว็บ [supabase.com](https://supabase.com) > สร้าง Project > คัดลอก URI จาก Database Settings
2. **ใส่ในไฟล์ `.env`:**
   - คัดลอกไฟล์ `.env.example` เป็น `.env`
   - ใส่ Connection URL ลงในตัวแปร:
     ```env
     POSTGRES_URL=postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require
     ```
3. **รัน Migration ย้ายข้อมูลเดิม:**
   ```bash
   npm run migrate
   ```
4. **หาก Deploy บน Vercel:**
   - ใส่ Environment Variable ใน Vercel Project Settings:
     - Key: `POSTGRES_URL` (หรือ `DATABASE_URL`)
     - Value: Connection URL ของคุณ


