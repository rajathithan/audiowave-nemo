# File: main.py
# Author: Rajathithan Rajasekar
# Date: 27-07-2025

import os
import uvicorn
import tempfile
from pydub import AudioSegment
from utils.asr import load_asr_model
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
  


@asynccontextmanager
async def lifespan(app):
    print("Starting model load...")
    app.state.asr_model = await load_asr_model()
    print("Model loaded!")
    yield

app = FastAPI(lifespan=lifespan)

# Serve static files (like JS, CSS, images) from the parent directory
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "static"))
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Serve index.html from the templates folder at the root URL
@app.get("/")
def read_index():
    templates_dir = os.path.join(os.path.dirname(__file__),  "templates")
    index_path = os.path.join(templates_dir, "index.html")
    return FileResponse(index_path)


@app.post("/asr")
async def transcribe_audio(file: UploadFile = File(...)):
    print("/asr endpoint called")  # Log endpoint call
    print(f"Received file: {file.filename}, content_type: {file.content_type}")
    # Save uploaded audio to a temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        file_bytes = await file.read()
        print(f"Received file size: {len(file_bytes)} bytes")  # Log file size
        tmp.write(file_bytes)
        tmp_path = tmp.name
        #print(f"Print the path is  {tmp_path}")

    # Preprocess with pydub to ensure standard PCM WAV
    pcm_wav_path = tmp_path + "_pcm.wav"
    try:
        audio = AudioSegment.from_file(tmp_path)
        audio = audio.set_frame_rate(16000).set_channels(1)
        audio.export(pcm_wav_path, format="wav")
        #print(f"Saved PCM WAV to {pcm_wav_path}")
    except Exception as e:
        print(f"Error converting to PCM WAV: {e}")
        pcm_wav_path = tmp_path  # fallback to original if conversion fails

    detectedText = app.state.asr_model.transcribe([pcm_wav_path])[0].text
    os.remove(tmp_path)  # Clean up temp file
    if os.path.exists(pcm_wav_path) and pcm_wav_path != tmp_path:
        os.remove(pcm_wav_path)
    print(f"Transcription result: {detectedText}")
    return JSONResponse({"text": detectedText})


if __name__ == "__main__":    
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


