// =============================================
// ui.js — 화면에 보이는 정보
// =============================================

let notifications = [];

function showNotification(playerId, msg, color) {
  notifications.push({ playerId, msg, color, timer: 120 }); 
  if (notifications.length > 3) notifications.shift();
}

function drawUI(p, phase, timeLeft, counts) {
  p.push();
  p.textFont('monospace');

  const hudH = 44;
  p.noStroke();
  p.fill(0, 0, 0, 210);
  p.rect(0, 0, CANVAS_W, hudH);

  const totalTiles = ROWS * COLS;
  const barX = 10, barY = 28, barW = CANVAS_W - 20, barH = 10;

  p.fill(40);
  p.rect(barX, barY, barW, barH, 5);

  if (phase === PHASE_COOP || phase === PHASE_SOLO) {
    const w = Math.max(2, (counts.team / totalTiles) * barW);
    p.fill(COLOR_TEAM);
    p.rect(barX, barY, w, barH, 5);
  } else {
    const wA = Math.max(0, (counts.A / totalTiles) * barW);
    const wB = Math.max(0, (counts.B / totalTiles) * barW);
    if (wA > 0) { p.fill(COLOR_A); p.rect(barX, barY, wA, barH, 5, 0, 0, 5); }
    if (wB > 0) { p.fill(COLOR_B); p.rect(barX + barW - wB, barY, wB, barH, 0, 5, 5, 0); }
    p.fill(COLOR_A); p.textSize(10); p.textAlign(p.LEFT, p.CENTER);
    p.text(`A: ${counts.A}`, barX, 14);
    p.fill(COLOR_B); p.textAlign(p.RIGHT, p.CENTER);
    p.text(`B: ${counts.B}`, barX + barW, 14);
  }

  // [상단 타임바 동기화 활성화] 
  // 전체 게임 세팅값과 비교 연산하여 유기적으로 바가 줄어들게 처리 완료
  const currentMaxDuration = (phase === PHASE_SOLO) ? (SOLO_TIME_LIMIT * FRAME_RATE) : (GAME_TOTAL_TIME * FRAME_RATE);
  const progressRatio = gameTimer / currentMaxDuration;
  const timeFraction = Math.max(0, Math.min(1, progressRatio));
  
  p.fill(30);
  p.rect(0, 0, CANVAS_W, 4);
  p.fill(timeFraction > 0.3 ? '#4CAF50' : timeFraction > 0.1 ? '#FF9800' : '#F44336');
  p.rect(0, 0, CANVAS_W * timeFraction, 4);

  // 타이머 텍스트 렌더링
  const displayTime = (phase === PHASE_SOLO) ? (soloTimer / FRAME_RATE) : timeLeft;
  const mins = Math.floor(Math.max(0, displayTime) / 60);
  const secs = Math.floor(Math.max(0, displayTime) % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  p.textAlign(p.CENTER, p.CENTER);
  if (phase === PHASE_BETRAYAL) {
    p.fill(timeLeft < 10 ? (p.frameCount % 10 < 5 ? '#FF1744' : '#FF8A80') : '#FF5252');
    p.textSize(14);
    p.text(`⚠ 배신전 ${timeStr} ⚠`, CANVAS_W / 2, 14);
  } else if (phase === PHASE_SOLO) {
    p.fill('#FF9800');
    p.textSize(13);
    p.text(`⏱ 위기 상황! ${timeStr}`, CANVAS_W / 2, 14);
  } else {
    p.fill(220);
    p.textSize(13);
    p.text(timeStr, CANVAS_W / 2, 14);
  }

  p.textSize(9); p.textAlign(p.CENTER, p.BOTTOM);
  if (phase === PHASE_COOP)     { p.fill('#4CAF50'); p.text('[ 협력 페이즈 - 좀비를 저지하세요 ]', CANVAS_W/2, 42); }
  else if (phase === PHASE_SOLO){ p.fill('#FF9800'); p.text('[ 서바이벌 페이즈 - 팀원 사망! 버텨야 합니다 ]', CANVAS_W/2, 42); }
  else if (phase === PHASE_BETRAYAL){ p.fill('#FF5252'); p.text('[ 배신 페이즈 - 땅이 더 많은 자가 승리합니다 ]', CANVAS_W/2, 42); }

  if (phase === PHASE_BETRAYAL) {
    const alpha = 80 + Math.sin(p.frameCount * 0.1) * 40;
    p.noFill(); p.stroke(255, 50, 50, alpha); p.strokeWeight(4);
    p.rect(2, 2, CANVAS_W - 4, CANVAS_H - 4); p.noStroke();
  }

  _drawPlayerStatus(p, playerA, 10, hudH + 4, 'A');
  _drawPlayerStatus(p, playerB, CANVAS_W - 10, hudH + 4, 'B');

  if (zombieBloodTimer > 0) {
    p.fill('#E53935'); p.textSize(10); p.textAlign(p.CENTER, p.TOP);
    p.text(`🩸 좀비 폭주 폭발! ${Math.ceil(zombieBloodTimer/FRAME_RATE)}초`, CANVAS_W/2, hudH + 4);
  }

  _drawNotifications(p);
  p.pop();
}

function _drawPlayerStatus(p, player, x, y, label) {
  if (!player) return;
  p.textSize(10); p.noStroke();
  const icons = [];
  if (player.boostTimer > 0) icons.push(`⚡${Math.ceil(player.boostTimer/FRAME_RATE)}s`);
  if (player.steelTailTimer > 0) icons.push(`🛡${Math.ceil(player.steelTailTimer/FRAME_RATE)}s`);
  const col = (label === 'A') ? COLOR_A : COLOR_B;
  p.fill(col);
  p.textAlign(label === 'A' ? p.LEFT : p.RIGHT, p.TOP);
  p.text(`P${label} ${!player.alive ? '💀' : '●'} ${icons.join(' ')}`, x, y);
}

function _drawNotifications(p) {
  for (let i = notifications.length - 1; i >= 0; i--) {
    const n = notifications[i];
    n.timer--;
    if (n.timer <= 0) { notifications.splice(i, 1); continue; }
    const alpha = Math.min(255, n.timer * 4);
    const yPos = CANVAS_H - 30 - (notifications.length - 1 - i) * 24;
    p.noStroke();
    p.fill(0, 0, 0, alpha * 0.6);
    p.rect(10, yPos - 10, CANVAS_W - 20, 20, 4);
    p.fill(p.red(p.color(n.color)), p.green(p.color(n.color)), p.blue(p.color(n.color)), alpha);
    p.textSize(11); p.textAlign(p.CENTER, p.CENTER);
    p.text(n.msg, CANVAS_W / 2, yPos);
  }
}

function drawResultScreen(p, counts, winner) {
  p.fill(0, 0, 0, 200); p.rect(0, 0, CANVAS_W, CANVAS_H);
  const cx = CANVAS_W / 2, cy = CANVAS_H / 2;
  p.fill(20, 20, 30, 240); p.stroke(80); p.strokeWeight(1);
  p.rect(cx - 200, cy - 130, 400, 260, 12);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(22); p.fill(255); p.text('게임 종료', cx, cy - 100);
  p.textSize(26);
  if (winner === 'A')      { p.fill(COLOR_A); p.text('플레이어 A 승리! 🏆', cx, cy - 55); }
  else if (winner === 'B') { p.fill(COLOR_B); p.text('플레이어 B 승리! 🏆', cx, cy - 55); }
  else if (winner === 'draw') { p.fill('#FFD600'); p.text('무승부!', cx, cy - 55); }
  else { p.fill('#AB47BC'); p.text('좀비의 승리... 😱', cx, cy - 55); }
  p.textSize(14);
  p.fill(COLOR_A); p.text(`A 영역: ${counts.A} 타일`, cx, cy - 10);
  p.fill(COLOR_B); p.text(`B 영역: ${counts.B} 타일`, cx, cy + 15);
  p.fill(50, 50, 70); p.stroke(120); p.strokeWeight(1);
  p.rect(cx - 80, cy + 60, 160, 38, 8);
  p.noStroke(); p.fill(200); p.textSize(14);
  p.text('다시 시작 (R)', cx, cy + 82);
}

let betrayalAnnounceFade = 0;
function showBetrayalAnnounce(p) { betrayalAnnounceFade = 90; }
function drawBetrayalAnnounce(p) {
  if (betrayalAnnounceFade <= 0) return;
  betrayalAnnounceFade--;
  const alpha = Math.min(255, betrayalAnnounceFade * 4);
  p.fill(200, 0, 0, alpha);
  p.rect(0, CANVAS_H/2 - 45, CANVAS_W, 90);
  p.fill(255, 255, 255, alpha); p.textAlign(p.CENTER, p.CENTER);
  p.textSize(26); p.text('⚠ 배신 모드 발동! ⚠', CANVAS_W/2, CANVAS_H/2 - 12);
  p.textSize(13); p.text('이제 서로가 적입니다. 더 넒은 땅을 확보하세요!', CANVAS_W/2, CANVAS_H/2 + 18);
}

function drawLobby(p) {
  p.background(10, 10, 15);
  const cx = CANVAS_W / 2, cy = CANVAS_H / 2;
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36); p.fill('#4CAF50'); p.text('좀비 영역 전쟁', cx, cy - 140);
  p.textSize(14); p.fill(180); p.text('2인 협력 ➔ 배신 데스매치 영역전', cx, cy - 100);
  p.textSize(13);
  p.fill(COLOR_A); p.text('플레이어 A: W A S D', cx - 120, cy - 50);
  p.fill(COLOR_B); p.text('플레이어 B: ↑ ↓ ← →', cx + 120, cy - 50);
  p.textSize(11); p.fill(160);
  p.text('협력 단계: 공동 팀 영역을 점령하며 좀비를 섬멸하세요.', cx, cy - 10);
  p.text('배신 단계: 최종 돌입 시, 넓은 개인 영토를 가진 자가 승리합니다.', cx, cy + 12);
  p.fill(255, 165, 0);
  p.text('💊 약: 주변 폭탄 배분  🩸 피: 좀비 폭주  ⚡ 에너지: 속도 2배 + 강철 꼬리 무적', cx, cy + 44);
  p.fill(200);
  p.text('좀비의 뒤를 쫓아가 꼬리를 밟으면 좀비를 사살할 수 있습니다!', cx, cy + 68);
  const blink = Math.floor(p.frameCount / 18) % 2 === 0;
  p.fill(blink ? '#4CAF50' : '#2E7D32');
  p.rect(cx - 100, cy + 96, 200, 46, 10);
  p.fill(255); p.textSize(15);
  p.text('게임 시작 (SPACE)', cx, cy + 122);
}
