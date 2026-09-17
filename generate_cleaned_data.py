import zipfile
import xml.etree.ElementTree as ET
import json
import re
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

    # Official Thai holidays from 2022 to 2026
    thai_holidays = [
        # 2022
        {"date": "2022-01-01", "name": "วันขึ้นปีใหม่"},
        {"date": "2022-02-16", "name": "วันมาฆบูชา"},
        {"date": "2022-04-06", "name": "วันจักรี"},
        {"date": "2022-04-13", "name": "วันสงกรานต์"},
        {"date": "2022-04-14", "name": "วันสงกรานต์"},
        {"date": "2022-04-15", "name": "วันสงกรานต์"},
        {"date": "2022-05-01", "name": "วันแรงงานแห่งชาติ"},
        {"date": "2022-05-04", "name": "วันฉัตรมงคล"},
        {"date": "2022-05-15", "name": "วันวิสาขบูชา"},
        {"date": "2022-05-16", "name": "วันหยุดชดเชยวันวิสาขบูชา"},
        {"date": "2022-06-03", "name": "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี"},
        {"date": "2022-07-13", "name": "วันอาสาฬหบูชา"},
        {"date": "2022-07-14", "name": "วันเข้าพรรษา"},
        {"date": "2022-07-28", "name": "วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว (ร.10)"},
        {"date": "2022-08-12", "name": "วันแม่แห่งชาติ"},
        {"date": "2022-10-13", "name": "วันนวมินทรมหาราช (ร.9)"},
        {"date": "2022-10-23", "name": "วันปิยมหาราช"},
        {"date": "2022-10-24", "name": "วันหยุดชดเชยวันปิยมหาราช"},
        {"date": "2022-12-05", "name": "วันคล้ายวันพระบรมราชสมภพ ร.9 / วันพ่อแห่งชาติ"},
        {"date": "2022-12-10", "name": "วันรัฐธรรมนูญ"},
        {"date": "2022-12-12", "name": "วันหยุดชดเชยวันรัฐธรรมนูญ"},
        {"date": "2022-12-31", "name": "วันสิ้นปี"},

        # 2023
        {"date": "2023-01-01", "name": "วันขึ้นปีใหม่"},
        {"date": "2023-01-02", "name": "วันหยุดชดเชยวันขึ้นปีใหม่"},
        {"date": "2023-03-06", "name": "วันมาฆบูชา"},
        {"date": "2023-04-06", "name": "วันจักรี"},
        {"date": "2023-04-13", "name": "วันสงกรานต์"},
        {"date": "2023-04-14", "name": "วันสงกรานต์"},
        {"date": "2023-04-15", "name": "วันสงกรานต์"},
        {"date": "2023-04-17", "name": "วันหยุดชดเชยวันสงกรานต์"},
        {"date": "2023-05-01", "name": "วันแรงงานแห่งชาติ"},
        {"date": "2023-05-04", "name": "วันฉัตรมงคล"},
        {"date": "2023-06-03", "name": "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี / วันวิสาขบูชา"},
        {"date": "2023-06-05", "name": "วันหยุดชดเชยวันเฉลิมพระชนมพรรษาฯ / วันวิสาขบูชา"},
        {"date": "2023-07-28", "name": "วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว (ร.10)"},
        {"date": "2023-08-01", "name": "วันอาสาฬหบูชา"},
        {"date": "2023-08-02", "name": "วันเข้าพรรษา"},
        {"date": "2023-08-12", "name": "วันแม่แห่งชาติ"},
        {"date": "2023-08-14", "name": "วันหยุดชดเชยวันแม่แห่งชาติ"},
        {"date": "2023-10-13", "name": "วันนวมินทรมหาราช (ร.9)"},
        {"date": "2023-10-23", "name": "วันปิยมหาราช"},
        {"date": "2023-12-05", "name": "วันพ่อแห่งชาติ"},
        {"date": "2023-12-10", "name": "วันรัฐธรรมนูญ"},
        {"date": "2023-12-11", "name": "วันหยุดชดเชยวันรัฐธรรมนูญ"},
        {"date": "2023-12-31", "name": "วันสิ้นปี"},

        # 2024
        {"date": "2024-01-01", "name": "วันขึ้นปีใหม่"},
        {"date": "2024-02-24", "name": "วันมาฆบูชา"},
        {"date": "2024-02-26", "name": "วันหยุดชดเชยวันมาฆบูชา"},
        {"date": "2024-04-06", "name": "วันจักรี"},
        {"date": "2024-04-08", "name": "วันหยุดชดเชยวันจักรี"},
        {"date": "2024-04-13", "name": "วันสงกรานต์"},
        {"date": "2024-04-14", "name": "วันสงกรานต์"},
        {"date": "2024-04-15", "name": "วันสงกรานต์"},
        {"date": "2024-04-16", "name": "วันหยุดชดเชยวันสงกรานต์"},
        {"date": "2024-05-01", "name": "วันแรงงานแห่งชาติ"},
        {"date": "2024-05-04", "name": "วันฉัตรมงคล"},
        {"date": "2024-05-06", "name": "วันหยุดชดเชยวันฉัตรมงคล"},
        {"date": "2024-05-22", "name": "วันวิสาขบูชา"},
        {"date": "2024-06-03", "name": "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี"},
        {"date": "2024-07-20", "name": "วันอาสาฬหบูชา"},
        {"date": "2024-07-21", "name": "วันเข้าพรรษา"},
        {"date": "2024-07-22", "name": "วันหยุดชดเชยวันอาสาฬหบูชา"},
        {"date": "2024-07-28", "name": "วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว (ร.10)"},
        {"date": "2024-07-29", "name": "วันหยุดชดเชยวันเฉลิมพระชนมพรรษา ร.10"},
        {"date": "2024-08-12", "name": "วันแม่แห่งชาติ"},
        {"date": "2024-10-13", "name": "วันนวมินทรมหาราช (ร.9)"},
        {"date": "2024-10-14", "name": "วันหยุดชดเชยวันนวมินทรมหาราช"},
        {"date": "2024-10-23", "name": "วันปิยมหาราช"},
        {"date": "2024-12-05", "name": "วันพ่อแห่งชาติ"},
        {"date": "2024-12-10", "name": "วันรัฐธรรมนูญ"},
        {"date": "2024-12-31", "name": "วันสิ้นปี"},

        # 2025
        {"date": "2025-01-01", "name": "วันขึ้นปีใหม่"},
        {"date": "2025-02-12", "name": "วันมาฆบูชา"},
        {"date": "2025-04-06", "name": "วันจักรี"},
        {"date": "2025-04-07", "name": "วันหยุดชดเชยวันจักรี"},
        {"date": "2025-04-13", "name": "วันสงกรานต์"},
        {"date": "2025-04-14", "name": "วันสงกรานต์"},
        {"date": "2025-04-15", "name": "วันสงกรานต์"},
        {"date": "2025-04-16", "name": "วันหยุดชดเชยวันสงกรานต์"},
        {"date": "2025-05-01", "name": "วันแรงงานแห่งชาติ"},
        {"date": "2025-05-05", "name": "วันฉัตรมงคล"},
        {"date": "2025-05-11", "name": "วันวิสาขบูชา"},
        {"date": "2025-05-12", "name": "วันหยุดชดเชยวันวิสาขบูชา"},
        {"date": "2025-06-03", "name": "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี"},
        {"date": "2025-07-10", "name": "วันอาสาฬหบูชา"},
        {"date": "2025-07-11", "name": "วันเข้าพรรษา"},
        {"date": "2025-07-28", "name": "วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว (ร.10)"},
        {"date": "2025-08-12", "name": "วันแม่แห่งชาติ"},
        {"date": "2025-10-13", "name": "วันนวมินทรมหาราช (ร.9)"},
        {"date": "2025-10-23", "name": "วันปิยมหาราช"},
        {"date": "2025-12-05", "name": "วันพ่อแห่งชาติ"},
        {"date": "2025-12-10", "name": "วันรัฐธรรมนูญ"},
        {"date": "2025-12-31", "name": "วันสิ้นปี"},

        # 2026
        {"date": "2026-01-01", "name": "วันขึ้นปีใหม่"},
        {"date": "2026-03-03", "name": "วันมาฆบูชา"},
        {"date": "2026-04-06", "name": "วันจักรี"},
        {"date": "2026-04-13", "name": "วันสงกรานต์"},
        {"date": "2026-04-14", "name": "วันสงกรานต์"},
        {"date": "2026-04-15", "name": "วันสงกรานต์"},
        {"date": "2026-05-01", "name": "วันแรงงานแห่งชาติ"},
        {"date": "2026-05-04", "name": "วันฉัตรมงคล"},
        {"date": "2026-05-31", "name": "วันวิสาขบูชา"},
        {"date": "2026-06-01", "name": "วันหยุดชดเชยวันวิสาขบูชา"},
        {"date": "2026-06-03", "name": "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี"},
        {"date": "2026-07-28", "name": "วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว (ร.10)"},
        {"date": "2026-07-29", "name": "วันอาสาฬหบูชา"},
        {"date": "2026-07-30", "name": "วันเข้าพรรษา"},
        {"date": "2026-08-12", "name": "วันแม่แห่งชาติ"},
        {"date": "2026-10-13", "name": "วันนวมินทรมหาราช (ร.9)"},
        {"date": "2026-10-23", "name": "วันปิยมหาราช"},
        {"date": "2026-12-05", "name": "วันพ่อแห่งชาติ"},
        {"date": "2026-12-10", "name": "วันรัฐธรรมนูญ"},
        {"date": "2026-12-31", "name": "วันสิ้นปี"}
    ]

    export_data = {
        'employees': known_employees,
        'years': [2022, 2023, 2024, 2025, 2026],
        'holidays': thai_holidays,
        'records': all_records
    }

    # Write data.js for immediate script import
    with open('data.js', 'w', encoding='utf-8') as f:
        f.write("window.ATTENDANCE_DATA = " + json.dumps(export_data, ensure_ascii=False, indent=2) + ";\n")
    print("data.js written successfully with all years (2022 - 2026)!")

if __name__ == '__main__':
    process()
