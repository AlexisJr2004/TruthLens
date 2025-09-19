"""
Funciones para extracción de texto de archivos
"""
from io import BytesIO

# Dependencias opcionales para extracción de texto
try:
    import PyPDF2  # type: ignore
except Exception:
    PyPDF2 = None

try:
    from docx import Document  # type: ignore
except Exception:
    Document = None

def extract_text_from_file(filename, content):
    """Extrae texto de diferentes tipos de archivos"""
    filename_lower = filename.lower()
    
    if filename_lower.endswith('.pdf'):
        if not PyPDF2:
            return None, "PyPDF2 no instalado en el servidor"
        return extract_text_from_pdf(content), None
        
    elif filename_lower.endswith('.docx'):
        if not Document:
            return None, "python-docx no instalado en el servidor"
        return extract_text_from_docx(content), None
        
    elif filename_lower.endswith('.txt'):
        return extract_text_from_txt(content), None
        
    else:
        return None, "Formato no soportado. Use PDF, DOCX o TXT"

def extract_text_from_pdf(content):
    """Extrae texto de archivos PDF"""
    reader = PyPDF2.PdfReader(BytesIO(content))
    pages_text = []
    for page in reader.pages:
        try:
            pages_text.append(page.extract_text() or "")
        except Exception:
            pages_text.append("")
    return "\n".join(pages_text)

def extract_text_from_docx(content):
    """Extrae texto de archivos DOCX"""
    doc = Document(BytesIO(content))
    return "\n".join([p.text for p in doc.paragraphs])

def extract_text_from_txt(content):
    """Extrae texto de archivos TXT con diferentes codificaciones"""
    for enc in ("utf-8", "latin-1", "cp1252"):
        try:
            return content.decode(enc)
        except Exception:
            continue
    return ""
