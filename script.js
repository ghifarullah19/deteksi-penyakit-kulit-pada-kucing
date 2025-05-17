async function loadImageBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
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
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous canvas content
        ctx.drawImage(img, 0, 0, img.width, img.height); // Draw the uploaded image as preview
    };
}

function cancelUpload() {
    const fileInput = document.getElementById('fileInput');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const result = document.getElementById('result');

    // Reset input file
    fileInput.value = "";

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reset result text
    result.innerText = "";

    // Optional: Reset canvas size kecil lagi (kalau mau rapih banget)
    canvas.width = 320;
    canvas.height = 320;
}

async function predict() {
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
    img.onload = async function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        try {
            const imageBase64 = await loadImageBase64(file);

            const response = await axios({
                method: "POST",
                url: "https://serverless.roboflow.com/penyakit-kulit-pada-kucing-0bdt0/2",
                params: {
                    api_key: ENV.API_KEY // menggunakan env.js
                },
                data: imageBase64,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });

            console.log(response.data);

            const predictions = response.data.predictions;

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

                // Menyesuaikan ukuran font berdasarkan lebar kotak prediksi
                const fontSize = 28; // font size antara 12px dan 20px
                ctx.font = `${fontSize}px Arial`;

                ctx.fillText(
                    pred.class + " " + (pred.confidence * 100).toFixed(1) + "%",
                    x,
                    y - 10
                );
            });

            document.getElementById('result').innerText = "Deteksi selesai!";

        } catch (error) {
            console.error(error.message);
            document.getElementById('result').innerText = "Terjadi kesalahan: " + error.message;
        }
    };
}
