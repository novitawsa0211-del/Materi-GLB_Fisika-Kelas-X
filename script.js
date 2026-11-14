
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzVsfSZG-NM1GbKMRicRqSY6AhiiVOAPSzDasE7l8A7PGBGeGZUQDpI7lmT05HvMAG_jg/exec";

// ===============================
// NAVIGASI HALAMAN
// ===============================

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.getElementById(pageId).classList.add("active");

  if (pageId === "grafik") {
    drawCharts();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}


// ===============================
// PERCOBAAN VIRTUAL GLB
// ===============================

let experimentData = [];
let experimentTimer = null;
let elapsed = 0;
let experimentSpeed = 5;
let experimentDuration = 10;
let experimentRunning = false;

function getExperimentSettings() {
  const speed = Number(document.getElementById("expSpeed").value);
  const duration = Number(document.getElementById("expDuration").value);

  if (!Number.isFinite(speed) || !Number.isInteger(speed) ||
      !Number.isFinite(duration) || !Number.isInteger(duration) ||
      speed < 1 || speed > 20 || duration < 2 || duration > 20) {
    alert("Masukkan kecepatan 1–20 m/s dan waktu 2–20 sekon (bilangan bulat).");
    return false;
  }

  experimentSpeed = speed;
  experimentDuration = duration;
  return true;
}

function startExperiment() {
  if (experimentRunning) return;
  if (!getExperimentSettings()) return;

  clearInterval(experimentTimer);

  experimentData = [];
  elapsed = 0;
  experimentRunning = true;

  document.getElementById("startExperiment").disabled = true;
  document.getElementById("startExperiment").textContent = "Percobaan Berlangsung...";

  document.getElementById("currentSpeed").textContent =
    experimentSpeed + " m/s";

  document.getElementById("experimentStatus").textContent =
    "Percobaan sedang berlangsung. Amati gerak mobil!";

  recordData();
  updateCar();

  experimentTimer = setInterval(() => {
    elapsed++;

    recordData();
    updateCar();

    if (elapsed >= experimentDuration) {
      finishExperiment();
    }
  }, 1000);
}

function recordData() {
  const distance = experimentSpeed * elapsed;

  experimentData.push({
    time: elapsed,
    distance: distance,
    speed: experimentSpeed
  });

  document.getElementById("currentTime").textContent =
    elapsed + " s";

  document.getElementById("currentDistance").textContent =
    distance + " m";

  renderTable();
}

function updateCar() {
  const progress = elapsed / experimentDuration * 90;
  document.getElementById("car").style.left = progress + "%";
}

