// --- 圓的設定 --- // 檔案開始的區塊標頭，說明此處為圓的設定
let circles = []; // 儲存所有圓物件的陣列
let particles = []; // 新增：儲存爆破粒子的陣列
let score = 0; // 新增：遊戲分數
let audioStarted = false; // 新增：記錄是否已啟動 audio context（避免重複呼叫）
// 新增：音效相關全域變數（使用 p5 音訊合成，不需外部檔案）
let popOsc, popNoise, popEnv; // 震盪器、噪聲、包絡
const COLORS = ['#03045e', '#023e8a', '#0077b6', '#0096c7', '#00b4d8']; // 可用顏色陣列
const NUM_CIRCLES = 20; // 圓的數量常數

function setup() { // p5.js 初始化函式
  createCanvas(windowWidth, windowHeight); // 建立全窗格畫布

  // 注意：若使用 HTML 包裝，請在 <head> 或 p5 主檔同目錄引入 p5.sound：
  // <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.6.0/addons/p5.sound.min.js"></script>

  // 初始化音效（合成短促「pop」）
  popOsc = new p5.Oscillator('triangle'); // 基本頻率來源
  popOsc.start();
  popOsc.amp(0); // 由包絡控制音量

  popNoise = new p5.Noise('white'); // 加入白噪聲以增加「爆裂」質感
  popNoise.start();
  popNoise.amp(0);

  popEnv = new p5.Envelope(); // 短促包絡：快速攻擊、快速衰減、無延音
  popEnv.setADSR(0.001, 0.02, 0.0, 0.05);
  popEnv.setRange(0.7, 0);

  // 初始化圓
  circles = []; // 清空 circles 陣列
  particles = []; // 新增：清空 particles 陣列
  for (let i = 0; i < NUM_CIRCLES; i++) { // 根據 NUM_CIRCLES 迴圈建立圓
    circles.push({ // 新增一個圓物件到陣列
      x: random(width), // 隨機 x 座標
      y: random(height), // 隨機 y 座標
      r: random(50, 200), // 隨機半徑 r
      color: color(random(COLORS)), // 隨機顏色
      alpha: random(80, 255), // 隨機透明度
      speed: random(1, 5), // 隨機上升速度
      popped: false,       // 新增：是否已爆破（預設 false）
      respawnTimer: 0      // 新增：爆破後重生計時（預設 0）
    }); // 結束 push 物件
  } // 結束 for 迴圈

  // 新增：建立啟用音效按鈕（放在 setup() 結尾）
  createAudioStartButton();
} // 結束 setup()

function draw() { // p5.js 每幀執行的繪製函式
  background('#caf0f8'); // 清除畫面並填背景色
  noStroke(); // 關閉描邊

  // 左上顯示固定編號 414730506（黑色、字型大小 32px）
  push();
  textSize(32); // 左上文字大小 32px
  fill(0); // 黑色文字
  textAlign(LEFT, TOP);
  text('414730506', 16, 12);
  pop();

  // 右上顯示分數（保持原先顯示位置風格）
  push();
  textSize(20); // 分數大小維持 20
  fill(0); // 黑色文字
  textAlign(RIGHT, TOP);
  text('Score: ' + score, width - 16, 12);
  pop();

  // 更新並繪製粒子
  for (let i = particles.length - 1; i >= 0; i--) { // 反向迭代以安全移除已消失粒子
    let p = particles[i]; // 取出目前粒子
    p.vy += 0.05; // 重力加速度，影響垂直速度
    p.x += p.vx; // 更新粒子 x 座標
    p.y += p.vy; // 更新粒子 y 座標
    p.life--; // 粒子壽命遞減
    push(); // 儲存目前繪圖狀態
    noStroke(); // 粒子無描邊
    fill(red(p.color), green(p.color), blue(p.color), p.life > 0 ? map(p.life, 0, p.maxLife, 0, p.alpha) : 0); // 以顏色與漸逝 alpha 繪製
    ellipse(p.x, p.y, p.size); // 畫出粒子為圓形
    pop(); // 恢復先前繪圖狀態
    if (p.life <= 0) particles.splice(i, 1); // 壽命到則從陣列移除
  } // 結束粒子迴圈

  for (let c of circles) { // 迭代每個圓
    if (!c.popped) { // 若尚未爆破
      c.y -= c.speed; // 圓向上移動（y 減小）

      // 移除自動隨機爆破機率檢查：不再自動爆破，僅由滑鼠掌控

      if (c.y + c.r / 2 < 0) { // 如果圓完全移出畫面頂端
        // 從底部重新出現
        c.y = height + c.r / 2; // 設定 y 回到底部外
        c.x = random(width); // 隨機 x
        c.r = random(50, 200); // 隨機半徑
        c.color = color(random(COLORS)); // 隨機顏色
        c.alpha = random(80, 255); // 隨機透明度
        c.speed = random(1, 5); // 隨機速度
      } // 結束邊界重生判斷

      c.color.setAlpha(c.alpha); // 設定顏色的透明度
      fill(c.color); // 設定填色為圓的顏色
      circle(c.x, c.y, c.r); // 繪製圓形

      // 在圓的右上方1/4圓的中間產生星形（保留原有星形）
      let squareSize = c.r / 6; // 計算星形大小基準
      let angle = -PI / 4; // 右上 45 度角
      let distance = c.r / 2 * 0.65; // 距離圓心的距離
      let squareCenterX = c.x + cos(angle) * distance; // 星形中心 x 座標
      let squareCenterY = c.y + sin(angle) * distance; // 星形中心 y 座標
      // 改為畫白色透明星形
      push(); // 儲存繪圖狀態
      fill(255, 255, 255, 120); // 設定為白色半透明
      noStroke(); // 無描邊
      // drawStar(cx, cy, outerRadius, points, innerRatio)
      drawStar(squareCenterX, squareCenterY, squareSize * 0.9, 5, 0.45); // 繪製星形
      pop(); // 恢復繪圖狀態

    } else { // 若已爆破
      // 已爆破：等待重生
      c.respawnTimer--; // 重生計時遞減
      if (c.respawnTimer <= 0) { // 計時到則重生
        respawnCircle(c); // 呼叫重生函式
      } // 結束重生判斷
    } // 結束 popped 判斷
  } // 結束圓的迴圈
} // 結束 draw()

