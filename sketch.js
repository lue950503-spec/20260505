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
    let indices = [409, 270, 269, 267, 0, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];

    stroke(255, 0, 0); // 設定線條為紅色
    strokeWeight(15); // 設定線條粗細為 15

    // 利用 line 指令將特徵點串接在一起
    for (let i = 0; i < indices.length; i++) {
      let pt1 = keypoints[indices[i]];
      let pt2 = keypoints[indices[(i + 1) % indices.length]]; // 連接下一個點，最後一個點連回開頭形成封閉嘴唇

      let x1 = pt1.x;
      let y1 = pt1.y;
      let x2 = pt2.x;
      let y2 = pt2.y;

      // 將座標映射到與影像相同比例與位置上 (50% 置中)
      let mappedX1 = map(x1, 0, capture.width, width / 2 - width * 0.25, width / 2 + width * 0.25);
      let mappedY1 = map(y1, 0, capture.height, height / 2 - height * 0.25, height / 2 + height * 0.25);
      let mappedX2 = map(x2, 0, capture.width, width / 2 - width * 0.25, width / 2 + width * 0.25);
      let mappedY2 = map(y2, 0, capture.height, height / 2 - height * 0.25, height / 2 + height * 0.25);
      
      line(mappedX1, mappedY1, mappedX2, mappedY2);
    }
  }
  pop(); // 恢復畫布座標狀態
}
