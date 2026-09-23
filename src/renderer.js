const { invoke } = window.__TAURI__.core;

const closeBtn = document.getElementById('closeBtn');
const zzzContainer = document.getElementById('zzz');
const starsBg = document.getElementById('starsBg');
const petContainer = document.getElementById('pet-container');
const sparkleLayer = document.getElementById('sparkleLayer');
const character = document.querySelector('.breathing');
const characterWrapper = document.getElementById('characterWrapper');
const animVideo = document.getElementById('animVideo');
const animCanvas = document.getElementById('animCanvas');
const animGlowCanvas = document.getElementById('animGlowCanvas');
const animContainer = document.getElementById('animContainer');
const hearts = document.getElementById('hearts');
const ctx = animCanvas.getContext('2d');
const glowCtx = animGlowCanvas.getContext('2d');

animVideo.addEventListener('loadeddata', () => {
  console.log('视频加载成功，时长:', animVideo.duration);
});

animVideo.addEventListener('error', (e) => {
  console.error('视频加载失败:', e);
});

let clickTimer = null;
let clickCount = 0;
let lastClickTime = 0;
let animationFrame = null;

petContainer.addEventListener('click', (e) => {
  if (e.target === closeBtn) return;

  const now = Date.now();
  const timeSinceLastClick = now - lastClickTime;
  lastClickTime = now;

  if (timeSinceLastClick < 400) {
    clearTimeout(clickTimer);
    clickCount = 0;

    animContainer.style.display = 'block';
    animVideo.currentTime = 0;
    animVideo.play();

    animGlowCanvas.style.transition = 'opacity 1.2s ease';
    animGlowCanvas.style.opacity = '0';

    setTimeout(() => {
      animGlowCanvas.style.opacity = '1';
    }, 50);

    setTimeout(() => {
      hearts.classList.add('show');
      setTimeout(() => {
        hearts.classList.remove('show');
      }, 4000);
    }, 2000);

    character.style.transition = 'opacity 0.3s ease';
    character.style.opacity = '0';

    animContainer.style.transition = 'opacity 0.3s ease';
    animContainer.style.opacity = '1';

    function renderFrame() {
      if (animVideo.paused || animVideo.ended) {
        animContainer.style.display = 'none';
        return;
      }

      ctx.drawImage(animVideo, 0, 0, 768, 768);
      glowCtx.drawImage(animVideo, 0, 0, 768, 768);

      const imageData = ctx.getImageData(0, 0, 768, 768);
      const data = imageData.data;
      const glowData = glowCtx.getImageData(0, 0, 768, 768);
      const glowPixels = glowData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;

        if (brightness < 30) {
          data[i + 3] = 0;
          glowPixels[i + 3] = 0;
        } else if (brightness < 60) {
          const alpha = Math.floor((brightness - 30) / 30 * 255);
          data[i + 3] = alpha;
          glowPixels[i] = 255;
          glowPixels[i + 1] = 248;
          glowPixels[i + 2] = 220;
          glowPixels[i + 3] = Math.floor(alpha * 0.4);
        } else {
          glowPixels[i] = 255;
          glowPixels[i + 1] = 248;
          glowPixels[i + 2] = 220;
          glowPixels[i + 3] = Math.floor(data[i + 3] * 0.25);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      glowCtx.putImageData(glowData, 0, 0);

      animationFrame = requestAnimationFrame(renderFrame);
    }

    animVideo.addEventListener('play', () => {
      renderFrame();
    });

    animVideo.onended = () => {
      cancelAnimationFrame(animationFrame);
      hearts.classList.remove('show');
      animGlowCanvas.style.transition = 'opacity 1.2s ease';
      animGlowCanvas.style.opacity = '0';
      character.style.transition = 'opacity 0.3s ease';
      character.style.opacity = '1';
      animContainer.style.transition = 'opacity 0.3s ease';
      animContainer.style.opacity = '0';
      setTimeout(() => {
        animContainer.style.display = 'none';
      }, 300);
    };
  } else {
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      zzzContainer.classList.remove('show');
      void zzzContainer.offsetWidth;
      zzzContainer.classList.add('show');
      setTimeout(() => zzzContainer.classList.remove('show'), 2500);

      sparkleLayer.classList.remove('active');
      void sparkleLayer.offsetWidth;
      sparkleLayer.classList.add('active');
      setTimeout(() => sparkleLayer.classList.remove('active'), 5000);
    }, 400);
  }
});

let isDragging = false;
let hasMoved = false;
let startX, startY;
let startWinX, startWinY;

petContainer.addEventListener('mousedown', async (e) => {
  if (e.target === closeBtn) return;
  isDragging = true;
  hasMoved = false;
  startX = e.screenX;
  startY = e.screenY;

  const bounds = await invoke('get_window_bounds');
  startWinX = bounds.x;
  startWinY = bounds.y;

  characterWrapper.style.transition = 'transform 0.15s ease-out';
  characterWrapper.style.transform = 'scale(0.95, 1.05)';
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const dx = e.screenX - startX;
  const dy = e.screenY - startY;

  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
    hasMoved = true;
  }

  invoke('drag_window', {
    x: startWinX + dx + 150,
    y: startWinY + dy + 150
  });

  const parallax = 0.08;
  const maxOffset = 15;
  let offsetX = -dx * parallax;
  let offsetY = -dy * parallax;
  offsetX = Math.max(-maxOffset, Math.min(maxOffset, offsetX));
  offsetY = Math.max(-maxOffset, Math.min(maxOffset, offsetY));
  starsBg.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

  const maxSwing = 15;
  const swing = Math.min(maxSwing, Math.abs(dx) * 0.15);
  const swingDir = dx > 0 ? 1 : -1;
  characterWrapper.style.transform = `rotate(${swing * swingDir}deg)`;
});

document.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;

  starsBg.style.transition = 'transform 0.4s ease-out';
  starsBg.style.transform = 'translate(0, 0)';
  setTimeout(() => {
    starsBg.style.transition = 'transform 0.15s ease-out';
  }, 450);

  characterWrapper.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
  characterWrapper.style.transform = 'rotate(0deg)';

  setTimeout(() => {
    characterWrapper.style.transition = 'transform 0.2s ease-out';
    characterWrapper.style.transform = 'rotate(0deg)';
  }, 300);
});

closeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  invoke('close_app');
});
