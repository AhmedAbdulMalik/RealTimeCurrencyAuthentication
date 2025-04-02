# utils.py (Simple version corresponding to the initial request)
'''
import cv2
import numpy as np
import os

# --- Configuration ---
REFERENCE_NOTES_FOLDER = 'reference_notes'
# Thresholds (Need careful tuning!)
GOOD_MATCH_DISTANCE_THRESHOLD = 50
MIN_GOOD_MATCHES_REQUIRED = 20

def authenticate_note(uploaded_img_path):
    """
    Authenticates a note by comparing ORB features against reference images.
    Uses simple thresholding.

    Args:
        uploaded_img_path (str): Path to the uploaded image.

    Returns:
        tuple: (bool: True if potentially valid, False otherwise,
                str/None: Denomination name if valid, None otherwise)
    """
    print(f"--- authenticate_note called for: {uploaded_img_path} ---")

    # --- Input Validation ---
    if not os.path.exists(uploaded_img_path):
        print(f"Error: Uploaded image path does not exist: {uploaded_img_path}")
        return False, "File Path Error"
    if not os.path.isdir(REFERENCE_NOTES_FOLDER):
         print(f"Error: Reference notes folder not found: {REFERENCE_NOTES_FOLDER}")
         return False, "Reference Folder Missing"


    # --- Load Uploaded Image ---
    # Load in grayscale directly
    uploaded_img = cv2.imread(uploaded_img_path, cv2.IMREAD_GRAYSCALE)
    if uploaded_img is None:
        print(f"Error: Failed to load uploaded image at {uploaded_img_path} using OpenCV.")
        # Could be corrupted, unsupported format not caught earlier, or permissions issue
        return False, "Image Load Error"
    print(f"Uploaded image loaded successfully (shape: {uploaded_img.shape}).")

    # --- Initialize ORB ---
    try:
        # You can adjust nfeatures if needed
        orb = cv2.ORB_create(nfeatures=1000)
        print("ORB detector created.")
    except Exception as e:
         print(f"Error creating ORB detector: {e}")
         return False, "OpenCV Init Error"

    # --- Find Features in Uploaded Image ---
    try:
        kp_uploaded, des_uploaded = orb.detectAndCompute(uploaded_img, None)
        if des_uploaded is None or len(kp_uploaded) == 0:
            print("Warning: No ORB features detected in the uploaded image.")
            # This image might be blank, too blurry, or lack texture
            return False, "No Features in Upload"
        print(f"Found {len(kp_uploaded)} features in uploaded image.")
    except cv2.error as e:
        print(f"OpenCV error detecting features in uploaded image: {e}")
        return False, "Feature Detection Error"


    # --- Initialize Matcher ---
    # Use NORM_HAMMING for ORB descriptors
    try:
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        print("Brute-Force Matcher created (crossCheck=True).")
    except Exception as e:
        print(f"Error creating BFMatcher: {e}")
        return False, "OpenCV Matcher Error"

    # --- Compare against Reference Notes ---
    best_match_info = {
        "note_name": None,
        "good_matches_count": 0
    }
    print(f"Starting comparison against reference notes in '{REFERENCE_NOTES_FOLDER}'...")

    for ref_filename in os.listdir(REFERENCE_NOTES_FOLDER):
        # Ensure it's an image file
        if ref_filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            ref_path = os.path.join(REFERENCE_NOTES_FOLDER, ref_filename)
            print(f"-- Comparing with: {ref_filename}")

            # Load Reference Image (Grayscale)
            reference_img = cv2.imread(ref_path, cv2.IMREAD_GRAYSCALE)
            if reference_img is None:
                print(f"   Warning: Failed to load reference image {ref_filename}. Skipping.")
                continue

            # Find Features in Reference Image
            try:
                kp_ref, des_ref = orb.detectAndCompute(reference_img, None)
                if des_ref is None or len(kp_ref) == 0:
                    print(f"   Warning: No features detected in reference image {ref_filename}. Skipping.")
                    continue
            except cv2.error as e:
                 print(f"   OpenCV error detecting features in reference image {ref_filename}: {e}")
                 continue # Skip this reference image

            # Match Features
            try:
                 matches = bf.match(des_ref, des_uploaded)
            except cv2.error as e:
                 print(f"   Error matching features for {ref_filename}: {e}")
                 continue # Skip this reference if matching fails

            # Filter "Good" Matches based on distance
            # Lower distance is better for matches
            good_matches = [m for m in matches if m.distance < GOOD_MATCH_DISTANCE_THRESHOLD]
            num_good_matches = len(good_matches)
            print(f"   Found {num_good_matches} good matches (distance < {GOOD_MATCH_DISTANCE_THRESHOLD}).")

            # Update Best Match if current reference is better
            if num_good_matches > best_match_info["good_matches_count"]:
                best_match_info["good_matches_count"] = num_good_matches
                best_match_info["note_name"] = os.path.splitext(ref_filename)[0] # Get name like '100', '500'
                print(f"   New best match found: {best_match_info['note_name']} with {num_good_matches} matches.")

    # --- Final Decision ---
    print("\nComparison finished.")
    print(f"Best overall match: {best_match_info['note_name']} with {best_match_info['good_matches_count']} good matches.")

    if best_match_info["good_matches_count"] >= MIN_GOOD_MATCHES_REQUIRED:
        print(f"Match count ({best_match_info['good_matches_count']}) meets threshold ({MIN_GOOD_MATCHES_REQUIRED}). Result: Likely Genuine.")
        return True, best_match_info["note_name"] # Return True and the identified denomination
    else:
        print(f"Match count ({best_match_info['good_matches_count']}) is below threshold ({MIN_GOOD_MATCHES_REQUIRED}). Result: Potential Fake/Unverifiable.")
        return False, None # Return False, no confirmed denomination'
        '''