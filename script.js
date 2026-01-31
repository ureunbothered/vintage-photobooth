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

function pause(ms) { return new Promise(r => setTimeout(r, ms)); }

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
      setTimeout(() => { document.body.removeChild(flash); resolve(); }, 300);
    }, 100);
  });
}

/* ======================
   TAKE PHOTO
====================== */
function takePhoto() {
  const canvas = document.createElement("canvas");
  const w = 600;
  const h = 800;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  // Mirror horizontally
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
   BUILD STRIP
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
  const stripHeight = TOP_MARGIN + photoHeight * photosCount + SPACING * (photosCount - 1) + BOTTOM_MARGIN;

  const canvas = document.createElement("canvas");
  canvas.width = stripWidth;
  canvas.height = stripHeight;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#5a1a1a";
  ctx.fillRect(0, 0, stripWidth, stripHeight);

  // Title
  drawTitle(ctx, "Ure's 30th Murder Mystery Party", stripWidth, SIDE_MARGIN, TOP_MARGIN / 2 + 20);

  let loaded = 0;

  photos.forEach((src, i) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // important for mobile/iOS downloads
    img.onload = () => {
      const x = SIDE_MARGIN;
      const y = TOP_MARGIN + i * (photoHeight + SPACING);

      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
      ctx.filter = "grayscale(1) contrast(1.4) brightness(1) sepia(0.05)";
      ctx.drawImage(img, x, y, photoWidth, photoHeight);

      // border
      ctx.strokeStyle = "#3e0f0f";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, photoWidth, photoHeight);

      loaded++;
      if (loaded === photosCount) {
        // Bottom text + texture
        drawBottomTextAndTexture(ctx, stripWidth, stripHeight, TOP_MARGIN, photoHeight, SPACING, BOTTOM_MARGIN);

        // Append to preview
        result.innerHTML = "";
        result.appendChild(canvas);
        finalStripCanvas = canvas;
        document.getElementById("downloadBtn").style.display = "inline-block";
      }
    };
    img.src = src;
  });
}

/* ======================
   DRAW TITLE
====================== */
function drawTitle(ctx, text, stripWidth, sideMargin, yPosition) {
  let fontSize = 48;
  ctx.fillStyle = "#f5f0e6";
  ctx.textAlign = "center";
  do {
    ctx.font = `${fontSize}px 'Playwrite India Guides', cursive`;
    fontSize--;
  } while (ctx.measureText(text).width > stripWidth - sideMargin * 2 && fontSize > 10);
  ctx.fillText(text, stripWidth / 2, yPosition);
}

/* ======================
   DRAW BOTTOM TEXT + TEXTURE
====================== */
function drawBottomTextAndTexture(ctx, stripWidth, stripHeight, topMargin, photoHeight, spacing, bottomMargin) {
  const fullText = document.getElementById("customText").value.slice(0, MAX_CUSTOM_CHARS);
  const words = fullText.split(" ");
  let line1 = "", line2 = "";
  for (let word of words) {
    if ((line1 + " " + word).trim().length <= 30) line1 = (line1 + " " + word).trim();
    else line2 = (line2 + " " + word).trim();
  }

  const startY = topMargin + photoHeight * 4 + spacing * (4 - 1) + 30;

  ctx.fillStyle = "#f5f0e6";
  ctx.textAlign = "center";
  ctx.font = "22px 'Playwrite India Guides', cursive";
  ctx.fillText(line1, stripWidth / 2, startY);
  ctx.fillText(line2, stripWidth / 2, startY + 28);

  ctx.font = "16px 'Playwrite India Guides', cursive";
  ctx.fillText(new Date().toLocaleDateString(), stripWidth / 2, startY + 60);

  // Texture overlay baked into canvas
  const texture = new Image();
  texture.src = "vintage-texture.jpg";
  texture.onload = () => {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.globalCompositeOperation = "multiply";
    const scale = stripWidth / texture.width;
    ctx.drawImage(texture, 0, 0, stripWidth, texture.height * scale);
    ctx.restore();
  };
}

/* ======================
   DOWNLOAD
====================== */
function downloadStrip() {
  if (!finalStripCanvas) return;

  // Use temp canvas to bake filters + texture for mobile/iOS
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = finalStripCanvas.width;
  tempCanvas.height = finalStripCanvas.height;
  const ctx = tempCanvas.getContext("2d");

  // Fill background
  ctx.fillStyle = "#5a1a1a";
  ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Draw photos with filter
  const SIDE_MARGIN = 20;
  const TOP_MARGIN = 100;
  const SPACING = 20;
  const BOTTOM_MARGIN = 120;
  const photoWidth = 600;
  const photoHeight = 800;

  photos.forEach((src, i) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const x = SIDE_MARGIN;
      const y = TOP_MARGIN + i * (photoHeight + SPACING);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = "grayscale(1) contrast(1.4) brightness(1) sepia(0.05)";
      ctx.drawImage(img, x, y, photoWidth, photoHeight);
      ctx.strokeStyle = "#3e0f0f";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, photoWidth, photoHeight);

      if (i === photos.length - 1) {
        // Draw bottom text + texture
        drawBottomTextAndTexture(ctx, tempCanvas.width, tempCanvas.height, TOP_MARGIN, photoHeight, SPACING, BOTTOM_MARGIN);

        // Trigger download
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
          const imgURL = tempCanvas.toDataURL("image/png");
          const popup = window.open(imgURL, "_blank");
          if (!popup) alert("Enable popups to download on iOS.");
        } else {
          const link = document.createElement("a");
          link.download = "photo-strip.png";
          link.href = tempCanvas.toDataURL("image/png");
          link.click();
        }

        // Reset page for next user
        photos = [];
        finalStripCanvas = null;
        result.innerHTML = "";
        document.getElementById("customText").value = "";
        document.getElementById("downloadBtn").style.display = "none";
      }
    };
    img.src = src;
  });
}
