# AudioWave: Real-Time Speech-to-Text Web Application

## Overview
AudioWave is a web-based application that allows users to record their voice through a browser, visualize the audio waveform in real time, and transcribe the recorded speech to text using NVIDIA NeMo's Automatic Speech Recognition (ASR) models. The application is built with a FastAPI backend, a modern JavaScript frontend, and leverages PyTorch and NeMo for high-accuracy speech recognition.

---

## Table of Contents
- [Features](#features)
- [How It Works](#how-it-works)
- [Implementation Details](#implementation-details)
  - [Frontend: main.js](#frontend-mainjs)
  - [Backend: main.py](#backend-mainpy)
  - [ASR Utility: asr.py](#asr-utility-asrpy)
- [Setup & Installation](#setup--installation)
- [License](#license)

---

## Features
- Press-and-hold mic button to record audio in the browser
- Real-time waveform visualization
- Audio sent to FastAPI backend for transcription
- NVIDIA NeMo ASR model for accurate speech-to-text
- Responsive, modern UI

---

## How It Works
1. User presses and holds the mic button to start recording.
2. The waveform is visualized in real time on a canvas.
3. When the button is released, recording stops and the audio is sent to the backend.
4. The backend saves the audio, runs it through the NeMo ASR model, and returns the transcribed text.
5. The detected text is displayed in a styled, readonly text box.

---

## Implementation Details

### Frontend: `main.js`
This file handles all browser-side logic, including audio recording, waveform visualization, and UI updates.

#### Functions & Logic

- **drawInitialLine()**
  - Draws a white horizontal line in the center of the waveform canvas. Used to reset the canvas when not recording.

- **drawWaveform()**
  - Continuously draws the real-time audio waveform using the AnalyserNode from the Web Audio API.
  - Uses `requestAnimationFrame` for smooth animation.
  - Styles (color, line width) are set in JS for canvas drawing.

- **startMicrophone()**
  - Requests microphone access and sets up the audio context and analyser.
  - Starts the MediaRecorder to capture audio chunks.
  - Begins waveform visualization.

- **stopMicrophone()**
  - Stops all audio tracks and closes the audio context.
  - Stops the MediaRecorder and cancels waveform animation.
  - Calls `drawInitialLine()` to reset the canvas.

- **sendAudioToServer()**
  - Called when recording stops.
  - Sends the recorded audio as a WAV blob to the `/asr` endpoint using `fetch` and FormData.
  - Updates the transcript text box with the server's response.

- **Mic Button Event Listeners**
  - `mousedown`/`touchstart`: Starts recording and updates button style.
  - `mouseup`/`touchend`: Stops recording, resets button style, and redraws the initial line.

---

### Backend: `main.py`
This file is the FastAPI backend that serves the frontend, handles audio uploads, and runs ASR.

#### Functions & Logic

- **lifespan(app)**
  - Async context manager that loads the ASR model at startup and attaches it to the app state.

- **read_index()**
  - Serves the main HTML page from the `templates` directory.

- **/asr endpoint (transcribe_audio)**
  - Accepts uploaded audio files via POST.
  - Saves the file to a temporary location.
  - Passes the file path to the ASR model for transcription.
  - Deletes the temp file and returns the detected text as JSON.

- **__main__ block**
  - Runs the FastAPI app with Uvicorn for local development.

---

### ASR Utility: `asr.py`
This file contains the logic for loading and running the NVIDIA NeMo ASR model.

#### Functions & Logic

- **load_asr_model()**
  - Loads a pre-trained NeMo ASR model asynchronously.
  - Returns a model object with a `.transcribe()` method.

- **ASRModel.transcribe(paths)**
  - Accepts a list of audio file paths.
  - Runs inference and returns the transcribed text for each file.

---

## Setup & Installation

1. **Clone the repository**
2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Install Node.js (for frontend development, if needed)**
4. **Run the FastAPI server:**
   ```bash
   python main.py
   ```
5. **Open your browser and go to:**
   ```
   http://localhost:8000
   ```

---

## License
This project is for educational and research purposes. See LICENSE for details.
