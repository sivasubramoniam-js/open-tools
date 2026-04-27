import io
import os
import base64
from PIL import Image, ImageOps, ImageFilter
import pillow_avif  # Registers AVIF handler automatically
from rembg import remove
from ocrmac.ocrmac import OCR
import qrcode

def get_image_response(image, format="PNG", quality=95):
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format=format, quality=quality)
    img_byte_arr = img_byte_arr.getvalue()
    return base64.b64encode(img_byte_arr).decode('utf-8')

def convert_format(image_bytes, target_format):
    image = Image.open(io.BytesIO(image_bytes))
    target_format = target_format.upper()
    
    # PDF and JPG need RGB (no alpha)
    if target_format in ["JPG", "JPEG", "PDF"]:
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
    
    return get_image_response(image, format=target_format)

def rotate_image(image_bytes, degrees=90):
    image = Image.open(io.BytesIO(image_bytes))
    image = image.rotate(int(degrees), expand=True)
    return get_image_response(image)

def upscale_image(image_bytes, scale=2):
    image = Image.open(io.BytesIO(image_bytes))
    w, h = image.size
    image = image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    return get_image_response(image)

def flip_image(image_bytes, direction='horizontal'):
    image = Image.open(io.BytesIO(image_bytes))
    if direction == 'horizontal':
        image = ImageOps.mirror(image)
    else:
        image = ImageOps.flip(image)
    return get_image_response(image)

def generate_qr(text, fill_color="black", back_color="white", logo_bytes=None):
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=5)
    qr.add_data(text)
    qr.make(fit=True)
    
    # Generate QR with colors
    img = qr.make_image(fill_color=fill_color, back_color=back_color).convert('RGBA')
    
    if logo_bytes:
        logo = Image.open(io.BytesIO(logo_bytes)).convert('RGBA')
        
        # Calculate dimensions for logo
        qr_width, qr_height = img.size
        logo_max_size = int(qr_width / 4)
        
        # Resize logo
        logo.thumbnail((logo_max_size, logo_max_size), Image.Resampling.LANCZOS)
        
        # Calculate position
        logo_w, logo_h = logo.size
        pos = ((qr_width - logo_w) // 2, (qr_height - logo_h) // 2)
        
        # Paste logo
        img.paste(logo, pos, mask=logo)
        
    return get_image_response(img)

def resize_image(image_bytes, width=None, height=None, percentage=None):
    image = Image.open(io.BytesIO(image_bytes))
    orig_w, orig_h = image.size
    
    if percentage:
        new_w = int(orig_w * (percentage / 100))
        new_h = int(orig_h * (percentage / 100))
    else:
        new_w = int(width) if width else orig_w
        new_h = int(height) if height else orig_h
        
    image = image.resize((new_w, new_h), Image.Resampling.LANCZOS)
    return get_image_response(image)

def remove_background(image_bytes):
    # rembg handle bytes directly
    output_data = remove(image_bytes)
    output_image = Image.open(io.BytesIO(output_data))
    return get_image_response(output_image)

def perform_ocr(image_bytes):
    # ocrmac uses the built-in macOS Vision framework
    # It takes a file path or PIL Image
    image = Image.open(io.BytesIO(image_bytes))
    
    # Save to a temporary file because ocrmac sometimes prefers it
    temp_path = "temp_ocr.png"
    image.save(temp_path)
    
    try:
        annotations = OCR(temp_path).recognize()
        # annotations is a list of tuples: (text, confidence, bounding_box)
        full_text = "\n".join([ann[0] for ann in annotations])
        return full_text
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

def strip_metadata(image_bytes):
    image = Image.open(io.BytesIO(image_bytes))
    data = list(image.getdata())
    image_without_metadata = Image.new(image.mode, image.size)
    image_without_metadata.putdata(data)
    return get_image_response(image_without_metadata)

def apply_filter(image_bytes, filter_type):
    image = Image.open(io.BytesIO(image_bytes))
    if filter_type == 'grayscale':
        image = ImageOps.grayscale(image)
    elif filter_type == 'sepia':
        # Sepia formula
        def sepia(r, g, b):
            tr = int(0.393 * r + 0.769 * g + 0.189 * b)
            tg = int(0.349 * r + 0.686 * g + 0.168 * b)
            tb = int(0.272 * r + 0.534 * g + 0.131 * b)
            return min(tr, 255), min(tg, 255), min(tb, 255)
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        pixels = image.load()
        for i in range(image.width):
            for j in range(image.height):
                r, g, b = pixels[i, j]
                pixels[i, j] = sepia(r, g, b)
    elif filter_type == 'invert':
        image = ImageOps.invert(image.convert('RGB'))
    elif filter_type == 'blur':
        image = image.filter(ImageFilter.GaussianBlur(radius=2))
        
    return get_image_response(image)
