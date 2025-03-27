import cv2
import numpy as np
import os

def authenticate_note(uploaded_image_path):
    # Load the uploaded image
    img_input = cv2.imread(uploaded_image_path, 0)  # Grayscale
    if img_input is None:
        return "Error: Uploaded image could not be read"

    # Feature Detector
    orb = cv2.ORB_create()

    kp1, des1 = orb.detectAndCompute(img_input, None)

    # Check against reference notes
    reference_folder = "reference_notes"
    match_results = []

    for ref_file in os.listdir(reference_folder):
        ref_path = os.path.join(reference_folder, ref_file)
        ref_img = cv2.imread(ref_path, 0)
        if ref_img is None:
            continue

        kp2, des2 = orb.detectAndCompute(ref_img, None)

        # Brute Force Matcher
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des1, des2)

        # Sort by distance
        matches = sorted(matches, key=lambda x: x.distance)

        # Calculate match quality
        match_percentage = len(matches) / max(len(kp1), 1) * 100
        match_results.append((ref_file, match_percentage))

    if not match_results:
        return "Error: No reference notes found."

    # Best match
    best_match = max(match_results, key=lambda x: x[1])

    if best_match[1] > 15:  # Example threshold, adjust later
        return f"Valid Currency Detected: {best_match[0]} ({best_match[1]:.2f}% match)"
    else:
        return f"Currency is likely INVALID (Best match {best_match[1]:.2f}%)"
