let capture;
let facemesh;
let predictions = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.hide(); // 隱藏 p5.js 自動產生的預設 HTML 影片標籤
  imageMode(CENTER); // 設定影像定位點在中心，方便後續置中對齊

  // ml5.js v1.x API: faceMesh（注意大寫 M）
  facemesh = ml5.faceMesh({ maxFaces: 1 }, modelReady);
}

function modelReady() {
  console.log("Facemesh model loaded!");
  facemesh.detectStart(capture, gotFaces);
}

function gotFaces(results) {
  predictions = results;
}

function draw() {
  background('#e7c6ff');

  // 在影像上方顯示文字（寫在 push/pop 之外，避免文字被左右顛倒）
  fill(0); // 設定文字顏色為黑色
  textSize(32); // 設定文字大小
  textAlign(CENTER, CENTER); // 設定文字對齊方式為置中
  text('教科414730936', width / 2, height * 0.15); // 將文字繪製在畫布上方 (約 15% 高度處)

  push(); // 儲存目前的畫布座標狀態
  translate(width, 0); // 將座標原點移至畫布右側
  scale(-1, 1); // 水平翻轉影像（左右顛倒），垂直不變
  // 在畫布正中間繪製影像，寬與高皆設定為畫布寬高的 50%
  image(capture, width / 2, height / 2, width * 0.5, height * 0.5);

  // 繪製 facemesh 特徵點
  if (predictions.length > 0 && capture.width > 0) {
    let keypoints = predictions[0].keypoints;

    // 將攝影機座標映射到畫布上影像的對應位置
    function mapPt(pt) {
      return {
        x: map(pt.x, 0, capture.width,  width  / 2 - width  * 0.25, width  / 2 + width  * 0.25),
        y: map(pt.y, 0, capture.height, height / 2 - height * 0.25, height / 2 + height * 0.25)
      };
    }

    // 依照給定的索引陣列與顏色，繪製封閉輪廓線
    function drawContour(indices, col) {
      stroke(col);
      for (let i = 0; i < indices.length; i++) {
        let a = mapPt(keypoints[indices[i]]);
        let b = mapPt(keypoints[indices[(i + 1) % indices.length]]);
        line(a.x, a.y, b.x, b.y);
      }
    }

    strokeWeight(3);
    noFill();

    // 嘴唇（紅色）
    drawContour([409, 270, 269, 267, 0, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291], color(255, 0, 0));

    // 左眼（藍色）— MediaPipe 左眼輪廓索引
    drawContour([362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398], color(0, 100, 255));

    // 右眼（金色）— MediaPipe 右眼輪廓索引
    drawContour([33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246], color(255, 200, 0));

    // 臉部外輪廓（藍色，線條粗細 2）
    strokeWeight(2);
    drawContour([10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109], color(0, 0, 255));
  }
  pop(); // 恢復畫布座標狀態
}
