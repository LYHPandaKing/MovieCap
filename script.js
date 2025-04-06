const uploader = document.getElementById('imageUploader');
const previewContainer = document.getElementById('previewContainer');
const generateBtn = document.getElementById('generateBtn');
const resultCanvas = document.getElementById('resultCanvas');
const downloadLink = document.getElementById('downloadLink');

let images = [];
let coverImageIndex = null;

uploader.addEventListener('change', async () => {
  images = await Promise.all(Array.from(uploader.files).map(loadImage));
  previewContainer.innerHTML = '';
  resultCanvas.style.display = 'none';
  downloadLink.style.display = 'none';

  images.forEach((img, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'preview-wrapper';

    const imageElem = document.createElement('img');
    imageElem.src = img.src;
    imageElem.className = 'preview-img';

    wrapper.appendChild(imageElem);

    if (index === 0) {
      imageElem.style.cursor = 'pointer';
      imageElem.addEventListener('click', () => setCoverImage(index, wrapper));
    } else {
      const topLine = document.createElement('div');
      topLine.className = 'crop-line top';
      topLine.style.top = '60%';

      const bottomLine = document.createElement('div');
      bottomLine.className = 'crop-line bottom';
      bottomLine.style.top = '95%';

      const topMask = document.createElement('div');
      topMask.className = 'mask top-mask';

      const bottomMask = document.createElement('div');
      bottomMask.className = 'mask bottom-mask';

      wrapper.appendChild(topMask);
      wrapper.appendChild(bottomMask);
      wrapper.appendChild(topLine);
      wrapper.appendChild(bottomLine);

      setupCropDrag(topLine, bottomLine, wrapper, topMask, bottomMask);
      updateMasks(wrapper, topLine, bottomLine, topMask, bottomMask);
    }

    previewContainer.appendChild(wrapper);
  });

  if (images.length > 0) generateBtn.style.display = 'inline-block';
});

function loadImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      img.originalFile = file;
      resolve(img);
    };
    img.src = URL.createObjectURL(file);
  });
}

function setCoverImage(index, wrapper) {
  coverImageIndex = index;

  const coverImage = wrapper.querySelector('.preview-img');
  const topLine = document.createElement('div');
  topLine.className = 'crop-line top';
  topLine.style.top = '60%';

  const bottomLine = document.createElement('div');
  bottomLine.className = 'crop-line bottom';
  bottomLine.style.top = '95%';

  const topMask = document.createElement('div');
  topMask.className = 'mask top-mask';

  const bottomMask = document.createElement('div');
  bottomMask.className = 'mask bottom-mask';

  wrapper.appendChild(topMask);
  wrapper.appendChild(bottomMask);
  wrapper.appendChild(topLine);
  wrapper.appendChild(bottomLine);

  setupCropDrag(topLine, bottomLine, wrapper, topMask, bottomMask);
  updateMasks(wrapper, topLine, bottomLine, topMask, bottomMask);
}

function setupCropDrag(topLine, bottomLine, container, topMask, bottomMask) {
  let activeLine = null;
  const containerHeight = container.offsetHeight;

  const onMove = (e) => {
    if (!activeLine) return;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - container.getBoundingClientRect().top;
    const percent = Math.min(100, Math.max(0, (y / containerHeight) * 100));
    activeLine.style.top = `${percent}%`;
    updateMasks(container, topLine, bottomLine, topMask, bottomMask);
  };

  const stopDrag = () => { activeLine = null; };

  [topLine, bottomLine].forEach(line => {
    line.addEventListener('mousedown', () => activeLine = line);
    line.addEventListener('touchstart', () => activeLine = line);
  });

  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchend', stopDrag);
}

function updateMasks(container, topLine, bottomLine, topMask, bottomMask) {
  const containerHeight = container.offsetHeight;
  const topY = parseFloat(topLine.style.top) / 100 * containerHeight;
  const bottomY = parseFloat(bottomLine.style.top) / 100 * containerHeight;

  topMask.style.top = '0px';
  topMask.style.height = `${topY}px`;

  bottomMask.style.top = `${bottomY}px`;
  bottomMask.style.height = `${containerHeight - bottomY}px`;
}

generateBtn.addEventListener('click', async () => {
  const canvas = resultCanvas;
  const ctx = canvas.getContext('2d');
  const targetWidth = Math.max(...images.map(img => img.width));

  let totalHeight = images[0].height;
  const cropHeights = [];

  const previewWrappers = document.querySelectorAll('.preview-wrapper');
  for (let i = 1; i < images.length; i++) {
    const wrapper = previewWrappers[i];
    const topPercent = parseFloat(wrapper.querySelector('.crop-line.top').style.top);
    const bottomPercent = parseFloat(wrapper.querySelector('.crop-line.bottom').style.top);
    const height = images[i].height;
    const y1 = Math.round((topPercent / 100) * height);
    const y2 = Math.round((bottomPercent / 100) * height);
    cropHeights.push({ y1, y2, h: y2 - y1 });
    totalHeight += (y2 - y1);
  }

  const coverImg = images[coverImageIndex];
  const coverWrapper = previewWrappers[coverImageIndex];
  const topLine = coverWrapper.querySelector('.crop-line.top');
  const topPercent = parseFloat(topLine.style.top);
  const coverHeight = coverImg.height;
  const y1 = Math.round((topPercent / 100) * coverHeight);
  const coverY = coverHeight - y1;
  canvas.width = targetWidth;
  canvas.height = totalHeight + coverY;

  ctx.drawImage(coverImg, 0, y1, targetWidth, coverY);

  let y = coverY;

  for (let i = 1; i < images.length; i++) {
    const { y1, h } = cropHeights[i - 1];
    ctx.drawImage(images[i], 0, y1, targetWidth, h, 0, y, targetWidth, h);
    y += h;
  }

  canvas.style.display = 'block';
  downloadLink.href = canvas.toDataURL('image/png');
  downloadLink.style.display = 'inline-block';
});
