const uploader = document.getElementById('imageUploader');
const cropOptions = document.getElementById('cropOptions');
const uniformCropDiv = document.getElementById('uniformCropDiv');
const individualCropDiv = document.getElementById('individualCropDiv');
const uniformInput = document.getElementById('uniformHeight');
const generateBtn = document.getElementById('generateBtn');
const downloadLink = document.getElementById('downloadLink');
const resultCanvas = document.getElementById('resultCanvas');
const ctx = resultCanvas.getContext('2d');

let imageFiles = [];

uploader.addEventListener('change', () => {
  imageFiles = Array.from(uploader.files);
  if (imageFiles.length === 0) return;
  cropOptions.style.display = 'block';
  generateIndividualInputs();
});

document.querySelectorAll('input[name="cropMode"]').forEach(input => {
  input.addEventListener('change', () => {
    const mode = getCropMode();
    uniformCropDiv.style.display = mode === 'uniform' ? 'block' : 'none';
    individualCropDiv.style.display = mode === 'individual' ? 'block' : 'none';
  });
});

generateBtn.addEventListener('click', async () => {
  if (imageFiles.length === 0) return alert("請先上傳圖片");

  const imgs = await Promise.all(imageFiles.map(loadImage));
  const mode = getCropMode();

  const targetWidth = Math.max(...imgs.map(img => img.width));

  let totalHeight = imgs[0].height; // 第一張完整保留

  const cropHeights = mode === 'uniform'
    ? imgs.slice(1).map(() => parseInt(uniformInput.value))
    : imgs.slice(1).map((_, i) => {
        const input = document.getElementById(`cropInput${i}`);
        return parseInt(input.value);
      });

  totalHeight += cropHeights.reduce((sum, h) => sum + h, 0);

  resultCanvas.width = targetWidth;
  resultCanvas.height = totalHeight;

  // 繪製第一張圖（完整）
  ctx.drawImage(imgs[0], 0, 0, targetWidth, imgs[0].height);

  // 裁切與繪製其餘圖
  let y = imgs[0].height;

  for (let i = 1; i < imgs.length; i++) {
    const img = imgs[i];
    const cropHeight = cropHeights[i - 1];
    ctx.drawImage(
      img,
      0, img.height - cropHeight, img.width, cropHeight,
      0, y, targetWidth, cropHeight
    );
    y += cropHeight;
  }

  // 顯示下載
  downloadLink.href = resultCanvas.toDataURL("image/png");
  downloadLink.style.display = "inline-block";
});

function getCropMode() {
  return document.querySelector('input[name="cropMode"]:checked').value;
}

function loadImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(file);
  });
}

function generateIndividualInputs() {
  individualCropDiv.innerHTML = "<h3>各圖對白高度(px)：</h3>";
  for (let i = 1; i < imageFiles.length; i++) {
    const label = document.createElement("label");
    label.textContent = `第 ${i+1} 張：`;
    const input = document.createElement("input");
    input.type = "number";
    input.id = `cropInput${i - 1}`;
    input.value = 50;
    input.min = 1;
    label.appendChild(input);
    individualCropDiv.appendChild(label);
    individualCropDiv.appendChild(document.createElement("br"));
  }
}
