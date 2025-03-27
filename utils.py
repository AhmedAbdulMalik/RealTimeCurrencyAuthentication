import cv2
import numpy as np
import os

def authenticate_note(uploaded_img_path):
    uploaded_img = cv2.imread(uploaded_img_path, 0)
    if uploaded_img is None:
        print("Error loading uploaded image.")
        return False, None

    orb = cv2.ORB_create()
    best_good_matches = 0
    best_note_name = None

    for ref_filename in os.listdir('reference_notes'):
        if ref_filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            ref_path = os.path.join('reference_notes', ref_filename)
            reference_img = cv2.imread(ref_path, 0)

            if reference_img is None:
                continue

            kp1, des1 = orb.detectAndCompute(reference_img, None)
            kp2, des2 = orb.detectAndCompute(uploaded_img, None)

            if des1 is None or des2 is None:
                continue

            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
            matches = bf.match(des1, des2)
            matches = sorted(matches, key=lambda x: x.distance)
            good_matches = [m for m in matches if m.distance < 50]

            print(f"{ref_filename}: {len(good_matches)} good matches")

            if len(good_matches) > best_good_matches:
                best_good_matches = len(good_matches)
                best_note_name = ref_filename

    print(f"Best match: {best_note_name} with {best_good_matches} good matches")

    if best_good_matches >= 20:
        denomination = os.path.splitext(best_note_name)[0]
        return True, denomination
    else:
        return False, None
