async function loadImageBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}

let currentStream = null;
let isCameraMode = false;
let capturedImageData = null;
let currentFacingMode = 'user'; // 'user' for front camera, 'environment' for back camera

// Loading functions
function showLoading(message = "Memproses gambar...") {
    const loading = document.getElementById('loading');
    const loadingText = document.querySelector('.loading-text');
    loadingText.textContent = message;
    loading.style.display = 'flex';

    // Disable all buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => btn.disabled = true);
}

function hideLoading() {
    const loading = document.getElementById('loading');
    loading.style.display = 'none';

    // Enable all buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => btn.disabled = false);
}

function loadImagePreview() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert("Silakan pilih gambar terlebih dahulu!");
        return;
    }

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const imageURL = URL.createObjectURL(file);
    const img = new Image();
    img.src = imageURL;

    img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Update result text to prompt user to predict
        document.getElementById('result').innerText = "Gambar berhasil dimuat! Klik tombol Prediksi untuk analisis.";
    };
}

async function toggleCamera() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const fileInput = document.getElementById('fileInput');
    const captureBtn = document.getElementById('captureBtn');
    const switchCameraBtn = document.getElementById('switchCameraBtn');
    const cameraBtn = document.querySelector('.btn-camera');
    const predictBtn = document.querySelector('.btn-predict');
    const canvasContainer = document.querySelector('.canvas-container');

    if (!isCameraMode) {
        try {
            showLoading("Mengakses kamera...");
            await startCamera();

            // Enable fullscreen mode
            document.body.classList.add('camera-fullscreen');
            canvasContainer.classList.add('fullscreen');
            video.classList.add('fullscreen');

            video.style.display = 'block';
            canvas.style.display = 'none';
            fileInput.style.display = 'none';

            // Create fullscreen controls
            createFullscreenControls();

            // Hide camera and predict buttons during capture mode
            cameraBtn.style.display = 'none';
            predictBtn.style.display = 'none';

            isCameraMode = true;
            hideLoading();
        } catch (error) {
            hideLoading();
            alert('Tidak dapat mengakses kamera: ' + error.message);
        }
    } else {
        stopCamera();
    }
}

function createFullscreenControls() {
    // Remove existing controls if any
    const existingControls = document.querySelector('.fullscreen-controls');
    if (existingControls) {
        existingControls.remove();
    }

    // Create new controls
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'fullscreen-controls';

    const switchBtn = document.createElement('button');
    switchBtn.className = 'btn btn-switch';
    switchBtn.innerHTML = currentFacingMode === 'user'
        ? '<i class="fas fa-sync-alt"></i> Kamera Belakang'
        : '<i class="fas fa-sync-alt"></i> Kamera Depan';
    switchBtn.onclick = switchCamera;

    const captureBtn = document.createElement('button');
    captureBtn.className = 'btn btn-capture';
    captureBtn.innerHTML = '<i class="fas fa-camera-retro"></i> Ambil Foto';
    captureBtn.onclick = capturePhoto;

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-cancel';
    cancelBtn.innerHTML = '<i class="fas fa-times"></i> Tutup';
    cancelBtn.onclick = stopCamera;

    controlsDiv.appendChild(switchBtn);
    controlsDiv.appendChild(captureBtn);
    controlsDiv.appendChild(cancelBtn);

    document.body.appendChild(controlsDiv);
}

async function startCamera() {
    const video = document.getElementById('video');

    const constraints = {
        video: {
            facingMode: currentFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    };

    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = currentStream;
}

async function switchCamera() {
    if (!isCameraMode) return;

    try {
        showLoading("Mengganti kamera...");

        // Stop current stream
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        // Switch facing mode
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

        // Start new stream with switched camera
        await startCamera();

        hideLoading();

        // Update fullscreen controls button text
        const fullscreenSwitchBtn = document.querySelector('.fullscreen-controls .btn-switch');
        if (fullscreenSwitchBtn) {
            fullscreenSwitchBtn.innerHTML = currentFacingMode === 'user'
                ? '<i class="fas fa-sync-alt"></i> Kamera Belakang'
                : '<i class="fas fa-sync-alt"></i> Kamera Depan';
        }

    } catch (error) {
        hideLoading();
        // If switching fails, try to go back to previous camera
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        try {
            await startCamera();
        } catch (fallbackError) {
            alert('Tidak dapat mengganti kamera: ' + error.message);
        }
    }
}

function stopCamera() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const fileInput = document.getElementById('fileInput');
    const captureBtn = document.getElementById('captureBtn');
    const switchCameraBtn = document.getElementById('switchCameraBtn');
    const cameraBtn = document.querySelector('.btn-camera');
    const predictBtn = document.querySelector('.btn-predict');
    const canvasContainer = document.querySelector('.canvas-container');

    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }

    // Exit fullscreen mode
    document.body.classList.remove('camera-fullscreen');
    canvasContainer.classList.remove('fullscreen');
    video.classList.remove('fullscreen');

    // Remove fullscreen controls
    const fullscreenControls = document.querySelector('.fullscreen-controls');
    if (fullscreenControls) {
        fullscreenControls.remove();
    }

    video.style.display = 'none';
    canvas.style.display = 'block';
    fileInput.style.display = 'block';
    captureBtn.style.display = 'none';
    switchCameraBtn.style.display = 'none';

    // Show camera and predict buttons back
    cameraBtn.style.display = 'inline-flex';
    predictBtn.style.display = 'inline-flex';

    isCameraMode = false;

    // Reset facing mode to front camera for next use
    currentFacingMode = 'user';
    switchCameraBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Kamera Belakang';
}