function triggerBurst(c) { // 觸發爆破並產生粒子
  // 播放爆破音效（依氣球大小改變音色）
  playPopSound(c);
  
  // 產生爆破粒子數量與特性
  let count = floor(map(c.r, 50, 200, 8, 24)); // 根據半徑決定粒子數
  for (let i = 0; i < count; i++) { // 產生 count 個粒子
    let ang = random(TWO_PI); // 粒子飛出的隨機角度
    let speed = random(1, 6) * (c.r / 120); // 粒子初速與圓大小相關
    particles.push({ // 推入新粒子物件
      x: c.x + cos(ang) * random(0, c.r / 4), // 粒子起始 x（靠近圓心）
      y: c.y + sin(ang) * random(0, c.r / 4), // 粒子起始 y（靠近圓心）
      vx: cos(ang) * speed, // 初始 x 速度
      vy: sin(ang) * speed, // 初始 y 速度
      size: random(3, 10), // 粒子尺寸
      life: floor(random(30, 90)), // 粒子壽命（幀）
      maxLife: 0, // 會在下一行設定為生命上限
      color: c.color, // 粒子顏色沿用圓的顏色
      alpha: c.alpha // 粒子透明度沿用圓的透明度
    }); // 結束 push 粒子物件
    particles[particles.length - 1].maxLife = particles[particles.length - 1].life; // 設定 maxLife 為當前 life
  } // 結束粒子建立迴圈
  // 標記氣球為已爆破，並設定重生時間（frame數）
  c.popped = true; // 標記已爆破
  c.respawnTimer = floor(random(40, 120)); // 設定隨機重生時間
  // 隱藏氣球（設定透明或半徑為0）
  c.alpha = 0; // 將透明度設為 0 以隱藏圓
} // 結束 triggerBurst()

function respawnCircle(c) { // 重生圓的函式
  c.x = random(width); // 隨機 x
  c.y = height + c.r / 2; // 放到畫面底部外
  c.r = random(50, 200); // 隨機半徑
  c.color = color(random(COLORS)); // 隨機顏色
  c.alpha = random(80, 255); // 隨機透明度
  c.speed = random(1, 5); // 隨機速度
  c.popped = false; // 重置為未爆破
  c.respawnTimer = 0; // 重置重生計時
} // 結束 respawnCircle()

