import os
import json
import re

try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF is not installed. Please install it by running: pip install pymupdf")
    exit(1)

COUNTRY_CODES = {
    "nigeria": "ng",
    "ghana": "gh",
    "usa": "us",
    "uk": "gb",
    "kenya": "ke"
}

def get_country_code(country_name):
    return COUNTRY_CODES.get(country_name.lower(), country_name.lower())

def parse_to_html(text):
    if not text: return ""
    
    # Clean up isolated list markers (e.g. '1.\nText', '(1)\nText', 'II.\nText') to be on the same line
    text = re.sub(r'(?im)^(\d+[\.\)]|\(\d+\)|[A-Z][\.\)]|[a-z][\.\)]|[ivx]+[\.\)])\s*\n\s*', r'\1 ', text)
    
    lines = text.split('\n')
    html_lines = []
    
    in_list = False
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Heuristic 1: Headings (ALL CAPS and relatively short)
        if line.isupper() and len(line) < 60 and len(line) > 3:
            if in_list:
                html_lines.append("</ul>")
                in_list = False
            html_lines.append(f"<h3 class='section-heading'>{line}</h3>")
            continue
            
        # Heuristic 2: Numbered main points e.g. "1. Number Bases" or "(1) acquire..."
        if re.match(r'^(\d+[\.\)]?|\(\d+\))\s', line):
            if in_list:
                html_lines.append("</ul>")
                in_list = False
            html_lines.append(f"<p><strong>{line}</strong></p>")
            continue
            
        # Heuristic 3: Sub-points / letters e.g. "a.", "b.", "i.", "(a)"
        if re.match(r'^([a-z][\.\)]|[ivx]+[\.\)]|\([a-z]\)|\([ivx]+\))\s', line.lower()):
            if not in_list:
                html_lines.append("<ul class='premium-list'>")
                in_list = True
            clean_line = re.sub(r'^([a-z][\.\)]|[ivx]+[\.\)]|\([a-z]\)|\([ivx]+\))\s', '', line, flags=re.IGNORECASE)
            html_lines.append(f"<li>{clean_line}</li>")
            continue
            
        # Normal paragraph
        if in_list:
            html_lines.append(f"<li class='list-continuation'>{line}</li>")
        else:
            html_lines.append(f"<p>{line}</p>")
            
    if in_list:
        html_lines.append("</ul>")
        
    return "\n".join(html_lines)


def split_table_row(row):
    if len(row) < 2: return [row]
    col0 = row[0] or ""
    col1 = row[1] or ""
    
    def get_chunks(text, is_col0):
        if not text: return []
        if is_col0:
            pattern = r'(?m)^(?=\d+\.\s|SECTION\s)'
        else:
            pattern = r'(?m)^(?=Candidates should be able to:)'
        parts = re.split(pattern, text, flags=re.IGNORECASE)
        return [p.strip() for p in parts if p.strip()]

    c0 = get_chunks(col0, True)
    c1 = get_chunks(col1, False)

    if len(c0) <= 1 and len(c1) <= 1:
        return [row]
        
    i = 0
    j = 0
    res = []
    while i < len(c0) or j < len(c1):
        p0 = c0[i] if i < len(c0) else ''
        p1 = c1[j] if j < len(c1) else ''
        
        if p0.upper().startswith('SECTION'):
            res.append([p0, ''] + list(row[2:]))
            i += 1
        else:
            res.append([p0, p1] + list(row[2:]))
            i += 1
            j += 1
            
    return res

def extract_items_from_page(page):
    tabs = page.find_tables()
    table_bboxes = []
    if tabs and tabs.tables:
        table_bboxes = [t.bbox for t in tabs.tables]
    
    blocks = page.get_text("blocks")
    items = []
    
    if tabs and tabs.tables:
        for tab in tabs:
            items.append((tab.bbox[1], 'table', tab.extract()))
            
    for b in blocks:
        if b[6] != 0: continue # not text
        bx0, by0, bx1, by1 = b[:4]
        
        # Check intersection with any table
        intersects = False
        for tx0, ty0, tx1, ty1 in table_bboxes:
            if not (bx1 < tx0 or bx0 > tx1 or by1 < ty0 or by0 > ty1):
                intersects = True
                break
        
        if not intersects:
            items.append((by0, 'text', b[4]))
            
    items.sort(key=lambda x: x[0])
    return [(item_type, content) for _, item_type, content in items]