function capturePhoto() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    showLoading("Mengambil foto...");

    setTimeout(() => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob for prediction
        canvas.toBlob(blob => {
            capturedImageData = blob;

            video.style.display = 'none';
            canvas.style.display = 'block';
            document.getElementById('captureBtn').style.display = 'none';

            stopCamera();
            hideLoading();

            // Update result text to prompt user to predict
            document.getElementById('result').innerText = "Foto berhasil diambil! Klik tombol Prediksi untuk analisis.";
        }, 'image/jpeg', 0.9);
    }, 500);
}

function cancelUpload() {
    showLoading("Membersihkan data...");

    setTimeout(() => {
        const fileInput = document.getElementById('fileInput');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const result = document.getElementById('result');
        const cameraBtn = document.querySelector('.btn-camera');
        const predictBtn = document.querySelector('.btn-predict');

        // Reset input file
        fileInput.value = "";

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Reset result text
        result.innerText = "Pilih gambar atau ambil foto untuk memulai deteksi";

        // Reset captured image data
        capturedImageData = null;

        // Stop camera if active
        if (isCameraMode) {
            stopCamera();
        }

        // Ensure camera and predict buttons are visible
        cameraBtn.style.display = 'inline-flex';
        predictBtn.style.display = 'inline-flex';

        // Optional: Reset canvas size kecil lagi (kalau mau rapih banget)
        canvas.width = 320;
        canvas.height = 320;

        hideLoading();
    }, 300);
}

async function predict() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    // Check if we have either a file or captured image
    if (!file && !capturedImageData) {
        alert("Silakan pilih gambar atau ambil foto terlebih dahulu!");
        return;
    }

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    showLoading("Mengirim gambar ke server...");

    try {
        let imageBase64;

        if (capturedImageData) {
            // Use captured image from camera
            imageBase64 = await loadImageBase64(capturedImageData);
        } else {
            // Use uploaded file
            const imageURL = URL.createObjectURL(file);
            const img = new Image();
            img.src = imageURL;
            await new Promise(resolve => {
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                    resolve();
                };
            });
            imageBase64 = await loadImageBase64(file);
        }

        // Update loading message
        document.querySelector('.loading-text').textContent = "Menganalisis gambar...";

        const response = await axios({
            method: "POST",
            url: "https://serverless.roboflow.com/penyakit-kulit-pada-kucing-0bdt0/2",
            params: {
                api_key: ENV.API_KEY
            },
            data: imageBase64,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        console.log(response.data);

        const predictions = response.data.predictions;

        // Update loading message
        document.querySelector('.loading-text').textContent = "Menggambar hasil deteksi...";

        ctx.lineWidth = 4;
        ctx.strokeStyle = 'red';
        ctx.font = "12px Arial";
        ctx.fillStyle = "red";

        predictions.forEach(pred => {
            const x = pred.x - pred.width / 2;
            const y = pred.y - pred.height / 2;
            const width = pred.width;
            const height = pred.height;

            ctx.strokeRect(x, y, width, height);

            const fontSize = 28;
            ctx.font = `${fontSize}px Arial`;

            ctx.fillText(
                pred.class + " " + (pred.confidence * 100).toFixed(1) + "%",
                x,
                y - 10
            );
        });

        hideLoading();

        if (predictions.length > 0) {
            document.getElementById('result').innerText = `Deteksi selesai! Ditemukan ${predictions.length} objek.`;
        } else {
            document.getElementById('result').innerText = "Deteksi selesai! Tidak ada penyakit kulit yang terdeteksi.";
        }

    } catch (error) {
        hideLoading();
        console.error(error.message);
        document.getElementById('result').innerText = "Terjadi kesalahan: " + error.message;
    }
}
