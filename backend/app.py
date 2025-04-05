import json
import os
import torch
import librosa
import tempfile
from flask import Flask, request, jsonify
from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2FeatureExtractor, pipeline
from urgency_analysis import get_urgency_analysis
from flask_cors import CORS
from pinata_store import upload_to_pinata
import db
from datetime import datetime

app = Flask(__name__)
CORS(app)
EMOTION_LABELS = [
    "Neutral", "Happy", "Sad", "Angry", "Fearful", "Disgusted", "Surprised"
]

MODEL_NAME = "superb/wav2vec2-base-superb-er"
LOCAL_MODEL_DIR = "."
LOCAL_FEATURE_EXTRACTOR_DIR = "."

pipe = pipeline("automatic-speech-recognition", model="openai/whisper-base")

def load_model():
    """Load the model and feature extractor from local or Hugging Face"""
    try:
        model_files_exist = any(f.startswith("pytorch_model") for f in os.listdir(LOCAL_MODEL_DIR))
        config_file_exists = os.path.exists(os.path.join(LOCAL_MODEL_DIR, "config.json"))
        feature_extractor_exists = os.path.exists(os.path.join(LOCAL_FEATURE_EXTRACTOR_DIR, "preprocessor_config.json"))
        
        if model_files_exist and config_file_exists and feature_extractor_exists:
            print("Loading model and feature extractor from local files...")
            feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(LOCAL_FEATURE_EXTRACTOR_DIR)
            model = Wav2Vec2ForSequenceClassification.from_pretrained(LOCAL_MODEL_DIR)
        else:
            print("Local files not found. Loading model from Hugging Face...")
            feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(MODEL_NAME)
            model = Wav2Vec2ForSequenceClassification.from_pretrained(MODEL_NAME)
        
        return model, feature_extractor
    except Exception as e:
        print(f"Error loading model: {e}")
        from transformers import AutoFeatureExtractor, AutoModelForAudioClassification
        feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_NAME)
        model = AutoModelForAudioClassification.from_pretrained(MODEL_NAME)
        return model, feature_extractor

model, feature_extractor = load_model()
model.eval()

def predict_emotion(temp_path):
    try:

        speech_array, sampling_rate = librosa.load(temp_path, sr=16000)
        inputs = feature_extractor(speech_array, sampling_rate=sampling_rate, return_tensors="pt")

        with torch.no_grad():
            logits = model(**inputs).logits
        predicted_class_id = torch.argmax(logits, dim=-1).item()
        predicted_emotion = EMOTION_LABELS[predicted_class_id]

        return predicted_emotion
    
    except Exception as e:
        print(f"Prediction error: {e}")
        return "error"


@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    metadata = json.loads(request.form.get('metadata', '{}'))
    phone_number = metadata.get('phoneNumber', '')
    ip_address = metadata.get('ipAddress', '')
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    allowed_extensions = {'wav'}
    if '.' not in file.filename or file.filename.split('.')[-1].lower() not in allowed_extensions:
        return jsonify({"error": "Invalid file format. Supported formats: WAV, MP3, M4A"}), 400

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        result = pipe(tmp_path)
        transcription = result['text']
        print("Transcription done:", transcription)

        emotion_response = predict_emotion(tmp_path)
        print("Emotion detected:", emotion_response)

        os.unlink(tmp_path)
        urgency_analysis = get_urgency_analysis(transcription, emotion_response)
        urgency_analysis["emotion"] = emotion_response
        urgency_analysis["transcription"] = transcription
        urgency_analysis["phone_number"] = '6230646657'
        urgency_analysis["ip_address"] = ip_address
        urgency_analysis["timestamp"] = datetime.now().isoformat()
    #     urgency_analysis.update({
    #         "voicemailReceived": False,
    #         "AIProcessingCompleted": False,
    #         "PoliceAssigned": False,
    #         "PoliceDispatched": False,
    #         "PoliceArrived": False,
    #         "ActionTaken": False,
    #         "Resolved": False
    #     })
    #     print(ip_address)
    # #     const complaintData = {
    # #     trackingId,
    # #     description,
    # #     locationAddress,
    # #     evidenceFiles: evidenceCids,
    # #     evidenceDescription,
    # #     contactName: contactName  'NIL',
    # #     contactEmail: contactEmail  'NIL',
    # #     createdAt: new Date().toISOString(),
    # #     voicemailReceived: false,
    # #     AIProcessingCompleted: false,
    # #     PoliceAssigned: false,
    # #     PoliceDispatched: false,
    # #     PoliceArrived: false,
    # #     ActionTaken: false,
    # #     Resolved: false
    # #   };
        ipfs_hash = upload_to_pinata(str(urgency_analysis))
        db.store_in_db({'ph':urgency_analysis["phone_number"],'ipfsHash': ipfs_hash})
        return jsonify({
            "status": "success"
        })

    except Exception as e:
        print(e)
        return jsonify({
            "status": "error",
            "message": f"Error processing file: {str(e)}"
        }), 500


@app.route('/getbuffer', methods=['GET'])
def get_buffer():
    return jsonify({'data':db.fetch_all()})

@app.route('/getlatestcomplaint', methods=['POST'])
def get_latest_complaint():
    phone_number = str(request.get_json().get('phone_number'))[2:]
    print(phone_number)
    if not phone_number:
        return jsonify({"error": "Phone number is required"}), 400
    return jsonify({'data': db.fetch_from_phone(phone_number)})

@app.route('/getcomplaint', methods=['POST'])
def getcomplaint():
    print(request)
    json_data = request.get_json()
    print(json_data)
    if not json_data:
        return jsonify({"error": "Tracking ID is required"}), 400
    return jsonify({'data': db.fetch_from_id(json_data)})

@app.route('/insert', methods=['POST'])
def insert():
    data = request.get_json()
    print(data)
    db.store_in_db(data)
    return jsonify({'status': "success"})

@app.route('/getComplaints', methods=['GET'])
def get():
    return jsonify({'data': db.fetch_all()})



@app.route('/getcomplaints', methods=['POST'])
def get_all_complaints():
    return jsonify({'data': db.fetch_all_comp()})


if __name__ == "__main__":
    app.run(debug=True)
