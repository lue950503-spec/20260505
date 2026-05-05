let capture;

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.hide(); // 隱藏 p5.js 自動產生的預設 HTML 影片標籤
  imageMode(CENTER); // 設定影像定位點在中心，方便後續置中對齊
}

function draw() {
  background('#e7c6ff');
  // 在畫布正中間繪製影像，寬與高皆設定為畫布寬高的 50%
  image(capture, width / 2, height / 2, width * 0.5, height * 0.5);
}
