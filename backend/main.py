import os
import json
import time
import uuid
import threading
from datetime import datetime
from flask_cors import CORS
from flask import Flask, jsonify, request, render_template, send_from_directory
from tools.image import image_tools
import base64

app = Flask(__name__, template_folder='../frontend/build', static_folder='../frontend/build/static')
CORS(app)

TEMP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_outputs")
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

# Background Task for Cleanup
def cleanup_task():
    while True:
        now = time.time()
        for f in os.listdir(TEMP_DIR):
            f_path = os.path.join(TEMP_DIR, f)
            # Delete files older than 1 hour (3600 seconds)
            if os.path.isfile(f_path) and os.stat(f_path).st_mtime < (now - 3600):
                try:
                    os.remove(f_path)
                    print(f"Cleaned up temp file: {f}")
                except Exception as e:
                    print(f"Cleanup error for {f}: {e}")
        time.sleep(600) # Check every 10 minutes

threading.Thread(target=cleanup_task, daemon=True).start()

@app.after_request
def log_request_response(response):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    method = request.method
    path = request.path
    url = request.url
    
    try:
        if request.is_json:
            payload = json.dumps(request.get_json(silent=True))
        else:
            payload = request.get_data(as_text=True)
    except Exception:
        payload = "Error reading payload"
        
    log_entry = (
        f"==================================================\n"
        f"Timestamp       : {timestamp}\n"
        f"Request         : {method} {path}\n"
        f"Payload         : {payload if payload else 'None'}\n"
        f"Response Status : {response.status_code}\n"
        f"==================================================\n\n"
    )
    
    log_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "api_logs.txt")
    try:
        with open(log_file_path, "a", encoding="utf-8") as f:
            f.write(log_entry)
    except Exception: pass
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/image-tools/download/<filename>')
def download_file(filename):
    return send_from_directory(TEMP_DIR, filename, as_attachment=True)