// 新增：畫星形的輔助函式
function drawStar(cx, cy, outerR, points, innerRatio) { // 繪製星形的通用函式
  innerRatio = (typeof innerRatio === 'number') ? innerRatio : 0.5; // 若未提供 innerRatio 使用預設
  let total = points * 2; // 星形點總數（外點 + 內點）
  let angStep = TWO_PI / total; // 每段角度間隔
  beginShape(); // 開始自訂形狀
  for (let i = 0; i < total; i++) { // 迭代每個頂點
    let r = (i % 2 === 0) ? outerR : outerR * innerRatio; // 偶數外半徑、奇數內半徑
    let a = -HALF_PI + i * angStep; // 旋轉起點位於上方（-90 度）
    vertex(cx + cos(a) * r, cy + sin(a) * r); // 加入頂點
  } // 結束頂點迴圈
  endShape(CLOSE); // 結束形狀並封閉
} // 結束 drawStar()

function windowResized() { // 畫面縮放時呼叫
  resizeCanvas(windowWidth, windowHeight); // 調整畫布大小
  // 重新分布圓的位置
  for (let c of circles) { // 對每個圓重新隨機配置位置
    c.x = random(width); // 隨機 x
    c.y = random(height); // 隨機 y
  } // 結束重新分布
} // 結束 windowResized()

// 新增：播放合成爆破音效的函式
function playPopSound(c) {
  // 根據氣球大小調整頻率與白噪聲比例
  let sizeFactor = constrain(map(c.r, 50, 200, 1.5, 0.6), 0.6, 1.5); // 大小倍率
  let freq = random(600 * sizeFactor, 1200 * sizeFactor); // 主要頻率
  popOsc.freq(freq, 0.01); // 平滑設定頻率

  // 設定基礎音量（讓 Envelope 可以控制音量包絡）
  // 噪聲音量隨尺寸改變（較大氣球噪聲比重較高）
  let noiseLevel = map(sizeFactor, 0.6, 1.5, 0.02, 0.18);
  popNoise.amp(noiseLevel, 0.01); // 漸進設定 noise amp
  popOsc.amp(0.02, 0.01); // 設定小基礎 amp，交由包絡控制

  // 使用包絡觸發兩個聲源
  popEnv.play(popOsc);
  popEnv.play(popNoise);
}

// 新增：滑鼠按下時，若點到未爆破氣球則爆破並加分
function mousePressed() {
  // 由上到下檢查氣球（找到第一個被點中的氣球就處理）
  for (let i = 0; i < circles.length; i++) {
    let c = circles[i];
    if (!c.popped) { // 只有未爆破的氣球可被點破
      let d = dist(mouseX, mouseY, c.x, c.y); // 計算滑鼠到圓心距離
      let radius = c.r / 2; // c.r 為直徑，半徑為 r/2
      if (d <= radius) { // 若點在氣球內
        // 依顏色加分：#0077b6 加 1 分，#03045e 加 2 分
        let cr = round(red(c.color)); // 顏色 red 分量
        let cg = round(green(c.color)); // 顏色 green 分量
        let cb = round(blue(c.color)); // 顏色 blue 分量
        if (cr === 0 && cg === 119 && cb === 182) {
          score += 1; // #0077b6
        } else if (cr === 3 && cg === 4 && cb === 94) {
          score += 2; // #03045e
        }
        // 觸發爆破（會產生粒子、音效並標記為 popped）
        triggerBurst(c);
        break; // 處理完第一個被點中的氣球就離開迴圈
      }
    }
  }
}

// 新增：建立頁面上的「點我啟用音效」按鈕，點擊後啟動 audio context 並隱藏按鈕
function createAudioStartButton() {
  // 使用 p5 DOM 建立按鈕
  const btn = createButton('點我啟用音效'); // 按鈕文字
  btn.id('audioStartBtn'); // 設定 id
  // 簡單樣式（可自行調整）
  btn.style('position', 'absolute');
  btn.style('left', '50%');
  btn.style('transform', 'translateX(-50%)');
  btn.style('top', '8px');
  btn.style('padding', '8px 12px');
  btn.style('background', '#ffffff');
  btn.style('border', '1px solid #ccc');
  btn.style('border-radius', '6px');
  btn.style('font-size', '14px');
  btn.style('z-index', '1000');

  // 點擊事件：以 user gesture 啟動 audio context（不同瀏覽器兼容）
  btn.mousePressed(async () => {
    try {
      if (typeof userStartAudio === 'function') {
        await userStartAudio(); // p5 建議的啟動方式
      } else if (typeof getAudioContext === 'function') {
        const ac = getAudioContext();
        if (ac && ac.state === 'suspended' && typeof ac.resume === 'function') {
          await ac.resume();
        }
      }
    } catch (e) {
      // 忽略啟動錯誤
    }
    audioStarted = true; // 標記已啟動
    btn.hide(); // 隱藏按鈕


  });
}

