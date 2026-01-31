function downloadStrip() {
  if (!finalStripCanvas) return;

  const SIDE_MARGIN = 20;
  const TOP_MARGIN = 100;
  const SPACING = 20;
  const BOTTOM_MARGIN = 120;
  const photoWidth = 600;
  const photoHeight = 800;

  // Create a new canvas to bake everything
  const downloadCanvas = document.createElement("canvas");
  downloadCanvas.width = finalStripCanvas.width;
  downloadCanvas.height = finalStripCanvas.height;
  const ctx = downloadCanvas.getContext("2d");

  // Background
  ctx.fillStyle = "#5a1a1a";
  ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

  // Draw photos with black & white + sepia baked in
  ctx.filter = "grayscale(1) contrast(1.4) brightness(1) sepia(0.05)";

  photos.forEach((src, i) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const x = SIDE_MARGIN;
      const y = TOP_MARGIN + i * (photoHeight + SPACING);
      ctx.drawImage(img, x, y, photoWidth, photoHeight);

      // Borders
      ctx.strokeStyle = "#3e0f0f";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, photoWidth, photoHeight);

      // After last photo, draw text + texture
      if (i === photos.length - 1) {
        drawBottomTextAndTextureOnCanvas(ctx, downloadCanvas, SIDE_MARGIN, TOP_MARGIN, SPACING, photoHeight, photos.length);
      }
    };
    img.src = src;
  });
}

// Draw bottom text + texture baked for download
function drawBottomTextAndTextureOnCanvas(ctx, canvas, sideMargin, topMargin, spacing, photoHeight, photosCount) {
  const fullText = document.getElementById("customText").value.slice(0, 60);

  // Split into two lines
  const words = fullText.split(" ");
  let line1 = "", line2 = "";
  for (const word of words) {
    if ((line1 + " " + word).trim().length <= 30) line1 = (line1 + " " + word).trim();
    else line2 = (line2 + " " + word).trim();
  }

  const startY = topMargin + photoHeight * photosCount + spacing * (photosCount - 1) + 30;

  ctx.filter = "none";
  ctx.fillStyle = "#f5f0e6";
  ctx.textAlign = "center";
  ctx.font = "22px 'Playwrite India Guides', cursive";
  ctx.fillText(line1, canvas.width / 2, startY);
  ctx.fillText(line2, canvas.width / 2, startY + 28);

  ctx.font = "16px 'Playwrite India Guides', cursive";
  ctx.fillText(new Date().toLocaleDateString(), canvas.width / 2, startY + 60);

  // Texture overlay
  const texture = new Image();
  texture.src = "vintage-texture.jpg";
  texture.onload = () => {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.globalCompositeOperation = "multiply";
    const scale = canvas.width / texture.width;
    ctx.drawImage(texture, 0, 0, canvas.width, texture.height * scale);
    ctx.restore();

    // Download (works on desktop & iOS)
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      const imgURL = canvas.toDataURL("image/png");
      const popup = window.open(imgURL, "_blank");
      if (!popup) alert("Enable popups to download the photo strip on iOS.");
    } else {
      const link = document.createElement("a");
      link.download = "photo-strip.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }

    // Reset for next user
    document.getElementById("customText").value = "";
    document.getElementById("result").innerHTML = "";
    finalStripCanvas = null;
    document.getElementById("downloadBtn").style.display = "none";
    photos = [];
  };
}

// Helper to draw image with filters
function drawImageFiltered(ctx, img, x, y, width, height) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = "grayscale(1) contrast(1.4) brightness(1) sepia(0.05)";
  ctx.drawImage(img, x, y, width, height);
}
