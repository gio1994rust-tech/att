import pg from 'pg';
const { Pool } = pg;

const SEED_DATA = {
  gym_holidays: [
    { date: "2025-01-01", name: "ปีใหม่ 2025" },
    { date: "2025-04-14", name: "สงกรานต์ 2025" },
    { date: "2025-04-15", name: "สงกรานต์ 2025" },
    { date: "2025-04-16", name: "สงกรานต์ 2025" },
    { date: "2025-12-31", name: "ปีใหม่ 2026" },
    { date: "2026-01-01", name: "ปีใหม่ 2026" },
    { date: "2026-01-02", name: "ปีใหม่ 2026" },
    { date: "2026-01-03", name: "ปีใหม่ 2026" },
    { date: "2026-04-13", name: "สงกรานต์" },
    { date: "2026-04-14", name: "สงกรานต์" },
    { date: "2026-04-15", name: "สงกรานต์" },
    { date: "2026-07-27", name: "staff trip" },
    { date: "2026-07-28", name: "staff trip" },
    { date: "2026-07-29", name: "staff trip" }
  ],
  leave_reasons: [
    { emp_id: "10002", iso_date: "2026-01-10", leave_type: "vacation", leave_label: "ลาพักร้อน", note: "", updated_at: "2026-09-19T09:05:54.917Z" },
    { emp_id: "10002", iso_date: "2026-01-31", leave_type: "vacation", leave_label: "ลาพักร้อน", note: "", updated_at: "2026-09-19T09:06:13.971Z" },
    { emp_id: "10002", iso_date: "2026-02-02", leave_type: "vacation", leave_label: "ลาพักร้อน", note: "", updated_at: "2026-09-19T09:06:33.402Z" },
    { emp_id: "10002", iso_date: "2026-02-21", leave_type: "vacation", leave_label: "ลาพักร้อน", note: "", updated_at: "2026-09-19T09:06:55.643Z" },
    { emp_id: "10002", iso_date: "2026-02-23", leave_type: "vacation", leave_label: "ลาพักร้อน", note: "", updated_at: "2026-09-19T09:07:00.285Z" },
    { emp_id: "10002", iso_date: "2026-02-27", leave_type: "sick", leave_label: "ลาป่วย", note: "", updated_at: "2026-09-19T09:07:10.350Z" },
    { emp_id: "10002", iso_date: "2026-02-28", leave_type: "sick", leave_label: "ลาป่วย", note: "", updated_at: "2026-09-19T09:07:13.606Z" },
    { emp_id: "10002", iso_date: "2026-03-02", leave_type: "sick", leave_label: "ลาป่วย", note: "", updated_at: "2026-09-19T09:07:28.822Z" },
    { emp_id: "10001", iso_date: "2026-03-02", leave_type: "sick", leave_label: "ลาป่วย", note: "", updated_at: "2026-09-19T09:07:34.297Z" },
    { emp_id: "10003", iso_date: "2026-03-14", leave_type: "vacation", leave_label: "ลาพักร้อน", note: "", updated_at: "2026-09-19T09:08:00.410Z" },
    { emp_id: "10003", iso_date: "2026-03-16", leave_type: "vacation", leave_label: "ลาพักร้อน", note: "", updated_at: "2026-09-19T09:08:04.093Z" },
    { emp_id: "10002", iso_date: "2026-03-17", leave_type: "vacation", leave_label: "ลาพักร้อน", note: "", updated_at: "2026-09-19T09:08:23.180Z" },
    { emp_id: "10002", iso_date: "2026-03-31", leave_type: "vacation", leave_label: "ลาพักร้อน", note: "", updated_at: "2026-09-19T09:08:27.216Z" },
    { emp_id: "10001", iso_date: "2026-04-10", leave_type: "vacation", leave_label: "ลาพักร้อน", note: "", updated_at: "2026-09-19T09:08:51.330Z" },
    { emp_id: "10001", iso_date: "2026-04-11", leave_type: "vacation", leave_label: "ลาพักร้อน", note: "", updated_at: "2026-09-19T09:08:53.922Z" },
    { emp_id: "10001", iso_date: "2026-04-17", leave_type: "sick", leave_label: "ลาป่วย", note: "อุบัติเหตุ", updated_at: "2026-09-19T09:09:07.828Z" },
    { emp_id: "10001", iso_date: "2026-04-18", leave_type: "sick", leave_label: "ลาป่วย", note: "อุบัติเหตุ", updated_at: "2026-09-19T09:09:12.769Z" },
    { emp_id: "10001", iso_date: "2026-04-20", leave_type: "sick", leave_label: "ลาป่วย", note: "อุบัติเหตุ", updated_at: "2026-09-19T09:09:17.690Z" },
    { emp_id: "10001", iso_date: "2026-04-21", leave_type: "sick", leave_label: "ลาป่วย", note: "อุบัติเหตุ", updated_at: "2026-09-19T09:09:22.004Z" },
    { emp_id: "10001", iso_date: "2026-04-22", leave_type: "sick", leave_label: "ลาป่วย", note: "อุบัติเหตุ", updated_at: "2026-09-19T09:09:26.150Z" },
    { emp_id: "10001", iso_date: "2026-04-24", leave_type: "sick", leave_label: "ลาป่วย", note: "อุบัติเหตุ", updated_at: "2026-09-19T09:09:36.107Z" },
    { emp_id: "10001", iso_date: "2026-04-25", leave_type: "sick", leave_label: "ลาป่วย", note: "อุบัติเหตุ", updated_at: "2026-09-19T09:09:41.177Z" },
    { emp_id: "10001", iso_date: "2026-04-27", leave_type: "sick", leave_label: "ลาป่วย", note: "อุบัติเหตุ", updated_at: "2026-09-19T09:09:46.359Z" },
    { emp_id: "10001", iso_date: "2026-04-28", leave_type: "sick", leave_label: "ลาป่วย", note: "อุบัติเหตุ", updated_at: "2026-09-19T09:09:52.030Z" },
    { emp_id: "10001", iso_date: "2026-04-29", leave_type: "sick", leave_label: "ลาป่วย", note: "อุบัติเหตุ", updated_at: "2026-09-19T09:09:58.924Z" },
    { emp_id: "10001", iso_date: "2026-05-01", leave_type: "sick", leave_label: "ลาป่วย", note: "อุบัติเหตุ", updated_at: "2026-09-19T09:10:11.950Z" },
    { emp_id: "10001", iso_date: "2026-05-02", leave_type: "sick", leave_label: "ลาป่วย", note: "อุบัติเหตุ", updated_at: "2026-09-19T09:10:17.658Z" },
    { emp_id: "10003", iso_date: "2026-04-16", leave_type: "vacation", leave_label: "ลาพักร้อน", note: "", updated_at: "2026-09-19T09:10:43.184Z" },
    { emp_id: "10003", iso_date: "2026-04-17", leave_type: "vacation", leave_label: "ลาพักร้อน", note: "", updated_at: "2026-09-19T09:10:46.056Z" },
    { emp_id: "10003", iso_date: "2026-04-18", leave_type: "vacation", leave_label: "ลาพักร้อน", note: "", updated_at: "2026-09-19T09:10:48.638Z" }
  ],
  employee_dayoffs: [
    { emp_id: "10001", day_of_week: 3 },
    { emp_id: "10001", day_of_week: 6 },
    { emp_id: "10002", day_of_week: 6 },
    { emp_id: "10003", day_of_week: 6 },
    { emp_id: "10005", day_of_week: 5 },
    { emp_id: "10005", day_of_week: 6 },
    { emp_id: "10006", day_of_week: 0 },
    { emp_id: "10006", day_of_week: 1 },
    { emp_id: "10006", day_of_week: 2 },
    { emp_id: "10006", day_of_week: 4 },
    { emp_id: "10006", day_of_week: 6 }
  ]
};

