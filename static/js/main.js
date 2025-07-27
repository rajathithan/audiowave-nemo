let mediaRecorder;
let audioChunks = [];
let micStream;
let audioContext;
let analyser;
let dataArray;
let animationId;

const canvas = document.getElementById('waveform');
const ctx = canvas.getContext('2d');

// Draw a white horizontal line in the middle of the canvas
function drawInitialLine() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas
  ctx.beginPath(); // Start a new path
  ctx.moveTo(0, canvas.height / 2); // Move to the left-middle of the canvas
  ctx.lineTo(canvas.width, canvas.height / 2); // Draw a line to the right-middle
  ctx.strokeStyle = '#fff'; // Set the line color to white
  ctx.lineWidth = 2; // Set the line width
  ctx.stroke(); // Draw the line
}

drawInitialLine(); // Draw the initial horizontal line when the page loads

// Continuously draw the audio waveform on the canvas
function drawWaveform() {
  if (!analyser) return;
  animationId = requestAnimationFrame(drawWaveform);
  analyser.getByteTimeDomainData(dataArray);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0f0';
  ctx.beginPath();

  const sliceWidth = canvas.width / dataArray.length;
  let x = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * canvas.height) / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceWidth;
  }
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
}

// Start the microphone and set up audio processing
async function startMicrophone() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    const source = audioContext.createMediaStreamSource(micStream);
    source.connect(analyser);

    // Start recording audio
    audioChunks = [];
    mediaRecorder = new MediaRecorder(micStream);
    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };
    mediaRecorder.onstop = sendAudioToServer;
    mediaRecorder.start();

    drawWaveform();
  } catch (err) {
    console.error('Error accessing microphone:', err);
  }
}

// Stop the microphone and waveform
function stopMicrophone() {
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  drawInitialLine();
}

// Send recorded audio to backend for transcription
function sendAudioToServer() {
  const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');

  fetch('/asr', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById('transcript-box').value = data.text || 'No speech detected';
  })
  .catch(() => {
    document.getElementById('transcript-box').value = 'Transcription failed';
  });
}

// Remove toggle logic and use press-and-hold for recording
const startBtn = document.getElementById('start');

// Remove text from button and add mic SVG icon
startBtn.innerHTML = `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="18" cy="18" r="16" fill="#111" stroke="#00ff00" stroke-width="3"/>
  <rect x="13" y="9" width="10" height="14" rx="5" fill="#00ff00"/>
  <rect x="16" y="23" width="4" height="4" rx="2" fill="#00ff00"/>
  <rect x="15" y="27" width="6" height="2" rx="1" fill="#00ff00"/>
</svg>`;
startBtn.classList.add('mic-btn');

startBtn.addEventListener('mousedown', async () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    await startMicrophone();
    startBtn.style.background = '#00ff00';
    startBtn.querySelector('svg rect[x="13"]').setAttribute('fill', '#111');
  }
});

startBtn.addEventListener('mouseup', () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    stopMicrophone();
    startBtn.style.background = '#111';
    startBtn.querySelector('svg rect[x="13"]').setAttribute('fill', '#00ff00');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawInitialLine();
  }
});

// For touch devices
startBtn.addEventListener('touchstart', async (e) => {
  e.preventDefault();
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    await startMicrophone();
    startBtn.style.background = '#00ff00';
    startBtn.querySelector('svg rect[x="13"]').setAttribute('fill', '#111');
  }
});

startBtn.addEventListener('touchend', (e) => {
  e.preventDefault();
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    stopMicrophone();
    startBtn.style.background = '#111';
    startBtn.querySelector('svg rect[x="13"]').setAttribute('fill', '#00ff00');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawInitialLine();
  }
});
