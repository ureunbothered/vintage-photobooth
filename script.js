let finalStripCanvas = null;

const video = document.getElementById("camera");
const countdownEl = document.getElementById("countdown");
const result = document.getElementById("result");
const downloadBtn = document.getElementById("downloadBtn");
const MAX_CUSTOM_CHARS = 60;

let photos = [];

/* ======================
   STRIP CONFIG (ONE SOURCE OF TRUTH)
====================== */
const PHOTO_W = 600;
const PHOTO_H = 800; // fixed portrait ratio
const PHOTO_COUNT = 4;

const SIDE_MARGIN = 40;
const TOP_MARGIN = 120;
const BOTTOM_MARGIN = 140;
const SPACING = 24;

const STRIP_W = PHOTO_W + SIDE_MARGIN * 2;
const STRIP_H =
  TOP_MARGIN +
  PHOTO_COUNT * PHOTO_H +
  (PHOTO_COUNT - 1) * SPACING +
  BOTTOM_MARGIN;

/* ======================
   CAMERA
====================== */
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: false
  });
  video.srcObject = stream;
}
startCamera();

/* ======================
   HELPERS
====================== */
function countdown(seconds) {
  return new Promise(resolve => {
    let count = seconds;
    countdownEl.innerText = count;
    const i = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(i);
        countdownEl.innerText = "";
        resolve();
      } else {
        countdownEl.innerText = count;
      }
    }, 1000);
  });
}

const pause = ms => new Promise(r => setTimeout(r, ms));

function flashEffect() {
  return new Promise(resolve => {
    const flash = document.createElement("div");
    Object.assign(flash.style, {
      position: "fixed",
      inset: 0,
      background: "#fff",
      opacity: 0.7,
      zIndex: 9999,
      transition: "opacity 0.3s ease"
    });
    document.body.appendChild(flash);
    setTimeout(() => {
      flash.style.opacity = 0;
      setTimeout(() => {
        flash.remove();
        resolve();
      }, 300);
    }, 100);
  });
}

/* ======================
   PHOTO CAPTURE (NO STRETCHING)
====================== */
function takePhoto() {
  const vw = video.videoWidth;
  const vh = video.videoHeight;

  // crop center to match PHOTO_W / PHOTO_H ratio
  const targetRatio = PHOTO_W / PHOTO_H;
  const videoRatio = vw / vh;

  let sx, sy, sw, sh;

  if (videoRatio > targetRatio) {
    // video too wide → crop sides
    sh = vh;
    sw = vh * targetRatio;
    sx = (vw - sw) / 2;
    sy = 0;
  } else {
    // video too tall → crop top/bottom
    sw = vw;
    sh = vw / targetRatio;
    sx = 0;
    sy = (vh - sh) / 2;
  }

  const canvas = document.createElement("canvas");
  canvas.width = PHOTO_W;
  canvas.height = PHOTO_H;

  const ctx = canvas.getContext("2d");

  // mirror
  ctx.translate(PHOTO_W, 0);
  ctx.scale(-1, 1);

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, PHOTO_W, PHOTO_H);

  photos.push(canvas.toDataURL("image/png"));
}

/* ======================
   SESSION
====================== */
async function startSession() {
  photos = [];
  result.innerHTML = "";
  downloadBtn.style.display = "none";

  for (let i = 0; i < PHOTO_COUNT; i++) {
    await countdown(3);
    takePhoto();
    await flashEffect();
    if (i < PHOTO_COUNT - 1) await pause(800);
  }

  buildStrip();
}

/* ======================
   STRIP BUILD
====================== */
function buildStrip() {
  const canvas = document.createElement("canvas");
  canvas.width = STRIP_W;
  canvas.height = STRIP_H;

  const ctx = canvas.getContext("2d");

  /* Background */
  ctx.fillStyle = "#5a1a1a";
  ctx.fillRect(0, 0, STRIP_W, STRIP_H);

  /* Title */
  drawTitle(
    ctx,
    "Ure's 30th Murder Mystery Party",
    STRIP_W,
    SIDE_MARGIN,
    TOP_MARGIN / 2 + 20
  );

  let loaded = 0;

  photos.forEach((src, i) => {
    const img = new Image();
    img.onload = () => {
      const x = SIDE_MARGIN;
      const y = TOP_MARGIN + i * (PHOTO_H + SPACING);

      ctx.save();
      ctx.filter = "grayscale(1) contrast(1.3) brightness(1) sepia(0.06)";
      ctx.drawImage(img, x, y, PHOTO_W, PHOTO_H);
      ctx.restore();

      ctx.strokeStyle = "#3e0f0f";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, PHOTO_W, PHOTO_H);

      loaded++;
      if (loaded === photos.length) {
        drawBottomText(ctx);
        applyTexture(ctx);
        result.innerHTML = "";
        result.appendChild(canvas);
        finalStripCanvas = canvas;
        downloadBtn.style.display = "inline-block";
      }
    };
    img.src = src;
  });
}

/* ======================
   TITLE
====================== */
function drawTitle(ctx, text, width, margin, y) {
  let size = 48;
  ctx.fillStyle = "#f5f0e6";
  ctx.textAlign = "center";

  do {
    ctx.font = `${size}px 'Playwrite India Guides', cursive`;
    size--;
  } while (ctx.measureText(text).width > width - margin * 2 && size > 12);

  ctx.fillText(text, width / 2, y);
}

/* ======================
   BOTTOM TEXT (NO FILTER = NO LINES)
====================== */
function drawBottomText(ctx) {
  const text = document
    .getElementById("customText")
    .value.slice(0, MAX_CUSTOM_CHARS);

  const words = text.split(" ");
  let line1 = "", line2 = "";

  for (const w of words) {
    if ((line1 + " " + w).trim().length <= 30) line1 = (line1 + " " + w).trim();
    else line2 = (line2 + " " + w).trim();
  }

  const y =
    TOP_MARGIN +
    PHOTO_COUNT * PHOTO_H +
    (PHOTO_COUNT - 1) * SPACING +
    40;

  ctx.fillStyle = "#f5f0e6";
  ctx.textAlign = "center";

  ctx.font = "22px 'Playwrite India Guides', cursive";
  ctx.fillText(line1, STRIP_W / 2, y);
  ctx.fillText(line2, STRIP_W / 2, y + 28);

  ctx.font = "16px 'Playwrite India Guides', cursive";
  ctx.fillText(new Date().toLocaleDateString(), STRIP_W / 2, y + 60);
}

/* ======================
   TEXTURE (APPLIED LAST)
====================== */
function applyTexture(ctx) {
  const texture = new Image();
  texture.src = "vintage-texture.jpg";
  texture.onload = () => {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.globalCompositeOperation = "multiply";
    const scale = STRIP_W / texture.width;
    ctx.drawImage(texture, 0, 0, STRIP_W, texture.height * scale);
    ctx.restore();
  };
}

/* ======================
   DOWNLOAD
====================== */
function downloadStrip() {
  if (!finalStripCanvas) return;

  const isPhone =
    /iPhone|Android.*Mobile|Windows Phone/i.test(navigator.userAgent);

  // Desktop + iPad: keep EXACT behavior you already have
  if (!isPhone) {
    const link = document.createElement("a");
    link.download = "photo-strip.png";
    link.href = finalStripCanvas.toDataURL("image/png");
    link.click();
    return;
  }

  // Phone fallback: open image so user can long-press → Save
  finalStripCanvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, "image/png");
}


