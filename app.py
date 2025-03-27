from flask import Flask, request, jsonify
import os
from utils import authenticate_note

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return "Realtime Currency Authentication API - Running"

@app.route('/authenticate', methods=['POST'])
def authenticate():
    if 'image' not in request.files:
        return jsonify({"result": "No image uploaded"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"result": "No selected file"}), 400

    upload_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(upload_path)

    is_valid, denomination = authenticate_note(upload_path)

    if is_valid:
        result = f"Authenticated - ₹{denomination}"
    else:
        result = "Fake Note"

    return jsonify({"result": result})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