function renderTable() {
  const table = document.getElementById("dataTable");

  table.innerHTML = experimentData.map((data, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${data.time}</td>
      <td>${data.distance}</td>
      <td>${data.speed}</td>
    </tr>
  `).join("");
}

function finishExperiment() {
  clearInterval(experimentTimer);
  experimentRunning = false;

  document.getElementById("startExperiment").disabled = false;
  document.getElementById("startExperiment").textContent =
    "▶ Mulai Percobaan";

  document.getElementById("experimentStatus").textContent =
    "Percobaan selesai! Amati tabel dan lanjutkan ke grafik.";

  document.getElementById("graphSummary").textContent =
    `Percobaan menghasilkan jarak ${experimentSpeed * experimentDuration} meter dalam ${experimentDuration} sekon dengan kecepatan tetap ${experimentSpeed} m/s.`;
}

function resetExperiment() {
  clearInterval(experimentTimer);
  experimentRunning = false;
  experimentData = [];
  elapsed = 0;

  document.getElementById("startExperiment").disabled = false;
  document.getElementById("startExperiment").textContent =
    "▶ Mulai Percobaan";

  document.getElementById("car").style.left = "0%";
  document.getElementById("currentTime").textContent = "0 s";
  document.getElementById("currentDistance").textContent = "0 m";
  document.getElementById("currentSpeed").textContent =
    document.getElementById("expSpeed").value + " m/s";

  document.getElementById("dataTable").innerHTML =
    '<tr><td colspan="4">Belum ada data percobaan.</td></tr>';

  document.getElementById("experimentStatus").textContent =
    "Percobaan siap dimulai.";

  document.getElementById("graphSummary").textContent =
    "Lakukan percobaan terlebih dahulu untuk menampilkan data grafik.";

  clearCharts();
}


// ===============================
// PEMBUATAN DUA GRAFIK
// ===============================

function drawAxes(ctx, width, height, xLabel, yLabel, maxX, maxY) {
  const left = 65;
  const right = width - 25;
  const top = 25;
  const bottom = height - 55;

  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  ctx.font = "13px Arial";
  ctx.fillStyle = "#334155";
  ctx.textAlign = "center";

  for (let i = 0; i <= 5; i++) {
    const x = left + (right - left) * i / 5;
    const value = maxX * i / 5;

    ctx.fillText(Number(value.toFixed(2)), x, bottom + 20);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }

  ctx.textAlign = "right";

  for (let i = 0; i <= 5; i++) {
    const y = bottom - (bottom - top) * i / 5;
    const value = maxY * i / 5;

    ctx.fillText(Number(value.toFixed(2)), left - 10, y + 4);

    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  ctx.fillStyle = "#203b65";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(xLabel, (left + right) / 2, height - 10);

  ctx.save();
  ctx.translate(18, (top + bottom) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  return { left, right, top, bottom };
}

function drawCharts() {
  if (experimentData.length < 2) {
    clearCharts();
    document.getElementById("graphSummary").textContent =
      "Lakukan percobaan sampai selesai agar kedua grafik dapat ditampilkan.";
    return;
  }

  const maxTime = experimentData[experimentData.length - 1].time;
  const maxDistance = experimentData[experimentData.length - 1].distance;
  const maxSpeed = experimentSpeed;

  drawPositionChart(maxTime, maxDistance);
  drawVelocityChart(maxTime, maxSpeed);
}

function drawPositionChart(maxTime, maxDistance) {
  const canvas = document.getElementById("positionChart");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const axis = drawAxes(
    ctx, canvas.width, canvas.height,
    "Waktu (s)", "Jarak (m)",
    maxTime, maxDistance
  );

  ctx.strokeStyle = "#3978c8";
  ctx.lineWidth = 3;
  ctx.beginPath();

  experimentData.forEach((point, index) => {
    const x = axis.left +
      point.time / maxTime * (axis.right - axis.left);

    const y = axis.bottom -
      point.distance / maxDistance * (axis.bottom - axis.top);

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  ctx.fillStyle = "#3978c8";
  experimentData.forEach(point => {
    const x = axis.left +
      point.time / maxTime * (axis.right - axis.left);

    const y = axis.bottom -
      point.distance / maxDistance * (axis.bottom - axis.top);

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawVelocityChart(maxTime, maxSpeed) {
  const canvas = document.getElementById("velocityChart");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const axis = drawAxes(
    ctx, canvas.width, canvas.height,
    "Waktu (s)", "Kecepatan (m/s)",
    maxTime, maxSpeed * 1.5
  );

  ctx.strokeStyle = "#15966a";
  ctx.lineWidth = 3;
  ctx.beginPath();

  experimentData.forEach((point, index) => {
    const x = axis.left +
      point.time / maxTime * (axis.right - axis.left);

    const y = axis.bottom -
      point.speed / (maxSpeed * 1.5) * (axis.bottom - axis.top);

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

function clearCharts() {
  ["positionChart", "velocityChart"].forEach(id => {
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}


// ===============================
// KUIS 5 SOAL
// ===============================

const questions = [
  {
    question: "1. Gerak Lurus Beraturan adalah gerak benda yang memiliki ...",
    options: [
      "A. Kecepatan berubah-ubah",
      "B. Kecepatan tetap pada lintasan lurus",
      "C. Percepatan selalu bertambah",
      "D. Lintasan melengkung"
    ],
    answer: 1,
    explanation: "GLB merupakan gerak pada lintasan lurus dengan kecepatan tetap."
  },
  {
    question: "2. Sebuah benda bergerak dengan kecepatan 5 m/s selama 4 sekon. Jarak yang ditempuh adalah ...",
    options: [
      "A. 10 meter",
      "B. 15 meter",
      "C. 20 meter",
      "D. 25 meter"
    ],
    answer: 2,
    explanation: "s = v × t = 5 × 4 = 20 meter."
  },
  {
    question: "3. Besar percepatan pada gerak lurus beraturan adalah ...",
    options: [
      "A. 0 m/s²",
      "B. 1 m/s²",
      "C. 5 m/s²",
      "D. 10 m/s²"
    ],
    answer: 0,
    explanation: "Karena kecepatan tetap, percepatan pada GLB adalah nol."
  },
  {
    question: "4. Bentuk grafik kecepatan terhadap waktu pada GLB adalah ...",
    options: [
      "A. Garis melengkung",
      "B. Garis miring naik",
      "C. Garis vertikal",
      "D. Garis horizontal"
    ],
    answer: 3,
    explanation: "Kecepatan tetap ditunjukkan oleh garis horizontal."
  },
  {
    question: "5. Sebuah sepeda menempuh jarak 60 meter selama 10 sekon. Kecepatannya adalah ...",
    options: [
      "A. 3 m/s",
      "B. 6 m/s",
      "C. 10 m/s",
      "D. 60 m/s"
    ],
    answer: 1,
    explanation: "v = s / t = 60 / 10 = 6 m/s."
  }
];

function renderQuiz() {
  const container = document.getElementById("quizContainer");

  container.innerHTML = questions.map((question, index) => `
    <div class="quiz-question">
      <h3>${question.question}</h3>
      ${question.options.map((option, optionIndex) => `
        <label>
          <input type="radio" name="question${index}" value="${optionIndex}">
          ${option}
        </label>
      `).join("")}
      <p id="feedback${index}"></p>
    </div>
  `).join("");
}


async function submitQuiz() {
  let score = 0;
  let answered = 0;

  questions.forEach((question, index) => {
    const selected = document.querySelector(
      `input[name="question${index}"]:checked`
    );

    const feedbackElement =
      document.getElementById(`feedback${index}`);

    if (!selected) {
      feedbackElement.textContent = "Belum dijawab.";
      feedbackElement.style.color = "#b45309";
      return;
    }

    answered++;
    const answer = Number(selected.value);

    if (answer === question.answer) {
      score++;
      feedbackElement.textContent =
        "Benar! " + question.explanation;
      feedbackElement.style.color = "green";
    } else {
      feedbackElement.textContent =
        "Belum tepat. " + question.explanation;
      feedbackElement.style.color = "#dc2626";
    }
  });

  if (answered < questions.length) {
    alert("Jawab semua soal kuis terlebih dahulu!");
    return;
  }

  const nama = document.getElementById("studentName").value.trim();
  const kelas = document.getElementById("studentClass").value.trim();

  const analisis = [
    document.getElementById("analysis1").value.trim(),
    document.getElementById("analysis2").value.trim(),
    document.getElementById("analysis3").value.trim(),
    document.getElementById("analysis4").value.trim()
  ];

  if (!nama || !kelas) {
    alert("Isi nama dan kelas terlebih dahulu.");
    return;
  }

  if (analisis.some(jawaban => !jawaban)) {
    alert("Jawab semua pertanyaan analisis terlebih dahulu.");
    return;
  }

  const nilai = score / questions.length * 100;

  const jawabanKuis = questions.map((question, index) => {
    const selected = document.querySelector(
      `input[name="question${index}"]:checked`
    );

    return question.options[Number(selected.value)];
  });

  const dataPeserta = {
    nama: nama,
    kelas: kelas,
    kecepatan: document.getElementById("expSpeed").value,
    durasi: document.getElementById("expDuration").value,
    percobaan: experimentData,
    analisis: analisis,
    jawabanKuis: jawabanKuis,
    jumlahBenar: score,
    nilai: nilai
  };

  const result = document.getElementById("quizResult");
  const submitButton = document.getElementById("submitQuiz");

  submitButton.disabled = true;
  submitButton.textContent = "Mengirim hasil...";

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(dataPeserta)
    });

    result.style.display = "block";
    result.innerHTML = `
      <h3>Hasil Kuis</h3>
      <p>Nama: ${nama}</p>
      <p>Kelas: ${kelas}</p>
      <p>Jawaban benar: ${score} dari 5 soal</p>
      <h2>Nilai: ${nilai}</h2>
      <p>Pengiriman hasil telah dilakukan. Silakan periksa
      Google Sheets untuk memastikan data sudah masuk.</p>
    `;

    submitButton.textContent = "Hasil Sudah Dikirim";

  } catch (error) {
    result.style.display = "block";
    result.textContent =
      "Pengiriman gagal. Periksa koneksi internet dan URL Web App.";

    submitButton.disabled = false;
    submitButton.textContent = "Coba Kirim Kembali";
  }
}

// ===============================
// INISIALISASI
// ===============================

renderQuiz();

document.getElementById("expSpeed").addEventListener("change", function() {
  if (!experimentRunning) {
    document.getElementById("currentSpeed").textContent =
      this.value + " m/s";
  }
});
