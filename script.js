let finalStripCanvas = null;

const video = document.getElementById("camera");
const countdownEl = document.getElementById("countdown");
const result = document.getElementById("result");
const MAX_CUSTOM_CHARS = 60;

let photos = [];

// Start camera
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: false
  });
  video.srcObject = stream;
}
startCamera();

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
    flash.style.top = 0;
    flash.style.left = 0;
    flash.style.width = "100%";
    flash.style.height = "100%";
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

// Take photo (mirror)
function takePhoto() {
  const canvas = document.createElement("canvas");
  const w = 600, h = 800;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.scale(-1,1);
  ctx.drawImage(video, -w, 0, w, h);
  photos.push(canvas.toDataURL("image/png"));
}

async function startSession() {
  photos = [];
  result.innerHTML = "";
  document.getElementById("downloadBtn").style.display = "none";

  for (let i=0;i<4;i++){
    await countdown(3);
    takePhoto();
    await flashEffect();
    if(i<3) await pause(800);
  }
  buildStrip();
}

// Build strip
function buildStrip() {
  const SIDE_MARGIN = 20, TOP_MARGIN = 100, BOTTOM_MARGIN = 120, SPACING = 20;
  const photoWidth = 600, photoHeight = 800;

  const stripWidth = photoWidth + SIDE_MARGIN*2;
  const stripHeight = TOP_MARGIN + photoHeight*photos.length + SPACING*(photos.length-1) + BOTTOM_MARGIN;

  const canvas = document.createElement("canvas");
  canvas.width = stripWidth;
  canvas.height = stripHeight;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#5a1a1a";
  ctx.fillRect(0,0,stripWidth,stripHeight);

  // Top title
  drawTitle(ctx, "Ure's 30th Murder Mystery Party", stripWidth, SIDE_MARGIN, TOP_MARGIN / 2 + 20);

  // Draw photos with filter applied in JS
  let loadedCount = 0;
  photos.forEach((src,i)=>{
    const img = new Image();
    img.onload = ()=>{
      ctx.filter = "grayscale(1) contrast(1.4) brightness(1) sepia(0.05)";
      const x = SIDE_MARGIN, y = TOP_MARGIN + i*(photoHeight+SPACING);
      ctx.drawImage(img,x,y,photoWidth,photoHeight);
      ctx.strokeStyle = "#3e0f0f";
      ctx.lineWidth = 2;
      ctx.strokeRect(x,y,photoWidth,photoHeight);

      loadedCount++;
      if(loadedCount === photos.length){
        // Bottom text + vintage overlay
        drawBottomTextAndTexture(ctx, stripWidth, stripHeight, TOP_MARGIN, photoHeight, SPACING, BOTTOM_MARGIN);
        result.innerHTML = "";
        result.appendChild(canvas);
        finalStripCanvas = canvas;
        document.getElementById("downloadBtn").style.display = "inline-block";
      }
    };
    img.src = src;
  });
}

// Top title fit margin
function drawTitle(ctx, text, stripWidth, sideMargin, yPosition){
  let fontSize = 48;
  ctx.fillStyle = "#f5f0e6";
  ctx.textAlign = "center";
  do{
    ctx.font = `${fontSize}px 'Playwrite India Guides', cursive`;
    fontSize--;
  } while(ctx.measureText(text).width > stripWidth - sideMargin*2 && fontSize>10);
  ctx.fillText(text, stripWidth/2, yPosition);
}

// Bottom text + vintage overlay applied in JS (fix download colors)
function drawBottomTextAndTexture(ctx, stripWidth, stripHeight, topMargin, photoHeight, spacing, bottomMargin){
  const fullText = document.getElementById("customText").value.slice(0, MAX_CUSTOM_CHARS);
  const photosCount = 4;

  const words = fullText.split(" ");
  let line1="", line2="";
  for(let word of words){
    if((line1 + " " + word).trim().length <= 30) line1=(line1+" "+word).trim();
    else line2=(line2+" "+word).trim();
  }

  const startY = topMargin + photoHeight*photosCount + spacing*(photosCount-1) + 30;

  ctx.fillStyle = "#f5f0e6";
  ctx.textAlign = "center";

  // Custom text
  ctx.font = "22px 'Playwrite India Guides', cursive";
  ctx.fillText(line1, stripWidth/2, startY);
  ctx.fillText(line2, stripWidth/2, startY + 28);

  // Date
  ctx.font = "16px 'Playwrite India Guides', cursive";
  ctx.fillText(new Date().toLocaleDateString(), stripWidth/2, startY + 60);

  // Vintage texture overlay (ensure applied in download)
  const texture = new Image();
  texture.src = "vintage-texture.jpg";
  texture.onload = ()=>{
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.globalCompositeOperation = "multiply";
    const scale = stripWidth / texture.width;
    ctx.drawImage(texture,0,0,stripWidth,texture.height*scale);
    ctx.restore();
  };
}

// Download
function downloadStrip(){
  if(!finalStripCanvas) return;
  const link=document.createElement("a");
  link.download="photo-strip.png";
  link.href=finalStripCanvas.toDataURL("image/png");
  link.click();
}
