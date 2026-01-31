let finalStripCanvas = null;

const video = document.getElementById("camera");
const countdownEl = document.getElementById("countdown");
const result = document.getElementById("result");
const MAX_CUSTOM_CHARS = 60;

let photos = [];

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
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        countdownEl.innerText = "";
        resolve();
      } else {
        countdownEl.innerText = count;
      }
    }, 1000);
  });
}

function pause(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function flashEffect() {
  return new Promise(resolve => {
    const flash = document.createElement("div");
    flash.style.position = "absolute";
    flash.style.inset = 0;
    flash.style.background = "white";
    flash.style.opacity = "0.7";
    flash.style.zIndex = 1000;
    flash.style.transition = "opacity 0.3s ease-out";
    document.body.appendChild(flash);

    setTimeout(() => {
      flash.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(flash);
        resolve();
      }, 300);
    }, 100);
  });
}

/* ======================
   CAPTURE PHOTO (LOCKED 600x800)
====================== */
function takePhoto() {
  const canvas = document.createElement("canvas");
  const w = 600;
  const h = 800;

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");

  // Mirror
  ctx.scale(-1, 1);
  ctx.drawImage(video, -w, 0, w, h);

  photos.push(canvas.toDataURL("image/png"));
}

/* ======================
   SESSION
====================== */
async function startSession() {
  photos = [];
  result.innerHTML = "";
  document.getElementById("downloadBtn").style.display = "none";

  for (let i = 0; i < 4; i++) {
    await countdown(3);
    takePhoto();
    await flashEffect();
    if (i < 3) await pause(800);
  }

  buildStrip();
}

/* ======================
   BUILD STRIP (SINGLE SOURCE OF TRUTH)
====================== */
function buildStrip() {
  const SIDE_MARGIN = 20;
  const TOP_MARGIN = 100;
  const BOTTOM_MARGIN = 120;
  const SPACING = 20;

  const photoWidth = 600;
  const photoHeight = 800;
  const photosCount = photos.length;

  const stripWidth = photoWidth + SIDE_MARGIN * 2;
  const stripHeight =
    TOP_MARGIN +
    photoHeight * photosCount +
    SPACING * (photosCount - 1) +
    BOTTOM_MARGIN;

  const canvas = document.createElement("canvas");
  canvas.width = stripWidth;
  canvas.height = stripHeight;
  const ctx = canvas.getContext("2d");

  /* ---- Background ---- */
  ctx.fillStyle = "#5a1a1a";
  ctx.fillRect(0, 0, stripWidth, stripHeight);

  /* ---- Title ---- */
  drawTitle(
    ctx,
    "Ure's 30th Murder Mystery Party",
    stripWidth,
    SIDE_MARGIN,
    TOP_MARGIN / 2 + 20
  );

  /* ---- Draw Photos ---- */
  let loaded = 0;

  photos.forEach((src, i) => {
    const img = new Image();
    img.onload = () => {
      const x = SIDE_MARGIN;
      const y = TOP_MARGIN + i * (photoHeight + SPACING);

      // Reset context state EVERY draw
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      drawImageFiltered(ctx, img, x, y, photoWidth, photoHeight);


      ctx.strokeStyle = "#3e0f0f";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, photoWidth, photoHeight);

      loaded++;
      if (loaded === photosCount) {
        drawBottomTextAndTexture(
          ctx,
          stripWidth,
          TOP_MARGIN,
          photoHeight,
          SPACING,
          photosCount
        );

        result.innerHTML = "";
        result.appendChild(canvas);
        finalStripCanvas = canvas;
        document.getElementById("downloadBtn").style.display =
          "inline-block";
      }
    };
    img.src = src;
  });
}

/* ======================
   TITLE
====================== */
function drawTitle(ctx, text, stripWidth, sideMargin, y) {
  let size = 48;
  ctx.fillStyle = "#f5f0e6";
  ctx.textAlign = "center";

  do {
    ctx.font = `${size}px 'Playwrite India Guides', cursive`;
    size--;
  } while (
    ctx.measureText(text).width >
      stripWidth - sideMargin * 2 &&
    size > 10
  );

  ctx.fillText(text, stripWidth / 2, y);
}

/* ======================
   BOTTOM TEXT + TEXTURE (BAKED INTO CANVAS)
====================== */
function drawBottomTextAndTexture(
  ctx,
  stripWidth,
  topMargin,
  photoHeight,
  spacing,
  photosCount
) {
  const text = document
    .getElementById("customText")
    .value.slice(0, MAX_CUSTOM_CHARS);

  const words = text.split(" ");
  let line1 = "";
  let line2 = "";

  for (const word of words) {
    if ((line1 + " " + word).trim().length <= 30) {
      line1 = (line1 + " " + word).trim();
    } else {
      line2 = (line2 + " " + word).trim();
    }
  }

  const startY =
    topMargin +
    photoHeight * photosCount +
    spacing * (photosCount - 1) +
    30;

  ctx.filter = "none";
  ctx.fillStyle = "#f5f0e6";
  ctx.textAlign = "center";

  ctx.font = "22px 'Playwrite India Guides', cursive";
  ctx.fillText(line1, stripWidth / 2, startY);
  ctx.fillText(line2, stripWidth / 2, startY + 28);

  ctx.font = "16px 'Playwrite India Guides', cursive";
  ctx.fillText(
    new Date().toLocaleDateString(),
    stripWidth / 2,
    startY + 60
  );

  /* ---- Texture Overlay ---- */
  const texture = new Image();
  texture.onload = () => {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.globalCompositeOperation = "multiply";
    const scale = stripWidth / texture.width;
    ctx.drawImage(
      texture,
      0,
      0,
      stripWidth,
      texture.height * scale
    );
    ctx.restore();
  };
  texture.src = "vintage-texture.jpg";
}

/* ======================
   DOWNLOAD
====================== */
function downloadStrip() {
  if (!finalStripCanvas) return;

  const link = document.createElement("a");
  link.download = "photo-strip.png";
  link.href = finalStripCanvas.toDataURL("image/png");
  link.click();
}

function downloadStrip() {
  if (!finalStripCanvas) return;

  // Trigger download
  const link = document.createElement("a");
  link.download = "photo-strip.png";
  link.href = finalStripCanvas.toDataURL("image/png");
  link.click();

  // ✅ Reset for next user
  document.getElementById("customText").value = ""; // clear text input
  document.getElementById("result").innerHTML = "";  // clear preview
  finalStripCanvas = null;                           // reset stored canvas
}