@app.route('/api/image-tools/<toolname>', methods=['POST'])
def handle_image_tool(toolname):
    requires_image = toolname != 'qr'
    image_bytes = None
    if 'image' in request.files and request.files['image']:
        image_bytes = request.files['image'].read()
    
    if requires_image and not image_bytes:
        return jsonify({"error": "No image uploaded"}), 400
    
    try:
        result_b64 = None
        result_text = None
        target_ext = "png"

        if toolname == 'convert':
            target_format = request.form.get('target', 'PNG')
            target_ext = target_format.lower()
            result_b64 = image_tools.convert_format(image_bytes, target_format)
        elif toolname == 'resize':
            width = request.form.get('width', '')
            height = request.form.get('height', '')
            percentage = request.form.get('percentage', '')
            result_b64 = image_tools.resize_image(image_bytes, 
                width=int(width) if width else None, 
                height=int(height) if height else None, 
                percentage=float(percentage) if percentage else None)
        elif toolname == 'remove-bg':
            result_b64 = image_tools.remove_background(image_bytes)
        elif toolname == 'ocr':
            result_text = image_tools.perform_ocr(image_bytes)
            return jsonify({"text": result_text})
        elif toolname == 'upscale':
            result_b64 = image_tools.upscale_image(image_bytes)
        elif toolname == 'rotate':
            degrees = request.form.get('degrees', 90)
            result_b64 = image_tools.rotate_image(image_bytes, degrees)
        elif toolname == 'flip':
            direction = request.form.get('direction', 'horizontal')
            result_b64 = image_tools.flip_image(image_bytes, direction)
        elif toolname == 'qr':
             text = request.form.get('text', 'https://opentools.io')
             fill_color = request.form.get('fill_color', 'black')
             back_color = request.form.get('back_color', 'white')
             logo_bytes = None
             if 'logo' in request.files and request.files['logo']:
                 logo_bytes = request.files['logo'].read()
             result_b64 = image_tools.generate_qr(text, fill_color, back_color, logo_bytes)
        elif toolname == 'base64':
             return jsonify({"text": f"data:image/png;base64,{base64.b64encode(image_bytes).decode('utf-8')}"})
        elif toolname == 'strip-metadata':
            result_b64 = image_tools.strip_metadata(image_bytes)
        elif toolname in ['grayscale', 'sepia', 'invert', 'blur']:
            result_b64 = image_tools.apply_filter(image_bytes, toolname)
        else:
            return jsonify({"error": "Unknown tool"}), 404

        # Save to temp file for formal download
        unique_name = f"{uuid.uuid4()}.{target_ext}"
        save_path = os.path.join(TEMP_DIR, unique_name)
        with open(save_path, "wb") as f:
            f.write(base64.b64decode(result_b64))

        return jsonify({
            "image": f"data:image/{target_ext if target_ext != 'pdf' else 'png'};base64,{result_b64}",
            "download_url": f"http://localhost:8001/api/image-tools/download/{unique_name}"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

from tools.pdf import pdf_tools

@app.route('/api/pdf-tools/<toolname>', methods=['POST'])
def handle_pdf_tool(toolname):
    try:
        result_b64 = None
        target_ext = "pdf"
        
        supported_single_file_tools = ['split', 'pdf_to_word', 'rotate', 'protect', 'unlock', 'pdf_to_jpg', 
                                       'compress', 'repair', 'pdf_to_excel', 'crop', 'watermark', 'redact', 'page_numbers']
        
        if toolname == 'merge':
            files = request.files.getlist('files')
            if not files or len(files) < 2:
                return jsonify({"error": "Please upload at least two PDF files to merge."}), 400
            pdf_bytes_list = [f.read() for f in files]
            result_b64, target_ext = pdf_tools.merge_pdfs(pdf_bytes_list)
            
        elif toolname == 'jpg_to_pdf':
            files = request.files.getlist('files')
            if not files:
                return jsonify({"error": "Please upload JPG files."}), 400
            image_bytes_list = [f.read() for f in files]
            result_b64, target_ext = pdf_tools.jpg_to_pdf(image_bytes_list)

        elif toolname == 'organize':
            files = request.files.getlist('files')
            if not files:
                return jsonify({"error": "Please upload a PDF file."}), 400
            pdf_bytes = files[0].read()
            pages_order = request.form.get('pages_order', '0').split(',')
            result_b64, target_ext = pdf_tools.organize_pdf(pdf_bytes, pages_order)

        elif toolname == 'word_to_pdf':
            files = request.files.getlist('files')
            if not files:
                return jsonify({"error": "Please upload a Word file."}), 400
            word_bytes = files[0].read()
            result_b64, target_ext = pdf_tools.word_to_pdf(word_bytes)

        elif toolname == 'html_to_pdf':
            html_text = request.form.get('html_text', '')
            if not html_text:
                return jsonify({"error": "Please provide HTML text."}), 400
            result_b64, target_ext = pdf_tools.html_to_pdf(html_text)

        elif toolname in supported_single_file_tools:
            files = request.files.getlist('files')
            if not files:
                return jsonify({"error": "Please upload a PDF file."}), 400
            pdf_bytes = files[0].read()
            
            if toolname == 'split':
                result_b64, target_ext = pdf_tools.split_pdf(pdf_bytes)
            elif toolname == 'pdf_to_word':
                result_b64, target_ext = pdf_tools.pdf_to_word(pdf_bytes)
            elif toolname == 'pdf_to_jpg':
                result_b64, target_ext = pdf_tools.pdf_to_jpg(pdf_bytes)
            elif toolname == 'rotate':
                degrees = int(request.form.get('degrees', 90))
                result_b64, target_ext = pdf_tools.rotate_pdf(pdf_bytes, degrees)
            elif toolname == 'protect':
                password = request.form.get('password', 'password')
                result_b64, target_ext = pdf_tools.protect_pdf(pdf_bytes, password)
            elif toolname == 'unlock':
                password = request.form.get('password', '')
                result_b64, target_ext = pdf_tools.unlock_pdf(pdf_bytes, password)
            elif toolname == 'compress':
                result_b64, target_ext = pdf_tools.compress_pdf(pdf_bytes)
            elif toolname == 'repair':
                result_b64, target_ext = pdf_tools.repair_pdf(pdf_bytes)
            elif toolname == 'pdf_to_excel':
                result_b64, target_ext = pdf_tools.pdf_to_excel(pdf_bytes)
            elif toolname == 'crop':
                margin = int(request.form.get('margin', 10))
                result_b64, target_ext = pdf_tools.crop_pdf(pdf_bytes, margin)
            elif toolname == 'watermark':
                text = request.form.get('watermark_text', 'OPEN-TOOLS')
                result_b64, target_ext = pdf_tools.watermark_pdf(pdf_bytes, text)
            elif toolname == 'redact':
                text = request.form.get('redact_text', '')
                result_b64, target_ext = pdf_tools.redact_pdf(pdf_bytes, text)
            elif toolname == 'page_numbers':
                result_b64, target_ext = pdf_tools.page_numbers_pdf(pdf_bytes)
        else:
            return jsonify({"error": "This tool is still under construction."}), 501

        unique_name = f"{uuid.uuid4()}.{target_ext}"
        save_path = os.path.join(TEMP_DIR, unique_name)
        with open(save_path, "wb") as f:
            f.write(base64.b64decode(result_b64))

        return jsonify({
            "pdf_b64": result_b64,
            "target_ext": target_ext,
            "download_url": f"http://localhost:8001/api/image-tools/download/{unique_name}"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=8001)
