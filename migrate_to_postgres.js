import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("================================================================");
  console.log("  🐘 Migrate Attendance & Leave Data to PostgreSQL");
  console.log("================================================================\n");

  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ ข้อผิดพลาด: ไม่พบตัวแปร POSTGRES_URL หรือ DATABASE_URL ในไฟล์ .env");
    console.log("\n💡 วิธีแก้ไข:");
    console.log("  1. สร้างไฟล์ .env ในโฟลเดอร์โปรเจกต์นี้");
    console.log("  2. ใส่ Connection URL ของคุณลงไป เช่น:");
    console.log("     POSTGRES_URL=postgresql://username:password@ep-xyz.neon.tech/neondb?sslmode=require");
    console.log("  3. รันคำสั่ง: npm run migrate อีกครั้ง\n");
    process.exit(1);
  }

  const dbPath = path.join(__dirname, 'attendance.db');
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ ไม่พบไฟล์ฐานข้อมูลต้นทาง ${dbPath}`);
    process.exit(1);
  }

  console.log("📦 1. กำลังอ่านข้อมูลทั้งหมดจาก SQLite (attendance.db)...");

  const pyCode = `
import sqlite3, json, sys

conn = sqlite3.connect('attendance.db')
c = conn.cursor()

def fetch_all(query):
    return c.execute(query).fetchall()

data = {
    'employees': [
        {'id': r[0], 'name': r[1], 'card_id': r[2]}
        for r in fetch_all('SELECT id, name, card_id FROM employees')
    ],
    'gym_holidays': [
        {'date': r[0], 'name': r[1]}
        for r in fetch_all('SELECT holiday_date, holiday_name FROM gym_holidays')
    ],
    'employee_dayoffs': [
        {'emp_id': r[0], 'day_of_week': r[1]}
        for r in fetch_all('SELECT emp_id, day_of_week FROM employee_dayoffs')
    ],
    'leave_reasons': [
        {'emp_id': r[0], 'iso_date': r[1], 'leave_type': r[2], 'leave_label': r[3], 'note': r[4] or '', 'updated_at': r[5] or ''}
        for r in fetch_all('SELECT emp_id, iso_date, leave_type, leave_label, note, updated_at FROM leave_reasons')
    ],
    'app_settings': [
        {'key': r[0], 'value': r[1]}
        for r in fetch_all('SELECT key, value FROM app_settings')
    ],
    'attendance_records': [
        {
            'emp_id': r[0], 'card_id': r[1] or '', 'emp_name': r[2], 'date': r[3], 'iso_date': r[4],
            'year': r[5], 'month': r[6], 'day': r[7], 'day_of_week': r[8], 'count': r[9],
            'punches': r[10] or '[]', 'check_in': r[11] or '', 'check_out': r[12] or '',
            'work_hours': r[13], 'work_hours_formatted': r[14] or '', 'initial_status': r[15] or 'absent'
        }
        for r in fetch_all('SELECT emp_id, card_id, emp_name, date, iso_date, year, month, day, day_of_week, count, punches, check_in, check_out, work_hours, work_hours_formatted, initial_status FROM attendance_records')
    ]
}

