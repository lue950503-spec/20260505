let capture;

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.hide(); // 隱藏 p5.js 自動產生的預設 HTML 影片標籤
  imageMode(CENTER); // 設定影像定位點在中心，方便後續置中對齊
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
  scale(1, 1); // 水平翻轉影像（左右顛倒），垂直不變
  // 在畫布正中間繪製影像，寬與高皆設定為畫布寬高的 50%
  image(capture, width / 2, height / 2, width * 0.5, height * 0.5);
  pop(); // 恢復畫布座標狀態
}
