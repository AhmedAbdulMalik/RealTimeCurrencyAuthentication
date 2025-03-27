from flask import Flask, request, jsonify
import os
from utils import authenticate_note

app = Flask(__name__)

# Limit upload size (optional)
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB

@app.route('/')
def index():
    return "Realtime Currency Authentication API"

@app.route('/authenticate', methods=['POST'])
def authenticate():
    if 'image' not in request.files:
        return jsonify({"result": "No image uploaded"}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({"result": "No selected file"}), 400

    # Save the uploaded file
    filepath = os.path.join("uploaded_image.jpg")
    file.save(filepath)

    # Authenticate
    result = authenticate_note(filepath)

    return jsonify({"result": result})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
