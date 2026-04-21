let capture;
let pg;
let bubbles = []; // 新增：用來存放所有泡泡物件的陣列

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 取得攝影機影像
  capture = createCapture(VIDEO);
  
  // 隱藏 p5.js 預設產生的 HTML 影片元素，讓我們只將畫面繪製在畫布上
  capture.hide(); 
  
  // 設定影像繪製模式為「中心點」，方便後續將影像置中
  imageMode(CENTER);

  // 建立圖形緩衝區 (Graphics) 先給予預設長寬
  pg = createGraphics(640, 480);

  // 增加泡泡數量：產生 100 個初始的泡泡物件，讓效果更豐富
  for (let i = 0; i < 100; i++) {
    bubbles.push(new Bubble());
  }
}

function draw() {
  // 設定畫布背景顏色
  background('#e7c6ff');
  
  // 計算全螢幕寬高 60% 的尺寸
  let imgW = width * 0.6;
  let imgH = height * 0.6;
  
  // 確保 pg 的解析度與攝影機的實際解析度保持同步
  if (capture.width > 0 && (pg.width !== capture.width || pg.height !== capture.height)) {
    pg.resizeCanvas(capture.width, capture.height);
  }

  // --- 在 pg 上繪製你要疊加的內容 ---
  pg.clear(); // 重要：每一幀都清除背景，保持圖層透明

  // 載入攝影機的像素資料以供讀取
  capture.loadPixels();
  if (capture.pixels.length > 0) {
    let step = 20; // 設定馬賽克區塊的長寬為 20 單位
    pg.noStroke(); // 不要繪製方塊邊框

    for (let y = 0; y < capture.height; y += step) {
      for (let x = 0; x < capture.width; x += step) {
        let index = (y * capture.width + x) * 4;
        let r = capture.pixels[index];
        let g = capture.pixels[index + 1];
        let b = capture.pixels[index + 2];
        
        let gray = (r + g + b) / 3; // 計算 RGB 的平均值，取得灰階數字
        
        pg.fill(gray); // 設定該單位的顏色為算出的灰階值
        pg.rect(x, y, step, step); // 畫出 20x20 的馬賽克方塊
      }
    }
  }
  // -----------------------------

  // 解決左右顛倒的問題：利用 push/pop 隔離畫布變形狀態
  push();
  translate(width / 2, height / 2); // 將座標原點移動到畫面正中間
  scale(-1, 1); // 進行水平翻轉（X 軸乘以 -1）
  // 因為原點已移至中心，且有設定 imageMode(CENTER)，所以座標直接設為 (0, 0)
  image(capture, 0, 0, imgW, imgH);
  // 將圖形緩衝區 pg 也繪製出來，就能完美疊加在視訊上方
  image(pg, 0, 0, imgW, imgH);
  pop();

  // 繪製並更新所有的泡泡 (疊加在視訊與背景的最上層)
  // 改為反向迴圈，以便在泡泡破掉時安全移除陣列元素
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].display();

    // 增加互動：當滑鼠碰到泡泡時，泡泡會破掉並從畫面底部重新產生
    if (dist(mouseX, mouseY, bubbles[i].x, bubbles[i].y) < bubbles[i].r) {
      bubbles.splice(i, 1); // 移除被碰到的泡泡
      bubbles.push(new Bubble(true)); // 在底部補充一顆新泡泡
    }
  }
}

// 當使用者改變瀏覽器視窗大小時，自動重新調整畫布大小，維持全螢幕與比例
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// --- 新增：泡泡的類別 ---
class Bubble {
  constructor(fromBottom = false) {
    this.x = random(width);
    this.y = fromBottom ? height + random(10, 50) : random(height, height + 200); // 讓新產生的泡泡緊貼著底部出現
    this.r = random(5, 20); // 隨機產生泡泡半徑大小
    this.speedY = random(1, 3); // 往上飄移的隨機速度
    this.noiseOffsetX = random(0, 1000); // 產生 Perlin Noise 的位移，讓左右飄動更自然
  }

  update() {
    this.y -= this.speedY; // 向上移動
    // 使用 p5.js 的 noise 函數來計算平滑的左右飄動
    this.x += map(noise(this.noiseOffsetX), 0, 1, -1, 1);
    this.noiseOffsetX += 0.01;

    // 當泡泡完全飄出畫面上方時，讓它從底部重新出發
    if (this.y < -this.r * 2) {
      this.y = height + random(10, 100);
      this.x = random(width);
    }
  }

  display() {
    noStroke();
    // 畫泡泡本體（半透明白色）
    fill(255, 255, 255, 120);
    circle(this.x, this.y, this.r * 2);
    
    // 畫泡泡左上方的高光反光（較小、較白），增加立體感
    fill(255, 255, 255, 200);
    circle(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.5);
  }
}
