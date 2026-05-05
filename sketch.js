let capture;
let facemesh;
let predictions = [];
let blinkFlash = 0;   // 眨眼閃爍強度（0 = 無，255 = 全白）
let particles = [];   // 吸入粒子陣列
let mouthOpen = false;
let mouthScreenX, mouthScreenY; // 嘴巴中心的螢幕座標

function setup() {
  createCanvas(windowWidth, windowHeight);
  mouthScreenX = width / 2;
  mouthScreenY = height / 2;
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

    // 用 #fdf0d5 填滿臉部輪廓外的區域，讓畫面只露出臉部
    let faceOval = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
    let imgL = width / 2 - width * 0.25;
    let imgR = width / 2 + width * 0.25;
    let imgT = height / 2 - height * 0.25;
    let imgB = height / 2 + height * 0.25;
    fill('#fdf0d5');
    noStroke();
    beginShape();
    vertex(imgL, imgT);   // 外框：影像範圍四個角（順時針）
    vertex(imgR, imgT);
    vertex(imgR, imgB);
    vertex(imgL, imgB);
    beginContour();       // 鏤空：臉部輪廓（逆時針，與外框方向相反形成孔洞）
    for (let i = faceOval.length - 1; i >= 0; i--) {
      let pt = mapPt(keypoints[faceOval[i]]);
      vertex(pt.x, pt.y);
    }
    endContour();
    endShape(CLOSE);

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

    // 眨眼偵測：計算左右眼的 EAR（眼眶高度 / 寬度），低於門檻視為眨眼
    // 右眼：上159 下145 左33 右133；左眼：上386 下374 左362 右263
    let rEAR = abs(keypoints[159].y - keypoints[145].y) / abs(keypoints[133].x - keypoints[33].x);
    let lEAR = abs(keypoints[386].y - keypoints[374].y) / abs(keypoints[263].x - keypoints[362].x);
    if (rEAR < 0.2 && lEAR < 0.2) {
      blinkFlash = 255;
    }

    // 嘴巴開合偵測：MAR（嘴唇上下距離 / 嘴角左右距離），超過門檻視為張大嘴
    // 上內唇 13、下內唇 14、左嘴角 61、右嘴角 291
    let mar = abs(keypoints[13].y - keypoints[14].y) / abs(keypoints[291].x - keypoints[61].x);
    mouthOpen = mar > 0.5;

    // 計算嘴巴中心的螢幕座標（local 座標透過 scale(-1,1)+translate(width,0) 換算）
    let mouthCamX = (keypoints[13].x + keypoints[14].x) / 2;
    let mouthCamY = (keypoints[13].y + keypoints[14].y) / 2;
    let mouthLocalX = map(mouthCamX, 0, capture.width,  width  / 2 - width  * 0.25, width  / 2 + width  * 0.25);
    let mouthLocalY = map(mouthCamY, 0, capture.height, height / 2 - height * 0.25, height / 2 + height * 0.25);
    mouthScreenX = width - mouthLocalX; // scale(-1,1) 翻轉後的螢幕 x
    mouthScreenY = mouthLocalY;
  }
  pop(); // 恢復畫布座標狀態

  // 閃爍特效：在整個畫布上疊加白色半透明層，逐幀淡出
  if (blinkFlash > 0) {
    noStroke();
    fill(255, 255, 255, blinkFlash);
    rect(0, 0, width, height);
    blinkFlash -= 18;
  }

  // 吸入粒子特效：嘴張大時生成粒子，持續向嘴巴中心飛去
  if (mouthOpen) {
    for (let i = 0; i < 4; i++) {
      particles.push({
        x: random(width),
        y: random(height),
        size: random(6, 16),
        col: color(random(180, 255), random(80, 200), random(50, 255), 220)
      });
    }
  }

  noStroke();
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    let dx = mouthScreenX - p.x;
    let dy = mouthScreenY - p.y;
    let d = sqrt(dx * dx + dy * dy);

    if (d < 12 || p.size < 1) {
      particles.splice(i, 1);
      continue;
    }

    // 越靠近嘴巴速度越快（引力吸入感）
    let speed = map(d, 0, width, 12, 0.5);
    p.x += (dx / d) * speed;
    p.y += (dy / d) * speed;
    p.size *= 0.96; // 飛行中逐漸縮小

    fill(p.col);
    ellipse(p.x, p.y, p.size);
  }
}
