#!/usr/bin/env python3
"""
Lightweight, Zero-Dependency XLSX to RFC-4180 CSV Converter
Extracts the first worksheet from an .xlsx file using Python standard library (zipfile, xml.etree).
"""
import sys
import os
import zipfile
import xml.etree.ElementTree as ET
import csv

def xlsx_to_csv(xlsx_path, csv_path):
    if not os.path.exists(xlsx_path):
        print(f"[ERROR] File not found: {xlsx_path}", file=sys.stderr)
        sys.exit(1)

    with zipfile.ZipFile(xlsx_path, 'r') as z:
        # 1. Parse shared strings if present
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            ns = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
            for elem in tree.findall(f'{ns}si'):
                text_parts = [t.text for t in elem.iter(f'{ns}t') if t.text]
                shared_strings.append(''.join(text_parts))

        # 2. Find first worksheet
        sheet_names = [f for f in z.namelist() if f.startswith('xl/worksheets/sheet') and f.endswith('.xml')]
        if not sheet_names:
            print("[ERROR] No worksheets found in Excel file", file=sys.stderr)
            sys.exit(1)
        first_sheet = sorted(sheet_names)[0]

        sheet_tree = ET.fromstring(z.read(first_sheet))
        ns = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
        sheet_data = sheet_tree.find(f'{ns}sheetData')

        rows = []
        if sheet_data is not None:
            for row_elem in sheet_data.findall(f'{ns}row'):
                col_dict = {}
                max_col = 0
                for c in row_elem.findall(f'{ns}c'):
                    ref = c.attrib.get('r', '')
                    col_str = ''.join([ch for ch in ref if ch.isalpha()])
                    # Convert column letters (A, B, ... AA) to index
                    col_idx = 0
                    for ch in col_str:
                        col_idx = col_idx * 26 + (ord(ch.upper()) - ord('A') + 1)
                    col_idx -= 1
                    if col_idx > max_col:
                        max_col = col_idx

                    cell_type = c.attrib.get('t', '')
                    v_elem = c.find(f'{ns}v')
                    val = v_elem.text if v_elem is not None else ''

                    if cell_type == 's' and val.isdigit():
                        idx = int(val)
                        if idx < len(shared_strings):
                            val = shared_strings[idx]
                    col_dict[col_idx] = val

                row_cells = [col_dict.get(i, '') for i in range(max_col + 1)]
                rows.append(row_cells)

    # Filter out trailing completely empty rows
    while rows and not any(cell.strip() for cell in rows[-1]):
        rows.pop()

    # Write to CSV with UTF-8
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        for r in rows:
            writer.writerow(r)

    print(f"[OK] Converted {xlsx_path} -> {csv_path} ({len(rows)} rows)")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python convert-xlsx-to-csv.py <input.xlsx> <output.csv>", file=sys.stderr)
        sys.exit(1)
    xlsx_to_csv(sys.argv[1], sys.argv[2])

