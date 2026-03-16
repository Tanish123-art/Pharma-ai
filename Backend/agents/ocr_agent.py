import easyocr
import cv2
import numpy as np
import os
from tempfile import NamedTemporaryFile

class OCRAgent:
    def __init__(self):
        # Initialize reader (English as default)
        self.reader = easyocr.Reader(['en'], gpu=False) # GPU False for stability in many environments
    
    def process_image(self, file_bytes):
        """
        Processes an image with OpenCV and extracts text using EasyOCR.
        """
        # Convert bytes to numpy array
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"error": "Invalid image format"}
            
        # Optional: Image preprocessing with OpenCV
        # Gray scale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Denoising
        denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        
        # Thresholding (Optional - EasyOCR often works better on original)
        # _, threshold = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # For now, let's use the original color image as EasyOCR handles color well
        results = self.reader.readtext(file_bytes)
        
        extracted_text = []
        bboxes = []
        
        for (bbox, text, prob) in results:
            # Convert bbox (list of lists) to list of dictionaries for JSON
            pts = [{"x": float(pt[0]), "y": float(pt[1])} for pt in bbox]
            bboxes.append({
                "text": text,
                "points": pts,
                "confidence": float(prob)
            })
            extracted_text.append(text)
            
        return {
            "text": " ".join(extracted_text),
            "details": bboxes
        }

# Global instance
ocr_agent = OCRAgent()
