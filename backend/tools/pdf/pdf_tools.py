import io
import os
import zipfile
import base64
import tempfile
from pypdf import PdfWriter, PdfReader
import fitz  # PyMuPDF
from pdf2docx import Converter

try:
    from xhtml2pdf import pisa
    import pdfplumber
    import pandas as pd
except ImportError:
    pass

def merge_pdfs(pdf_bytes_list):
    writer = PdfWriter()
    for pdf_bytes in pdf_bytes_list:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            writer.add_page(page)
    
    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return base64.b64encode(output.read()).decode('utf-8'), 'pdf'

def split_pdf(pdf_bytes):
    reader = PdfReader(io.BytesIO(pdf_bytes))
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for i in range(len(reader.pages)):
            writer = PdfWriter()
            writer.add_page(reader.pages[i])
            out_pdf = io.BytesIO()
            writer.write(out_pdf)
            zip_file.writestr(f"page_{i+1}.pdf", out_pdf.getvalue())
            
    zip_buffer.seek(0)
    return base64.b64encode(zip_buffer.read()).decode('utf-8'), 'zip'

def pdf_to_word(pdf_bytes):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
        temp_pdf.write(pdf_bytes)
        temp_pdf_path = temp_pdf.name
        
    temp_docx_path = temp_pdf_path.replace('.pdf', '.docx')
    cv = Converter(temp_pdf_path)
    cv.convert(temp_docx_path, start=0, end=None)
    cv.close()
    
    with open(temp_docx_path, 'rb') as f:
        docx_bytes = f.read()
        
    os.remove(temp_pdf_path)
    os.remove(temp_docx_path)
    return base64.b64encode(docx_bytes).decode('utf-8'), 'docx'

def rotate_pdf(pdf_bytes, degrees=90):
    reader = PdfReader(io.BytesIO(pdf_bytes))
    writer = PdfWriter()
    for page in reader.pages:
        page.rotate(degrees)
        writer.add_page(page)
        
    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return base64.b64encode(output.read()).decode('utf-8'), 'pdf'

def protect_pdf(pdf_bytes, password):
    reader = PdfReader(io.BytesIO(pdf_bytes))
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    writer.encrypt(password)
    
    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return base64.b64encode(output.read()).decode('utf-8'), 'pdf'

def unlock_pdf(pdf_bytes, password):
    reader = PdfReader(io.BytesIO(pdf_bytes))
    if reader.is_encrypted:
        reader.decrypt(password)
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
        
    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return base64.b64encode(output.read()).decode('utf-8'), 'pdf'

def pdf_to_jpg(pdf_bytes):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for i in range(len(doc)):
            page = doc.load_page(i)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img_bytes = pix.tobytes("jpeg")
            zip_file.writestr(f"page_{i+1}.jpg", img_bytes)
            
    zip_buffer.seek(0)
    doc.close()
    return base64.b64encode(zip_buffer.read()).decode('utf-8'), 'zip'

def compress_pdf(pdf_bytes):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    output = io.BytesIO()
    doc.save(output, deflate=True, garbage=4)
    doc.close()
    output.seek(0)
    return base64.b64encode(output.read()).decode('utf-8'), 'pdf'

def organize_pdf(pdf_bytes, pages_order):
    reader = PdfReader(io.BytesIO(pdf_bytes))
    writer = PdfWriter()
    for idx in pages_order:
        try:
            writer.add_page(reader.pages[int(idx)])
        except:
            pass
    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return base64.b64encode(output.read()).decode('utf-8'), 'pdf'

def repair_pdf(pdf_bytes):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    output = io.BytesIO()
    doc.save(output)
    doc.close()
    output.seek(0)
    return base64.b64encode(output.read()).decode('utf-8'), 'pdf'

def jpg_to_pdf(image_bytes_list):
    doc = fitz.open()
    for img_bytes in image_bytes_list:
        imgdoc = fitz.open("jpeg", img_bytes)
        pdfbytes = imgdoc.convert_to_pdf()
        imgdoc.close()
        pdf_temp = fitz.open("pdf", pdfbytes)
        doc.insert_pdf(pdf_temp)
        pdf_temp.close()
    output = io.BytesIO()
    doc.save(output)
    doc.close()
    output.seek(0)
    return base64.b64encode(output.read()).decode('utf-8'), 'pdf'

def pdf_to_excel(pdf_bytes):
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        all_tables = []
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                df = pd.DataFrame(table[1:], columns=table[0])
                all_tables.append(df)
    
    if not all_tables:
        raise Exception("No tables found in PDF")
        
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        for i, df in enumerate(all_tables):
            df.to_excel(writer, sheet_name=f"Table_{i+1}", index=False)
            
    output.seek(0)
    return base64.b64encode(output.read()).decode('utf-8'), 'xlsx'

def word_to_pdf(word_bytes):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as temp_docx:
        temp_docx.write(word_bytes)
        temp_docx_path = temp_docx.name
        
    from docx2pdf import convert
    temp_pdf_path = temp_docx_path.replace('.docx', '.pdf')
    convert(temp_docx_path, temp_pdf_path)
    
    with open(temp_pdf_path, 'rb') as f:
        pdf_bytes = f.read()
        
    os.remove(temp_docx_path)
    if os.path.exists(temp_pdf_path):
        os.remove(temp_pdf_path)
    return base64.b64encode(pdf_bytes).decode('utf-8'), 'pdf'

def html_to_pdf(html_text):
    output = io.BytesIO()
    pisa_status = pisa.CreatePDF(io.StringIO(html_text), dest=output)
    if pisa_status.err:
        raise Exception("Failed to convert HTML to PDF")
    output.seek(0)
    return base64.b64encode(output.read()).decode('utf-8'), 'pdf'

def crop_pdf(pdf_bytes, margin=0):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    for page in doc:
        rect = page.rect
        rect.x0 += margin
        rect.y0 += margin
        rect.x1 -= margin
        rect.y1 -= margin
        page.set_cropbox(rect)
        
    output = io.BytesIO()
    doc.save(output)
    doc.close()
    output.seek(0)
    return base64.b64encode(output.read()).decode('utf-8'), 'pdf'

def watermark_pdf(pdf_bytes, text="WATERMARK"):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    for page in doc:
        rect = page.rect
        page.insert_text(fitz.Point(rect.width/4, rect.height/2), text, fontsize=50, color=(1,0,0), fill_opacity=0.3)
    output = io.BytesIO()
    doc.save(output)
    doc.close()
    output.seek(0)
    return base64.b64encode(output.read()).decode('utf-8'), 'pdf'

def redact_pdf(pdf_bytes, redact_text):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    for page in doc:
        areas = page.search_for(redact_text)
        for rect in areas:
            page.add_redact_annot(rect, fill=(0, 0, 0))
        page.apply_redactions()
    output = io.BytesIO()
    doc.save(output)
    doc.close()
    output.seek(0)
    return base64.b64encode(output.read()).decode('utf-8'), 'pdf'

def page_numbers_pdf(pdf_bytes):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    for i, page in enumerate(doc):
        rect = page.rect
        # Bottom center
        page.insert_text(fitz.Point(rect.width/2 - 20, rect.height - 20), f"Page {i+1}", fontsize=12)
    output = io.BytesIO()
    doc.save(output)
    doc.close()
    output.seek(0)
    return base64.b64encode(output.read()).decode('utf-8'), 'pdf'
