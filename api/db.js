import { createClient } from '@libsql/client/web';

const SEED_DATA = {
  gym_holidays: [
    { date: "2025-01-01", name: "ปีใหม่ 2025" },
    { date: "2025-04-14", name: "สงกราน2025" },
    { date: "2025-04-15", name: "สงกราน2025" },
    { date: "2025-04-16", name: "สงกราน2025" },
    { date: "2025-12-31", name: "ปีใหม่ 2026" },
    { date: "2026-01-01", name: "ปีใหม่ 2026" },
    { date: "2026-01-02", name: "ปีใหม่ 2026" },
    { date: "2026-01-03", name: "ปีใหม่ 2026" },
    { date: "2026-04-13", name: "สงกราน" },
    { date: "2026-04-14", name: "สงกราน" },
    { date: "2026-04-15", name: "สงกราน" },
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

function getTursoClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    return null;
  }
  return createClient({ url, authToken });
}

async function ensureTables(client) {
  await client.batch([
    `CREATE TABLE IF NOT EXISTS gym_holidays (
      holiday_date TEXT PRIMARY KEY,
      holiday_name TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS leave_reasons (
      emp_id TEXT NOT NULL,
      iso_date TEXT NOT NULL,
      leave_type TEXT NOT NULL,
      leave_label TEXT,
      note TEXT,
      updated_at TEXT,
      PRIMARY KEY (emp_id, iso_date)
    );`,
    `CREATE TABLE IF NOT EXISTS employee_dayoffs (
      emp_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      PRIMARY KEY (emp_id, day_of_week)
    );`,
    `CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );`
  ]);

  // Seed default data if empty
  const countRes = await client.execute("SELECT count(*) as cnt FROM gym_holidays;");
  const count = Number(countRes.rows[0]?.cnt || 0);

  if (count === 0) {
    const seedStmts = [];
    for (const h of SEED_DATA.gym_holidays) {
      seedStmts.push({
        sql: "INSERT OR IGNORE INTO gym_holidays (holiday_date, holiday_name) VALUES (?, ?);",
        args: [h.date, h.name]
      });
    }
    for (const l of SEED_DATA.leave_reasons) {
      seedStmts.push({
        sql: "INSERT OR IGNORE INTO leave_reasons (emp_id, iso_date, leave_type, leave_label, note, updated_at) VALUES (?, ?, ?, ?, ?, ?);",
        args: [l.emp_id, l.iso_date, l.leave_type, l.leave_label, l.note, l.updated_at]
      });
    }
    for (const d of SEED_DATA.employee_dayoffs) {
      seedStmts.push({
        sql: "INSERT OR IGNORE INTO employee_dayoffs (emp_id, day_of_week) VALUES (?, ?);",
        args: [d.emp_id, d.day_of_week]
      });
    }
    if (seedStmts.length > 0) {
      await client.batch(seedStmts);
    }
  }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getTursoClient();
  if (!client) {
    return res.status(200).json({
      ok: false,
      turso: false,
      message: 'Turso environment variables (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN) not configured'
    });
  }

  try {
    await ensureTables(client);

    if (req.method === 'GET') {
      const [holidaysRes, leaveRes, dayoffsRes, settingsRes] = await Promise.all([
        client.execute("SELECT holiday_date, holiday_name FROM gym_holidays ORDER BY holiday_date ASC;"),
        client.execute("SELECT emp_id, iso_date, leave_type, leave_label, note, updated_at FROM leave_reasons;"),
        client.execute("SELECT emp_id, day_of_week FROM employee_dayoffs;"),
        client.execute("SELECT key, value FROM app_settings;")
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
        turso: true,
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
        await client.execute({
          sql: "INSERT OR REPLACE INTO gym_holidays (holiday_date, holiday_name) VALUES (?, ?);",
          args: [date, name]
        });
        return res.status(200).json({ ok: true });
      }

      if (action === 'delete_gym_holiday') {
        const { date } = body;
        await client.execute({
          sql: "DELETE FROM gym_holidays WHERE holiday_date = ?;",
          args: [date]
        });
        return res.status(200).json({ ok: true });
      }

      if (action === 'save_leave_reason') {
        const { emp_id, iso_date, leave_type, leave_label, note, updated_at } = body;
        await client.execute({
          sql: "INSERT OR REPLACE INTO leave_reasons (emp_id, iso_date, leave_type, leave_label, note, updated_at) VALUES (?, ?, ?, ?, ?, ?);",
          args: [emp_id, iso_date, leave_type, leave_label || '', note || '', updated_at || new Date().toISOString()]
        });
        return res.status(200).json({ ok: true });
      }

      if (action === 'delete_leave_reason') {
        const { emp_id, iso_date } = body;
        await client.execute({
          sql: "DELETE FROM leave_reasons WHERE emp_id = ? AND iso_date = ?;",
          args: [emp_id, iso_date]
        });
        return res.status(200).json({ ok: true });
      }

      if (action === 'save_employee_dayoffs') {
        const { emp_id, days } = body;
        const stmts = [
          { sql: "DELETE FROM employee_dayoffs WHERE emp_id = ?;", args: [emp_id] }
        ];
        if (Array.isArray(days)) {
          for (const d of days) {
            stmts.push({
              sql: "INSERT INTO employee_dayoffs (emp_id, day_of_week) VALUES (?, ?);",
              args: [emp_id, Number(d)]
            });
          }
        }
        await client.batch(stmts);
        return res.status(200).json({ ok: true });
      }

      if (action === 'save_setting') {
        const { key, value } = body;
        await client.execute({
          sql: "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);",
          args: [key, typeof value === 'object' ? JSON.stringify(value) : String(value)]
        });
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ ok: false, error: 'Unknown action' });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error("Turso API error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
