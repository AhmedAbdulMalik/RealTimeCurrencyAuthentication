# 🏦 Realtime Currency Authentication

**A web-based system that verifies the authenticity of Indian currency notes using image processing and machine learning.**  
🚀 *Designed for accuracy, efficiency, and real-time validation.*

---

## 🔍 Overview
Counterfeit currency is a major challenge in financial security. This project provides an automated solution to **authenticate Indian banknotes** by analyzing key security features. Using **OpenCV, OCR, and AI-based detection**, it determines whether a currency note is genuine or fake.

---

## 🌟 Features
✅ **Upload & Authenticate** – Users can upload an image of a currency note for verification.  
✅ **Image Processing** – Extracts key features such as watermark, security thread, and serial number.  
✅ **OCR (Optical Character Recognition)** – Detects and verifies note serial numbers (if RBI API available).  
✅ **Machine Learning (Optional)** – Enhances accuracy with AI-based classification.  
✅ **Web-Based UI** – Simple and intuitive interface for users.  

---

## 🛠️ Technologies Used
| Component  | Technology |
|------------|------------|
| **Frontend**  | HTML, CSS, JavaScript, Three.js |
| **Backend**   | Python (Flask) |
| **Libraries** | OpenCV, Tesseract OCR, TensorFlow (optional) |
| **Database**  | SQLite/PostgreSQL (if needed) |

---

## 📂 Project Structure
Realtime-Currency-Authentication/
│
├── frontend/            # Frontend files (handled by classmates)
│   ├── index.html       # Upload page
│   ├── styles.css       # UI Styling
│   └── script.js        # Logic to send the image to backend via API
│
├── backend/             # Backend files (you handle)
│   ├── app.py           # Main Flask app to handle API requests
│   ├── detector.py      # OpenCV logic (preprocessing, feature extraction, comparison)
│   ├── templates/       # Flask templates (optional)
│   ├── static/          # Flask static folder (if needed)
│
├── reference_images/    # Contains official images of correct note features
│   ├── watermark.png
│   ├── security_thread.png
│   ├── emblem.png
│   └── serial_number_area.png
│
├── requirements.txt     # Python dependencies
├── LICENSE              # GNU GPL v3 License file
└── README.md            # Documentation


---

## 🚀 Setup & Usage

### 1️⃣ Clone the Repository  
```sh
git clone https://github.com/your-username/realtime-currency-authentication.git
cd realtime-currency-authentication
```
2️⃣ Install Dependencies
```
pip install -r requirements.txt
```
3️⃣ Run the Backend
```
python app.py
```
The backend will start at http://localhost:5000.
4️⃣ Open the Web UI
Simply open index.html in your browser to test the authentication system.

🎯 Contributions
Frontend & UI – AhmedAbdulMalik

Backend & Processing – AhmedAbdulMalik

Testing - Loqmaan-09 and Ninjazz099

Documentation - AhmedAbdulMalik

🔧 Want to contribute? Feel free to fork, improve, and submit a pull request!

📌 Future Enhancements
✅ Mobile App Support – Integrate with mobile cameras for instant verification.
✅ Blockchain-based Serial Number Verification – Secure database for RBI-backed authentication.
✅ More Advanced AI Models – Improve detection using deep learning.

📜 License
This project is licensed under the GNU General Public License v3.0.
For details, see the LICENSE file.

🚀 Join us in making currency authentication smarter and more secure!
💬 For questions or suggestions, feel free to open an issue!

