import cv2
import numpy as np

def authenticate_note(image_path):
    """
    Dummy OpenCV logic — Replace with your actual note detection code.
    """

    # Load the uploaded image
    img = cv2.imread(image_path)

    if img is None:
        return "Image could not be read"

    # --- Dummy Step ---
    # Let's assume: if image height > 500 pixels we call it valid (for testing)
    if img.shape[0] > 500:
        return "Note is VALID"
    else:
        return "Note is INVALID"