def process_pdfs():
    src_base = r"c:\myproject\my_exam_companion\syallabus"
    dest_base = r"c:\myproject\my_exam_companion\new_staging_area"

    if not os.path.exists(src_base):
        print(f"Source directory not found: {src_base}")
        return

    global_index = {"countries": []}

    for country in os.listdir(src_base):
        country_path = os.path.join(src_base, country)
        if not os.path.isdir(country_path): continue
        
        country_code = get_country_code(country)
        country_data = {
            "id": country_code,
            "name": country.capitalize(),
            "exams": [],
            "url": f"/{country_code}/syllabus/index.json"
        }
        country_index_data = {"country": country.capitalize(), "country_code": country_code, "exams": []}

        for exam in os.listdir(country_path):
            exam_path = os.path.join(country_path, exam)
            if not os.path.isdir(exam_path): continue
            
            exam_code = exam.lower()
            country_data["exams"].append(exam_code.upper())
            
            exam_info = {"id": exam_code, "name": exam_code.upper(), "url": f"/{country_code}/syllabus/{exam_code}/index.json"}
            country_index_data["exams"].append(exam_info)

            exam_index_data = {"exam": exam_code.upper(), "country": country.capitalize(), "subjects": []}

            dest_exam_dir = os.path.join(dest_base, country_code, "syllabus", exam_code)
            dest_subjects_dir = os.path.join(dest_exam_dir, "subjects")
            os.makedirs(dest_subjects_dir, exist_ok=True)

            for pdf_file in os.listdir(exam_path):
                if not pdf_file.endswith(".pdf"): continue
                
                pdf_path = os.path.join(exam_path, pdf_file)
                subject_name = pdf_file[:-4]
                subject_id = subject_name.lower().replace(" ", "_").replace("-", "_")

                print(f"Processing (Premium Table Extractor): {country_code}/{exam_code}/{subject_name}...")
                
                all_items = []
                try:
                    doc = fitz.open(pdf_path)
                    for page in doc:
                        all_items.extend(extract_items_from_page(page))
                    doc.close()
                except Exception as e:
                    print(f"Error reading {pdf_path}: {e}")
                    continue
                    
                # Filter out headers, footers, and page numbers
                filtered_items = []
                subject_name_lower = subject_name.lower()
                subject_first_word = subject_name_lower.split()[0] if subject_name_lower else ""
                
                for item_type, content in all_items:
                    if item_type == 'text':
                        text_stripped = content.strip()
                        if text_stripped.isdigit(): continue
                        ts_lower = text_stripped.lower()
                        if ts_lower == subject_name_lower or ts_lower == subject_first_word: continue
                        if not text_stripped: continue
                    filtered_items.append((item_type, content))
                
                html_content = ""
                in_table = False
                table_header_rendered = False
                
                for item_type, content in filtered_items:
                    if item_type == 'text':
                        if in_table:
                            html_content += "  </tbody>\n</table>\n</div>\n"
                            in_table = False
                            table_header_rendered = False
                        html_content += f"<div class='premium-text-block'>\n{parse_to_html(content)}\n</div>\n"
                        
                    elif item_type == 'table':
                        if not in_table:
                            html_content += "<div class='table-responsive'>\n<table class='premium-table'>\n"
                            in_table = True
                            table_header_rendered = False
                            
                        for i, row in enumerate(content):
                            # Detect header
                            is_header = False
                            if row and len(row) > 0 and row[0] and "TOPICS" in row[0].upper():
                                is_header = True
                                
                            if is_header:
                                if not table_header_rendered:
                                    html_content += "  <thead>\n    <tr>\n"
                                    for cell in row:
                                        html_content += f"      <th>{parse_to_html(cell or '')}</th>\n"
                                    html_content += "    </tr>\n  </thead>\n  <tbody>\n"
                                    table_header_rendered = True
                                else:
                                    continue # Skip redundant header
                            else:
                                if not table_header_rendered and i == 0:
                                    html_content += "  <tbody>\n"
                                    table_header_rendered = True # avoid repeating this block
                                    
                                sub_rows = split_table_row(row)
                                for s_row in sub_rows:
                                    if s_row[0] and s_row[0].upper().startswith("SECTION"):
                                        html_content += f"    <tr class='section-header-row'>\n"
                                        html_content += f"      <th colspan='2'>{parse_to_html(s_row[0])}</th>\n"
                                        html_content += "    </tr>\n"
                                    else:
                                        html_content += "    <tr>\n"
                                        for cell in s_row:
                                            html_content += f"      <td>{parse_to_html(cell or '')}</td>\n"
                                        html_content += "    </tr>\n"
                                    
                if in_table:
                    html_content += "  </tbody>\n</table>\n</div>\n"

                subject_json_path = os.path.join(dest_subjects_dir, f"{subject_id}.json")
                subject_data = {
                    "id": subject_id,
                    "name": subject_name,
                    "exam": exam_code.upper(),
                    "country": country.capitalize(),
                    "content": html_content
                }
                
                with open(subject_json_path, "w", encoding="utf-8") as f:
                    json.dump(subject_data, f, indent=4)

                exam_index_data["subjects"].append({
                    "id": subject_id,
                    "name": subject_name,
                    "pdf_url": f"/syallabus/{country}/{exam}/{pdf_file}",
                    "json_url": f"/content/syllabuses/{country_code}/{exam_code}/subjects/{subject_id}.json"
                })

            with open(os.path.join(dest_exam_dir, "index.json"), "w", encoding='utf-8') as f:
                json.dump(exam_index_data, f, indent=2)

        with open(os.path.join(dest_base, country_code, "syllabus", "index.json"), "w", encoding='utf-8') as f:
            json.dump(country_index_data, f, indent=2)

        global_index["countries"].append(country_data)

    with open(os.path.join(dest_base, "syllabus_global_index.json"), "w", encoding='utf-8') as f:
        json.dump(global_index, f, indent=2)
        
    print("Premium Syllabus extraction complete!")

if __name__ == "__main__":
    process_pdfs()
