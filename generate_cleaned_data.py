import zipfile
import xml.etree.ElementTree as ET
import json
import re
import os
import sqlite3
import base64
from datetime import datetime, timedelta

NS = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
ET.register_namespace('', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')

def process():
    print("Reading ExportTimePerson.xlsx...")
    with zipfile.ZipFile('ExportTimePerson.xlsx', 'r') as zin:
        sst_root = ET.fromstring(zin.read('xl/sharedStrings.xml'))
        sst = [''.join([t.text or '' for t in si.findall('.//x:t', NS)]) for si in sst_root.findall('x:si', NS)]

        # Find Thiti string indices
        thiti_indices = set()
        for idx, s in enumerate(sst):
            if 'thiti' in s.lower():
                thiti_indices.add(str(idx))
        print(f"Thiti string indices: {thiti_indices}")

        sheet_xml = zin.read('xl/worksheets/sheet.xml')
        root = ET.fromstring(sheet_xml)
        sheet_data = root.find('x:sheetData', NS)
        
        # Filter rows
        original_rows = list(sheet_data.findall('x:row', NS))
        kept_rows = []
        parsed_records = []

        new_row_idx = 1
        for row in original_rows:
            # Extract cell values for this row
            cells_map = {}
            for c in row.findall('x:c', NS):
                r_ref = c.get('r', '')
                col = ''.join([ch for ch in r_ref if ch.isalpha()])
                t = c.get('t')
                v_elem = c.find('x:v', NS)
                raw_val = v_elem.text if v_elem is not None else ''
                val = sst[int(raw_val)] if t == 's' and raw_val.isdigit() else raw_val
                cells_map[col] = (val, c)

            # Check if this row belongs to Thiti
            name_val = cells_map.get('C', ('', None))[0]
            if 'thiti' in name_val.lower() or cells_map.get('A', ('', None))[0] == '10004':
                continue

            # If header row
            if cells_map.get('A', ('', None))[0] == 'รหัสพนักงาน':
                kept_rows.append(row)
                continue

            # Update row attribute 'r'
            new_row_idx += 1
            row.set('r', str(new_row_idx))
            for c in row.findall('x:c', NS):
                old_r = c.get('r', '')
                col = ''.join([ch for ch in old_r if ch.isalpha()])
                c.set('r', f"{col}{new_row_idx}")
            kept_rows.append(row)

            # Build record object for JSON / Web UI
            emp_id = cells_map.get('A', ('', None))[0]
            card_id = cells_map.get('B', ('', None))[0]
            emp_name = name_val.strip()
            date_str = cells_map.get('D', ('', None))[0] # DD/MM/YYYY
            count_str = cells_map.get('O', ('0', None))[0] or '0'
            count = int(count_str) if count_str.isdigit() else 0

            punches = []
            for col_letter in ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N']:
                p_val = cells_map.get(col_letter, ('', None))[0].strip()
                if p_val:
                    punches.append(p_val)

            # Parse date details
            # Date format: DD/MM/YYYY
            d_parts = date_str.split('/')
            day = int(d_parts[0])
            month = int(d_parts[1])
            year = int(d_parts[2])
            dt = datetime(year, month, day)
            day_of_week = dt.weekday() # 0 = Monday, 6 = Sunday

            check_in = punches[0] if len(punches) > 0 else ''
            check_out = punches[-1] if len(punches) > 1 else ''

            # Calculate work hours if check_in and check_out exist
            work_hours = None
            work_hours_formatted = ''
            if check_in and check_out:
                try:
                    t_in = datetime.strptime(check_in, '%H:%M')
                    t_out = datetime.strptime(check_out, '%H:%M')
                    diff_min = (t_out - t_in).total_seconds() / 60
                    if diff_min >= 0:
                        hrs = int(diff_min // 60)
                        mins = int(diff_min % 60)
                        work_hours = round(diff_min / 60, 2)
                        work_hours_formatted = f"{hrs} ชม. {mins} น."
                except Exception:
                    pass

            status = 'absent'
            if count >= 2:
                status = 'normal'
            elif count == 1:
                status = 'single_punch'

            parsed_records.append({
                'empId': emp_id,
                'cardId': card_id,
                'empName': emp_name,
                'date': date_str,
                'isoDate': f"{year:04d}-{month:02d}-{day:02d}",
                'year': year,
                'month': month,
                'day': day,
                'dayOfWeek': day_of_week, # 0=Mon, 6=Sun
                'count': count,
                'punches': punches,
                'checkIn': check_in,
                'checkOut': check_out,
                'workHours': work_hours,
                'workHoursFormatted': work_hours_formatted,
                'initialStatus': status
            })

        print(f"Total kept rows in new sheet: {len(kept_rows)}")
        print(f"Total parsed records: {len(parsed_records)}")

        # Update sheet_data children
        sheet_data.clear()
        for r in kept_rows:
            sheet_data.append(r)

        # Update dimension tag
        dim = root.find('x:dimension', NS)
        if dim is not None:
            dim.set('ref', f"A1:O{len(kept_rows)}")

        # Write new cleaned Excel file
        print("Writing ExportTimePerson_Cleaned.xlsx...")
        new_sheet_xml = ET.tostring(root, encoding='utf-8', xml_declaration=True)
        with zipfile.ZipFile('ExportTimePerson_Cleaned.xlsx', 'w', compression=zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                if item.filename == 'xl/worksheets/sheet.xml':
                    zout.writestr(item, new_sheet_xml)
                else:
                    zout.writestr(item, zin.read(item.filename))
        print("ExportTimePerson_Cleaned.xlsx created successfully!")

    # Process all years (2022 - 2026) from CNYG221260238_attlog.dat
    print("Processing CNYG221260238_attlog.dat for all years (2022 - 2026)...")
    known_employees = [
        {'id': '10001', 'name': 'Bumroongchat', 'cardId': '10001'},
        {'id': '10002', 'name': 'Weerayuth', 'cardId': '10002'},
        {'id': '10003', 'name': 'Sujika', 'cardId': '10003'},
        {'id': '10005', 'name': 'Amnaj', 'cardId': '10005'},
        {'id': '10006', 'name': 'ประวิทย์ ยาเพ็ชร', 'cardId': '10006'},
    ]
    known_map = {e['id']: e for e in known_employees}

    punches_map = {}
    with open('CNYG221260238_attlog.dat', 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            parts = line.strip().split('\t')
            if len(parts) >= 2:
                emp = parts[0].strip()
                if emp not in known_map:
                    continue
                dt_parts = parts[1].strip().split(' ')
                if len(dt_parts) >= 2:
                    d_str = dt_parts[0]
                    t_str = dt_parts[1][:5]
                    key = (emp, d_str)
                    if key not in punches_map:
                        punches_map[key] = []
                    punches_map[key].append(t_str)

    # Generate daily records for each employee from 2022-09-21 to 2026-09-17
    start_date = datetime(2022, 9, 21)
    end_date = datetime(2026, 9, 17)
    delta = timedelta(days=1)

    all_records = []
    curr = start_date
    while curr <= end_date:
        d_str = curr.strftime('%Y-%m-%d')
        year = curr.year
        month = curr.month
        day = curr.day
        day_of_week = curr.weekday() # 0 = Monday, 6 = Sunday
        date_th = f"{day:02d}/{month:02d}/{year}"

        for emp in known_employees:
            emp_id = emp['id']
            raw_punches = punches_map.get((emp_id, d_str), [])
            # Deduplicate & sort punch times
            sorted_punches = sorted(list(set(raw_punches)))
            count = len(sorted_punches)

            check_in = sorted_punches[0] if count > 0 else ''
            check_out = sorted_punches[-1] if count > 1 else ''

            work_hours = None
            work_hours_formatted = ''
            if check_in and check_out:
                try:
                    t_in = datetime.strptime(check_in, '%H:%M')
                    t_out = datetime.strptime(check_out, '%H:%M')
                    diff_min = (t_out - t_in).total_seconds() / 60
                    if diff_min >= 0:
                        hrs = int(diff_min // 60)
                        mins = int(diff_min % 60)
                        work_hours = round(diff_min / 60, 2)
                        work_hours_formatted = f"{hrs} ชม. {mins} น."
                except Exception:
                    pass

            status = 'absent'
            if count >= 2:
                status = 'normal'
            elif count == 1:
                status = 'single_punch'

            all_records.append({
                'empId': emp_id,
                'cardId': emp['cardId'],
                'empName': emp['name'],
                'date': date_th,
                'isoDate': d_str,
                'year': year,
                'month': month,
                'day': day,
                'dayOfWeek': day_of_week,
                'count': count,
                'punches': sorted_punches,
                'checkIn': check_in,
                'checkOut': check_out,
                'workHours': work_hours,
                'workHoursFormatted': work_hours_formatted,
                'initialStatus': status
            })

        curr += delta

    print(f"Total multi-year records generated: {len(all_records)}")

    # Public/Official Thai holidays removed per requirement
    thai_holidays = []

    export_data = {
        'employees': known_employees,
        'years': [2022, 2023, 2024, 2025, 2026],
        'holidays': thai_holidays,
        'records': all_records
    }

    # Write data.js for legacy/fallback script import
    with open('data.js', 'w', encoding='utf-8') as f:
        f.write("window.ATTENDANCE_DATA = " + json.dumps(export_data, ensure_ascii=False, indent=2) + ";\n")
    print("data.js written successfully with all years (2022 - 2026)!")

    # Create SQLite 3 Database (attendance.db) and Base64 fallback (attendance_db.js)
    create_sqlite_db(known_employees, all_records)

def create_sqlite_db(known_employees, all_records):
    db_path = 'attendance.db'
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
        except Exception:
            pass
    
    print("Creating SQLite 3 database (attendance.db)...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Employees table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS employees (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            card_id TEXT
        );
    """)

    # 2. Attendance records table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            emp_id TEXT NOT NULL,
            card_id TEXT,
            emp_name TEXT NOT NULL,
            date TEXT NOT NULL,
            iso_date TEXT NOT NULL,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            day INTEGER NOT NULL,
            day_of_week INTEGER NOT NULL,
            count INTEGER NOT NULL DEFAULT 0,
            punches TEXT,
            check_in TEXT,
            check_out TEXT,
            work_hours REAL,
            work_hours_formatted TEXT,
            initial_status TEXT,
            UNIQUE(emp_id, iso_date)
        );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_emp ON attendance_records(emp_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_iso_date ON attendance_records(iso_date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_year ON attendance_records(year);")

    # 3. Employee day-offs table (formerly LocalStorage)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS employee_dayoffs (
            emp_id TEXT NOT NULL,
            day_of_week INTEGER NOT NULL,
            PRIMARY KEY (emp_id, day_of_week)
        );
    """)

    # 4. Gym holidays table (formerly LocalStorage)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS gym_holidays (
            holiday_date TEXT PRIMARY KEY,
            holiday_name TEXT NOT NULL
        );
    """)

    # 5. Leave reasons table (formerly LocalStorage)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leave_reasons (
            emp_id TEXT NOT NULL,
            iso_date TEXT NOT NULL,
            leave_type TEXT NOT NULL,
            leave_label TEXT,
            note TEXT,
            updated_at TEXT,
            PRIMARY KEY (emp_id, iso_date)
        );
    """)

    # 6. App settings table (formerly LocalStorage: theme, filters, pagination, etc.)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    """)

    # Insert Employees
    cursor.executemany(
        "INSERT INTO employees (id, name, card_id) VALUES (?, ?, ?);",
        [(e['id'], e['name'], e.get('cardId', e['id'])) for e in known_employees]
    )

    # Insert Attendance Records
    cursor.executemany(
        """
        INSERT INTO attendance_records (
            emp_id, card_id, emp_name, date, iso_date, year, month, day, day_of_week,
            count, punches, check_in, check_out, work_hours, work_hours_formatted, initial_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """,
        [
            (
                r['empId'],
                r.get('cardId', ''),
                r['empName'],
                r['date'],
                r['isoDate'],
                r['year'],
                r['month'],
                r['day'],
                r['dayOfWeek'],
                r['count'],
                json.dumps(r['punches'], ensure_ascii=False),
                r.get('checkIn', ''),
                r.get('checkOut', ''),
                r.get('workHours'),
                r.get('workHoursFormatted', ''),
                r.get('initialStatus', 'absent')
            )
            for r in all_records
        ]
    )

    # Default Empirical Day-Offs
    default_dayoffs = [
        ('10001', 3), ('10001', 6), # Bumroongchat: Thu, Sun
        ('10002', 6),               # Weerayuth: Sun
        ('10003', 6),               # Sujika: Sun
        ('10005', 5), ('10005', 6), # Amnaj: Sat, Sun
        ('10006', 0), ('10006', 1), ('10006', 2), ('10006', 4), ('10006', 6) # ประวิทย์: Mon, Tue, Wed, Fri, Sun
    ]
    cursor.executemany("INSERT INTO employee_dayoffs (emp_id, day_of_week) VALUES (?, ?);", default_dayoffs)

    # Default App Settings (Theme, Saved Filters)
    default_settings = [
        ('app_theme', 'light'),
        ('saved_filters', json.dumps({
            "filterYear": "2026",
            "filterMonth": "ALL",
            "filterEmployee": "ALL",
            "filterStatus": "ALL",
            "filterSearch": "",
            "activeView": "summary",
            "pageSize": 50
        }, ensure_ascii=False))
    ]
    cursor.executemany("INSERT INTO app_settings (key, value) VALUES (?, ?);", default_settings)

    conn.commit()
    conn.close()

    db_size = os.path.getsize(db_path)
    print(f"attendance.db created successfully! Total records: {len(all_records)}, Size: {db_size:,} bytes")

    # Read binary and generate attendance_db.js for offline/file:// base64 fallback
    with open(db_path, 'rb') as f:
        db_bytes = f.read()
        db_b64 = base64.b64encode(db_bytes).decode('ascii')

    with open('attendance_db.js', 'w', encoding='utf-8') as f:
        f.write(f"window.SQLITE_DB_BASE64 = '{db_b64}';\n")
    print("attendance_db.js written successfully with Base64 SQLite database!")

if __name__ == '__main__':
    process()
