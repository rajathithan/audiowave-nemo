// File: main.js
// Author: Rajathithan Rajasekar
// Date: 27-07-2025

// Color variables
const COLOR_BG = '#000'; // Background color
const COLOR_PRIMARY = '#00ff00'; // Primary accent color (green)
const COLOR_SECONDARY = '#111'; // Secondary color (dark gray)
const COLOR_WHITE = '#fff'; // White color for lines

let mediaRecorder; // MediaRecorder instance for recording audio
let audioChunks = []; // Array to store audio data chunks
let micStream; // MediaStream from the microphone
let audioContext; // AudioContext for audio processing
let analyser; // AnalyserNode for waveform visualization
let dataArray; // Uint8Array for audio data
let animationId; // ID for animation frame

const canvas = document.getElementById('waveform'); // Get the canvas element
const ctx = canvas.getContext('2d'); // Get the 2D drawing context

// Draw a white horizontal line in the middle of the canvas
function drawInitialLine() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas
  ctx.beginPath(); // Start a new path
  ctx.moveTo(0, canvas.height / 2); // Move to the left-middle of the canvas
  ctx.lineTo(canvas.width, canvas.height / 2); // Draw a line to the right-middle
  ctx.strokeStyle = COLOR_WHITE; // Set the line color to white
  ctx.lineWidth = 2; // Set the line width
  ctx.stroke(); // Draw the line
}

drawInitialLine(); // Draw the initial horizontal line when the page loads

// Continuously draw the audio waveform on the canvas
function drawWaveform() {
  if (!analyser) return; // Exit if analyser is not set
  animationId = requestAnimationFrame(drawWaveform); // Schedule next frame
  analyser.getByteTimeDomainData(dataArray); // Get waveform data

  ctx.fillStyle = COLOR_BG; // Set background color
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas

  ctx.lineWidth = 2; // Set waveform line width
  ctx.strokeStyle = COLOR_PRIMARY; // Set waveform color
  ctx.beginPath(); // Start a new path

  const sliceWidth = canvas.width / dataArray.length; // Calculate width per data point
  let x = 0; // X position
  for (let i = 0; i < dataArray.length; i++) { // Loop through data
    const v = dataArray[i] / 128.0; // Normalize value
    const y = (v * canvas.height) / 2; // Calculate Y position
    if (i === 0) ctx.moveTo(x, y); // Move to first point
    else ctx.lineTo(x, y); // Draw line to next point
    x += sliceWidth; // Increment X
  }
  ctx.lineTo(canvas.width, canvas.height / 2); // Finish at the right-middle
  ctx.stroke(); // Draw the waveform
}

// Start the microphone and set up audio processing
async function startMicrophone() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Request mic access
    audioContext = new (window.AudioContext || window.webkitAudioContext)(); // Create audio context
    analyser = audioContext.createAnalyser(); // Create analyser node
    analyser.fftSize = 2048; // Set FFT size

    const bufferLength = analyser.frequencyBinCount; // Get buffer length
    dataArray = new Uint8Array(bufferLength); // Create data array

    const source = audioContext.createMediaStreamSource(micStream); // Create source node
    source.connect(analyser); // Connect source to analyser

    // Start recording audio
    audioChunks = []; // Reset audio chunks
    mediaRecorder = new MediaRecorder(micStream); // Create MediaRecorder
    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) audioChunks.push(event.data); // Store audio data
    };
    mediaRecorder.onstop = sendAudioToServer; // Set stop handler
    mediaRecorder.start(); // Start recording

    drawWaveform(); // Start waveform animation
  } catch (err) {
    console.error('Error accessing microphone:', err); // Log errors
  }
}

// Stop the microphone and waveform
function stopMicrophone() {
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop()); // Stop all tracks
    micStream = null; // Clear mic stream
  }
  if (audioContext) {
    audioContext.close(); // Close audio context
    audioContext = null; // Clear audio context
  }
  if (animationId) {
    cancelAnimationFrame(animationId); // Cancel animation
    animationId = null; // Clear animation ID
  }
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop(); // Stop recording
  }
  drawInitialLine(); // Reset canvas
}

// Send recorded audio to backend for transcription
function sendAudioToServer() {
  const audioBlob = new Blob(audioChunks, { type: 'audio/wav' }); // Create WAV blob

  const formData = new FormData(); // Create form data
  formData.append('file', audioBlob, 'audio.wav'); // Append audio file

  fetch('/asr', {
    method: 'POST', // POST request
    body: formData // Send form data
  })
  .then(response => response.json()) // Parse JSON response
  .then(data => {
    document.getElementById('transcript-box').value = data.text || 'No speech detected'; // Show transcript
  })
  .catch(() => {
    document.getElementById('transcript-box').value = 'Transcription failed'; // Show error
  });
}

// Remove toggle logic and use press-and-hold for recording
const startBtn = document.getElementById('start'); // Get mic button

// Remove text from button and add mic SVG icon
startBtn.innerHTML = `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="18" cy="18" r="16" fill="${COLOR_SECONDARY}" stroke="${COLOR_PRIMARY}" stroke-width="3"/>
  <rect x="13" y="9" width="10" height="14" rx="5" fill="${COLOR_PRIMARY}"/>
  <rect x="16" y="23" width="4" height="4" rx="2" fill="${COLOR_PRIMARY}"/>
  <rect x="15" y="27" width="6" height="2" rx="1" fill="${COLOR_PRIMARY}"/>
</svg>`; // Set SVG icon
startBtn.classList.add('mic-btn'); // Add CSS class

startBtn.addEventListener('mousedown', async () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    await startMicrophone(); // Start recording
    startBtn.style.background = COLOR_PRIMARY; // Change button color
    startBtn.querySelector('svg rect[x="13"]').setAttribute('fill', COLOR_SECONDARY); // Change SVG color
  }
});

startBtn.addEventListener('mouseup', () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    stopMicrophone(); // Stop recording
    startBtn.style.background = COLOR_SECONDARY; // Reset button color
    startBtn.querySelector('svg rect[x="13"]').setAttribute('fill', COLOR_PRIMARY); // Reset SVG color
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    drawInitialLine(); // Draw initial line
  }
});

// For touch devices
startBtn.addEventListener('touchstart', async (e) => {
  e.preventDefault(); // Prevent scrolling
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    await startMicrophone(); // Start recording
    startBtn.style.background = COLOR_PRIMARY; // Change button color
    startBtn.querySelector('svg rect[x="13"]').setAttribute('fill', COLOR_SECONDARY); // Change SVG color
  }
});

startBtn.addEventListener('touchend', (e) => {
  e.preventDefault(); // Prevent scrolling
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    stopMicrophone(); // Stop recording
    startBtn.style.background = COLOR_SECONDARY; // Reset button color
    startBtn.querySelector('svg rect[x="13"]').setAttribute('fill', COLOR_PRIMARY); // Reset SVG color
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    drawInitialLine(); // Draw initial line
  }
});