let pool = null;

function getPostgresPool() {
  if (pool) return pool;
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  return pool;
}

let tablesEnsured = false;

async function ensureTables(client) {
  if (tablesEnsured) return;

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

  // Seed default data if empty
  const countRes = await client.query("SELECT count(*) as cnt FROM gym_holidays;");
  const count = Number(countRes.rows[0]?.cnt || 0);

  if (count === 0) {
    for (const h of SEED_DATA.gym_holidays) {
      await client.query(
        "INSERT INTO gym_holidays (holiday_date, holiday_name) VALUES ($1, $2) ON CONFLICT (holiday_date) DO NOTHING;",
        [h.date, h.name]
      );
    }
    for (const l of SEED_DATA.leave_reasons) {
      await client.query(
        "INSERT INTO leave_reasons (emp_id, iso_date, leave_type, leave_label, note, updated_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (emp_id, iso_date) DO NOTHING;",
        [l.emp_id, l.iso_date, l.leave_type, l.leave_label, l.note, l.updated_at]
      );
    }
    for (const d of SEED_DATA.employee_dayoffs) {
      await client.query(
        "INSERT INTO employee_dayoffs (emp_id, day_of_week) VALUES ($1, $2) ON CONFLICT (emp_id, day_of_week) DO NOTHING;",
        [d.emp_id, d.day_of_week]
      );
    }
  }

  tablesEnsured = true;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const p = getPostgresPool();
  if (!p) {
    return res.status(200).json({
      ok: false,
      postgres: false,
      message: 'PostgreSQL connection URL (POSTGRES_URL or DATABASE_URL) not configured in environment variables'
    });
  }

  const client = await p.connect();
  try {
    await ensureTables(client);

    if (req.method === 'GET') {
      const [holidaysRes, leaveRes, dayoffsRes, settingsRes] = await Promise.all([
        client.query("SELECT holiday_date, holiday_name FROM gym_holidays ORDER BY holiday_date ASC;"),
        client.query("SELECT emp_id, iso_date, leave_type, leave_label, note, updated_at FROM leave_reasons ORDER BY iso_date ASC;"),
        client.query("SELECT emp_id, day_of_week FROM employee_dayoffs ORDER BY emp_id, day_of_week ASC;"),
        client.query("SELECT key, value FROM app_settings;")
      ]);

      const gymHolidays = holidaysRes.rows.map(r => ({
        date: r.holiday_date,
        name: r.holiday_name
      }));

      const leaveReasons = leaveRes.rows.map(r => ({
        emp_id: r.emp_id,
        iso_date: r.iso_date,
        leave_type: r.leave_type,
        leave_label: r.leave_label,
        note: r.note,
        updated_at: r.updated_at
      }));

      const employeeDayOffs = {};
      dayoffsRes.rows.forEach(r => {
        const empId = String(r.emp_id);
        if (!employeeDayOffs[empId]) employeeDayOffs[empId] = [];
        employeeDayOffs[empId].push(Number(r.day_of_week));
      });

      const appSettings = {};
      settingsRes.rows.forEach(r => {
        appSettings[r.key] = r.value;
      });

      return res.status(200).json({
        ok: true,
        postgres: true,
        data: {
          gym_holidays: gymHolidays,
          leave_reasons: leaveReasons,
          employee_dayoffs: employeeDayOffs,
          app_settings: appSettings
        }
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { action } = body || {};

      if (action === 'save_gym_holiday') {
        const { date, name } = body;
        await client.query(
          "INSERT INTO gym_holidays (holiday_date, holiday_name) VALUES ($1, $2) ON CONFLICT (holiday_date) DO UPDATE SET holiday_name = EXCLUDED.holiday_name;",
          [date, name]
        );
        return res.status(200).json({ ok: true });
      }

      if (action === 'delete_gym_holiday') {
        const { date } = body;
        await client.query("DELETE FROM gym_holidays WHERE holiday_date = $1;", [date]);
        return res.status(200).json({ ok: true });
      }

      if (action === 'save_leave_reason') {
        const { emp_id, iso_date, leave_type, leave_label, note, updated_at } = body;
        await client.query(`
          INSERT INTO leave_reasons (emp_id, iso_date, leave_type, leave_label, note, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (emp_id, iso_date)
          DO UPDATE SET
            leave_type = EXCLUDED.leave_type,
            leave_label = EXCLUDED.leave_label,
            note = EXCLUDED.note,
            updated_at = EXCLUDED.updated_at;
        `, [emp_id, iso_date, leave_type, leave_label || '', note || '', updated_at || new Date().toISOString()]);
        return res.status(200).json({ ok: true });
      }

      if (action === 'delete_leave_reason') {
        const { emp_id, iso_date } = body;
        await client.query("DELETE FROM leave_reasons WHERE emp_id = $1 AND iso_date = $2;", [emp_id, iso_date]);
        return res.status(200).json({ ok: true });
      }

      if (action === 'save_employee_dayoffs') {
        const { emp_id, days } = body;
        await client.query("BEGIN;");
        try {
          await client.query("DELETE FROM employee_dayoffs WHERE emp_id = $1;", [emp_id]);
          if (Array.isArray(days)) {
            for (const d of days) {
              await client.query(
                "INSERT INTO employee_dayoffs (emp_id, day_of_week) VALUES ($1, $2) ON CONFLICT (emp_id, day_of_week) DO NOTHING;",
                [emp_id, Number(d)]
              );
            }
          }
          await client.query("COMMIT;");
        } catch (e) {
          await client.query("ROLLBACK;");
          throw e;
        }
        return res.status(200).json({ ok: true });
      }

      if (action === 'save_setting') {
        const { key, value } = body;
        await client.query(
          "INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;",
          [key, typeof value === 'object' ? JSON.stringify(value) : String(value)]
        );
        return res.status(200).json({ ok: true });
      }

      if (action === 'save_imported_records') {
        const { employees, records } = body;
        await client.query("BEGIN;");
        try {
          if (Array.isArray(employees)) {
            for (const emp of employees) {
              await client.query(
                "INSERT INTO employees (id, name, card_id) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, card_id = EXCLUDED.card_id;",
                [emp.id, emp.name, emp.cardId || emp.id]
              );
            }
          }
          if (Array.isArray(records)) {
            for (const r of records) {
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
                r.empId,
                r.cardId || '',
                r.empName,
                r.date,
                r.isoDate,
                r.year,
                r.month,
                r.day,
                r.dayOfWeek,
                r.count || 0,
                JSON.stringify(r.punches || []),
                r.checkIn || '',
                r.checkOut || '',
                r.workHours !== undefined ? r.workHours : null,
                r.workHoursFormatted || '',
                r.initialStatus || 'absent'
              ]);
            }
          }
          await client.query("COMMIT;");
        } catch (e) {
          await client.query("ROLLBACK;");
          throw e;
        }
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ ok: false, error: 'Unknown action' });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error("PostgreSQL API error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  } finally {
    client.release();
  }
}
