'''

# app.py (with diagnostic print statements)

print("--- Script starting: app.py ---")

# Standard Imports
print("Importing standard libraries...")
import os
import traceback # For detailed error logging
print("Imports os, traceback done.")

# Flask and Utils Imports (in a try block to catch errors early)
print("Attempting to import Flask and utils...")
try:
    from flask import Flask, request, jsonify, render_template
    print("-> Successfully imported Flask modules.")
    from utils import authenticate_note # Renamed function for clarity
    print("-> Successfully imported authenticate_note from utils.")
except ImportError as e:
    print(f"!!! IMPORT ERROR: {e}")
    print("!!! This often means a required library (Flask, opencv-python, numpy) is not installed,")
    print("!!! or the file 'utils.py' is missing or in the wrong directory.")
    traceback.print_exc()
    exit(1) # Stop the script if essential imports fail
except Exception as e:
    print(f"!!! UNEXPECTED ERROR DURING IMPORT: {e}")
    traceback.print_exc()
    exit(1) # Stop the script on other unexpected import errors
print("Imports completed successfully.")

# --- Global Setup ---
print("Setting up global variables and Flask app object...")
UPLOAD_FOLDER = 'uploads'
REFERENCE_FOLDER = 'reference_notes' # Define reference folder path
print(f"-> UPLOAD_FOLDER = '{UPLOAD_FOLDER}'")
print(f"-> REFERENCE_FOLDER = '{REFERENCE_FOLDER}'")

print("Creating Flask app instance...")
app = Flask(__name__)
print("-> Flask app object created.")

print(f"Ensuring upload directory exists: '{UPLOAD_FOLDER}'")
try:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    print(f"-> Directory '{UPLOAD_FOLDER}' exists or was created.")
except OSError as e:
    print(f"!!! ERROR: Could not create upload directory '{UPLOAD_FOLDER}': {e}")
    # Decide if this is critical enough to exit
    # exit(1)
print("Global setup finished.")

# --- Pre-flight Check (Optional but helpful) ---
print(f"Performing pre-flight check for reference folder: '{REFERENCE_FOLDER}'...")
if not os.path.isdir(REFERENCE_FOLDER):
    print(f"!!! WARNING: Reference notes folder '{REFERENCE_FOLDER}' not found during pre-flight check.")
    print("!!! The application might fail later if this folder is needed and not created.")
else:
    print(f"-> Reference folder '{REFERENCE_FOLDER}' found.")

# --- Route Definitions ---

print("Defining Flask routes...")

# Route for the HTML frontend
@app.route('/')
def index():
    print("--- Request received for route: / (index) ---")
    # Assumes index.html is in a 'templates' folder sibling to app.py
    # If index.html is in the same folder, Flask won't find it by default.
    # Let's serve it directly for simplicity IF templates folder doesn't exist
    if os.path.exists('index.html') and not os.path.exists('templates'):
         print("-> Found index.html in root, serving directly.")
         try:
             with open('index.html', 'r') as f:
                 return f.read()
         except Exception as e:
            print(f"!!! Error reading index.html from root: {e}")
            return "Error reading index.html", 500

    # Proper way using Flask's template rendering
    try:
        print("-> Attempting to render template 'index.html'.")
        return render_template('index.html')
    except Exception as e: # Catch broader exceptions during template rendering
         print(f"!!! Error rendering template 'index.html': {e}")
         # Provide a more helpful error message if the template is likely missing
         if "TemplateNotFound" in str(e):
              return ("Error: 'index.html' not found. Place it in the root directory "
                      "or preferably in a sub-directory named 'templates'." ), 404
         else:
            return f"Server error rendering template: {e}", 500

@app.route('/authenticate', methods=['POST'])
def authenticate():
    print("--- Request received for route: /authenticate (POST) ---")
    # Check if the post request has the file part
    if 'image' not in request.files:
        print("!!! Error: No 'image' file part found in the request.")
        return jsonify({"status": "error", "error": "No image file part in the request"}), 400

    file = request.files['image']
    print(f"-> Received file: '{file.filename}' (Content-Type: {file.content_type})")

    # If the user does not select a file, the browser submits an empty file without a filename.
    if file.filename == '':
        print("!!! Error: No file selected (filename is empty).")
        return jsonify({"status": "error", "error": "No image file selected"}), 400

    # Basic check for allowed extensions
    allowed_extensions = {'png', 'jpg', 'jpeg'}
    file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if file_ext not in allowed_extensions:
         print(f"!!! Error: Invalid file type '{file_ext}'. Allowed: {allowed_extensions}")
         return jsonify({"status": "error", "error": f"Invalid file type '{file_ext}'. Use PNG, JPG, or JPEG"}), 400

    upload_path = None # Initialize upload_path to handle potential errors before assignment
    try:
        # For simplicity, use original name but consider collision/security implications
        # Using secure_filename is better practice:
        # from werkzeug.utils import secure_filename
        # filename = secure_filename(file.filename)
        filename = file.filename # Using original name for now
        upload_path = os.path.join(UPLOAD_FOLDER, filename)

        print(f"-> Saving uploaded file to: {upload_path}")
        file.save(upload_path)
        print("-> File saved successfully.")

        # Call the core logic function from utils.py
        print("-> Calling authenticate_note function...")
        is_likely_genuine, denomination, match_count = authenticate_note(upload_path, REFERENCE_FOLDER)
        print(f"-> authenticate_note returned: Genuine={is_likely_genuine}, Denom={denomination}, Matches={match_count}")

        # Prepare JSON response
        if is_likely_genuine:
            result = {
                "status": "success",
                "result": "Likely Genuine",
                "denomination": f"₹{denomination}",
                "matches": match_count
            }
            print(f"-> Responding with: {result}")
            return jsonify(result)
        else:
            result = {
                "status": "failed",
                "result": "Potential Fake or Cannot Verify",
                "denomination": None if denomination is None else f"Closest Match Attempt: ₹{denomination}", # Be more specific
                "matches": match_count # Still useful to know the score
            }
            print(f"-> Responding with: {result}")
            return jsonify(result)

    except FileNotFoundError as e:
         # This might happen if REFERENCE_FOLDER is suddenly deleted, or within utils.py
         print(f"!!! FILE NOT FOUND ERROR during processing: {e}")
         traceback.print_exc()
         return jsonify({"status": "error", "error": f"Server file error: {e}"}), 500
    except cv2.error as e: # Catch OpenCV specific errors if they bubble up
        print(f"!!! OpenCV ERROR during processing: {e}")
        traceback.print_exc()
        return jsonify({"status": "error", "error": f"Image processing error (OpenCV): {e}"}), 500
    except Exception as e:
        # Catch any other unexpected errors during processing
        print(f"!!! UNEXPECTED ERROR during /authenticate processing: {e}")
        traceback.print_exc() # Print detailed traceback to server console
        return jsonify({"status": "error", "error": "An internal server error occurred during processing."}), 500
    finally:
        # Clean up the uploaded file *after* processing is complete or if an error occurred
        if upload_path and os.path.exists(upload_path):
            try:
                print(f"-> Cleaning up uploaded file: {upload_path}")
                os.remove(upload_path)
                print("-> Cleanup successful.")
            except Exception as e:
                print(f"!!! Error cleaning up file {upload_path}: {e}")

print("Route definitions completed.")

# --- Main Execution Block ---
print("Checking if script is run as main...")
if __name__ == "__main__":
    print("--- Running inside __main__ block ---")

    # CRITICAL Check: Make sure reference folder exists before attempting to start server
    print(f"-> Final check for reference folder: '{REFERENCE_FOLDER}'")
    if not os.path.isdir(REFERENCE_FOLDER):
        print(f"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print(f"!!! CRITICAL ERROR: Reference notes folder '{REFERENCE_FOLDER}' MUST exist.")
        print(f"!!! Please create this folder in the same directory as app.py and")
        print(f"!!! add your reference currency images (e.g., 100.jpg, 500.png).")
        print(f"!!! Exiting now.")
        print(f"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        exit(1) # Exit if the critical folder is missing
    else:
       print(f"-> Reference notes folder '{REFERENCE_FOLDER}' confirmed.")
       print("-> Attempting to start Flask development server...")
       print("   - Host: 0.0.0.0 (accessible on network)")
       print("   - Port: 5001")
       print("   - Debug Mode: ON")
       try:
           # Start the Flask development server
           app.run(debug=True, host="0.0.0.0", port=5001)
           # Code here will run ONLY after the server is stopped (e.g., with Ctrl+C)
           print("--- Flask server has been shut down. ---")
       except OSError as e:
            if "Address already in use" in str(e):
                print(f"!!! ERROR: Port 5001 is already in use.")
                print(f"!!! Another application might be running on this port,")
                print(f"!!! or a previous instance of this script didn't shut down correctly.")
                print(f"!!! Try stopping the other application or use a different port.")
            else:
                print(f"!!! ERROR starting Flask server (OS Error): {e}")
                traceback.print_exc()
       except Exception as e:
           print(f"!!! UNEXPECTED ERROR running app.run: {e}")
           traceback.print_exc()

    print("--- Exiting __main__ block ---")
else:
    # This part runs if the script is imported, not run directly
    print("--- Script app.py was imported, not run directly. Flask server not started automatically. ---")

print("--- Script execution finished (app.py) ---")


'''