conn.close()
sys.stdout.buffer.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
`;

  const sqliteData = await new Promise((resolve, reject) => {
    const py = spawn('python', ['-c', pyCode], { cwd: __dirname });
    let stdoutChunks = [];
    let stderr = '';

    py.stdout.on('data', chunk => stdoutChunks.push(chunk));
    py.stderr.on('data', chunk => stderr += chunk);

    py.on('close', code => {
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}: ${stderr}`));
      }
      try {
        const fullBuf = Buffer.concat(stdoutChunks);
        const parsed = JSON.parse(fullBuf.toString('utf-8'));
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });
  });

  console.log(`   - พนักงาน (Employees): ${sqliteData.employees.length} คน`);
  console.log(`   - วันหยุดประจำยิม (Gym Holidays): ${sqliteData.gym_holidays.length} วัน`);
  console.log(`   - วันหยุดประจำตัวพนักงาน (Day-Offs): ${sqliteData.employee_dayoffs.length} รายการ`);
  console.log(`   - บันทึกการลา (Leave Reasons): ${sqliteData.leave_reasons.length} วัน`);
  console.log(`   - ประวัติลงเวลาทั้งหมด (Attendance Records): ${sqliteData.attendance_records.length} แถว`);

  console.log("\n🔌 2. กำลังเชื่อมต่อไปยัง PostgreSQL...");
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  console.log("   ✅ เชื่อมต่อ PostgreSQL สำเร็จ!");

  try {
    console.log("\n🛠️  3. ตรวจสอบและสร้างโครงสร้างตาราง (Schema)...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS gym_holidays (
        holiday_date VARCHAR(50) PRIMARY KEY,
        holiday_name VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS leave_reasons (
        emp_id VARCHAR(50) NOT NULL,
        iso_date VARCHAR(50) NOT NULL,
        leave_type VARCHAR(50) NOT NULL,
        leave_label VARCHAR(100),
        note TEXT,
        updated_at VARCHAR(100),
        PRIMARY KEY (emp_id, iso_date)
      );

      CREATE TABLE IF NOT EXISTS employee_dayoffs (
        emp_id VARCHAR(50) NOT NULL,
        day_of_week INTEGER NOT NULL,
        PRIMARY KEY (emp_id, day_of_week)
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        card_id VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS attendance_records (
        id SERIAL PRIMARY KEY,
        emp_id VARCHAR(50) NOT NULL,
        card_id VARCHAR(50),
        emp_name VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        iso_date VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        day INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        punches TEXT,
        check_in VARCHAR(20),
        check_out VARCHAR(20),
        work_hours NUMERIC(6, 2),
        work_hours_formatted VARCHAR(50),
        initial_status VARCHAR(50),
        CONSTRAINT unique_emp_date UNIQUE (emp_id, iso_date)
      );

      CREATE INDEX IF NOT EXISTS idx_records_emp ON attendance_records(emp_id);
      CREATE INDEX IF NOT EXISTS idx_records_iso_date ON attendance_records(iso_date);
      CREATE INDEX IF NOT EXISTS idx_records_year ON attendance_records(year);
    `);

    console.log("\n🚀 4. กำลังย้ายข้อมูลไปยัง PostgreSQL (Migration)...");
    await client.query("BEGIN;");

    // Employees
    for (const emp of sqliteData.employees) {
      await client.query(
        "INSERT INTO employees (id, name, card_id) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, card_id = EXCLUDED.card_id;",
        [emp.id, emp.name, emp.card_id]
      );
    }
    console.log(`   ✅ ย้ายพนักงานเรียบร้อย: ${sqliteData.employees.length} คน`);

    // Gym Holidays
    for (const gh of sqliteData.gym_holidays) {
      await client.query(
        "INSERT INTO gym_holidays (holiday_date, holiday_name) VALUES ($1, $2) ON CONFLICT (holiday_date) DO UPDATE SET holiday_name = EXCLUDED.holiday_name;",
        [gh.date, gh.name]
      );
    }
    console.log(`   ✅ ย้ายวันหยุดประจำยิมเรียบร้อย: ${sqliteData.gym_holidays.length} วัน`);

    // Employee Day-offs
    await client.query("DELETE FROM employee_dayoffs;");
    for (const d of sqliteData.employee_dayoffs) {
      await client.query(
        "INSERT INTO employee_dayoffs (emp_id, day_of_week) VALUES ($1, $2) ON CONFLICT (emp_id, day_of_week) DO NOTHING;",
        [d.emp_id, d.day_of_week]
      );
    }
    console.log(`   ✅ ย้ายวันหยุดประจำตัวพนักงานเรียบร้อย: ${sqliteData.employee_dayoffs.length} รายการ`);

    // Leave Reasons
    for (const l of sqliteData.leave_reasons) {
      await client.query(`
        INSERT INTO leave_reasons (emp_id, iso_date, leave_type, leave_label, note, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (emp_id, iso_date)
        DO UPDATE SET
          leave_type = EXCLUDED.leave_type,
          leave_label = EXCLUDED.leave_label,
          note = EXCLUDED.note,
          updated_at = EXCLUDED.updated_at;
      `, [l.emp_id, l.iso_date, l.leave_type, l.leave_label, l.note, l.updated_at]);
    }
    console.log(`   ✅ ย้ายบันทึกการลา (Leave Reasons) เรียบร้อย: ${sqliteData.leave_reasons.length} วัน`);

    // App Settings
    for (const s of sqliteData.app_settings) {
      await client.query(
        "INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;",
        [s.key, s.value]
      );
    }

    // Attendance Records in batches
    console.log(`   ⏳ กำลังนำเข้า Attendance Records (${sqliteData.attendance_records.length} แถว)...`);
    const batchSize = 500;
    for (let i = 0; i < sqliteData.attendance_records.length; i += batchSize) {
      const batch = sqliteData.attendance_records.slice(i, i + batchSize);
      for (const r of batch) {
        await client.query(`
          INSERT INTO attendance_records (
            emp_id, card_id, emp_name, date, iso_date, year, month, day, day_of_week,
            count, punches, check_in, check_out, work_hours, work_hours_formatted, initial_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (emp_id, iso_date)
          DO UPDATE SET
            count = EXCLUDED.count,
            punches = EXCLUDED.punches,
            check_in = EXCLUDED.check_in,
            check_out = EXCLUDED.check_out,
            work_hours = EXCLUDED.work_hours,
            work_hours_formatted = EXCLUDED.work_hours_formatted,
            initial_status = EXCLUDED.initial_status;
        `, [
          r.emp_id, r.card_id, r.emp_name, r.date, r.iso_date,
          r.year, r.month, r.day, r.day_of_week, r.count,
          r.punches, r.check_in, r.check_out,
          r.work_hours, r.work_hours_formatted, r.initial_status
        ]);
      }
      process.stdout.write(`   ... นำเข้าแล้ว ${Math.min(i + batchSize, sqliteData.attendance_records.length)} / ${sqliteData.attendance_records.length} แถว\r`);
    }
    console.log(`\n   ✅ ย้ายประวัติการลงเวลาเรียบร้อย: ${sqliteData.attendance_records.length} แถว`);

    await client.query("COMMIT;");
    console.log("\n🎉 ย้ายข้อมูลทั้งหมดไปยัง PostgreSQL สำเร็จสมบูรณ์ 100%!");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("\n❌ การย้ายข้อมูลล้มเหลว (Rollback):", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
