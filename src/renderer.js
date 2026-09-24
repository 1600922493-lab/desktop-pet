// ===== 等待 Tauri IPC 就绪 =====
let invoke = null;
let ipcReady = false;

function setupIPC() {
  return new Promise((resolve) => {
    if (window.__TAURI__?.core?.invoke) {
      invoke = window.__TAURI__.core.invoke.bind(window.__TAURI__.core);
      ipcReady = true;
      console.log('[桌宠] IPC 就绪 (立即)');
      return resolve();
    }
    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      if (window.__TAURI__?.core?.invoke) {
        clearInterval(poll);
        invoke = window.__TAURI__.core.invoke.bind(window.__TAURI__.core);
        ipcReady = true;
        console.log('[桌宠] IPC 就绪 (第', attempts, '次轮询)');
        resolve();
      }
      if (attempts > 100) {
        clearInterval(poll);
        console.error('[桌宠] IPC 超时! __TAURI__:', JSON.stringify(Object.keys(window.__TAURI__ || {})));
        resolve();
      }
    }, 50);
  });
}

// ===== DOM 元素 =====
const closeBtn = document.getElementById('closeBtn');
const zzzContainer = document.getElementById('zzz');
const starsBg = document.getElementById('starsBg');
const petContainer = document.getElementById('pet-container');
const sparkleLayer = document.getElementById('sparkleLayer');
const character = document.querySelector('.breathing');
const characterWrapper = document.getElementById('characterWrapper');
const animVideo = document.getElementById('animVideo');
const animContainer = document.getElementById('animContainer');
const hearts = document.getElementById('hearts');

// ===== 初始化 =====
setupIPC().then(() => {
  console.log('[桌宠] 初始化完成, invoke类型:', typeof invoke);

  // 关闭按钮
  closeBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    console.log('[桌宠] 关闭按钮被点击, invoke:', typeof invoke);
    if (invoke) {
      try {
        await invoke('close_app');
      } catch (err) {
        console.error('[桌宠] close_app 失败:', err);
        window.close();
      }
    } else {
      window.close();
    }
  });
});

// ===== 双击/单击（不需要 IPC，立即绑定）=====
let clickTimer = null;
let lastClickTime = 0;

// 回到第一帧并暂停，避免下次播放时残留上一轮的结尾画面
animVideo.addEventListener('loadeddata', () => {
  try { animVideo.currentTime = 0; } catch (_) {}
  animVideo.pause();
});

petContainer.addEventListener('click', (e) => {
  if (e.target === closeBtn) return;

  const now = Date.now();
  const timeSinceLastClick = now - lastClickTime;
  lastClickTime = now;

  if (timeSinceLastClick < 400) {
    clearTimeout(clickTimer);

    // 显示容器前先把视频归零，避免闪现上次的残留帧
    animVideo.pause();
    try { animVideo.currentTime = 0; } catch (_) {}

    animContainer.style.display = 'block';

    character.style.transition = 'opacity 0.3s ease';
    character.style.opacity = '0';
    animContainer.style.transition = 'opacity 0.3s ease';
    animContainer.style.opacity = '1';

    const playPromise = animVideo.play();
    if (playPromise) {
      playPromise.catch(err => console.error('[桌宠] 播放失败:', err));
    }

    setTimeout(() => {
      hearts.classList.add('show');
      setTimeout(() => { hearts.classList.remove('show'); }, 4000);
    }, 2000);

    animVideo.onended = () => {
      hearts.classList.remove('show');
      character.style.transition = 'opacity 0.3s ease';
      character.style.opacity = '1';
      animContainer.style.transition = 'opacity 0.3s ease';
      animContainer.style.opacity = '0';
      setTimeout(() => {
        animContainer.style.display = 'none';
        animVideo.currentTime = 0;
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

// ===== 拖拽 =====
let isDragging = false;
let startX, startY, startWinX, startWinY;

petContainer.addEventListener('mousedown', async (e) => {
  if (e.target === closeBtn) return;
  isDragging = true;
  startX = e.screenX;
  startY = e.screenY;

  if (invoke) {
    try {
      const bounds = await invoke('get_window_bounds');
      startWinX = bounds.x;
      startWinY = bounds.y;
    } catch (err) {
      console.error('[桌宠] 获取位置失败:', err);
      startWinX = 0; startWinY = 0;
    }
  }

  characterWrapper.style.transition = 'transform 0.15s ease-out';
  characterWrapper.style.transform = 'scale(0.95, 1.05)';
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const dx = e.screenX - startX;
  const dy = e.screenY - startY;

  if (invoke) {
    invoke('drag_window', {
      x: startWinX + dx + 150,
      y: startWinY + dy + 150,
    }).catch(err => console.error('[桌宠] 拖拽失败:', err));
  }

  const maxOffset = 15;
  let offsetX = Math.max(-maxOffset, Math.min(maxOffset, -dx * 0.08));
  let offsetY = Math.max(-maxOffset, Math.min(maxOffset, -dy * 0.08));
  starsBg.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

  const swing = Math.min(15, Math.abs(dx) * 0.15);
  const swingDir = dx > 0 ? 1 : -1;
  characterWrapper.style.transform = `rotate(${swing * swingDir}deg)`;
});

document.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  starsBg.style.transition = 'transform 0.4s ease-out';
  starsBg.style.transform = 'translate(0, 0)';
  setTimeout(() => { starsBg.style.transition = 'transform 0.15s ease-out'; }, 450);
  characterWrapper.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
  characterWrapper.style.transform = 'rotate(0deg)';
  setTimeout(() => {
    characterWrapper.style.transition = 'transform 0.2s ease-out';
    characterWrapper.style.transform = 'rotate(0deg)';
  }, 300);
});
