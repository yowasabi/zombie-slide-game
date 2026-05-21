// ui.js — 실시간 시간 안내 통합 타이머 단일 바 및 HUD UI

let notifications = [];

function showNotification(playerId, msg, color) {
  notifications.push({ playerId, msg, color, timer: 90 });
  if (notifications.length > 3) notifications.shift();
}

function drawUI(p, phase, timeLeft, counts) {
  p.push();
  
  const hudH = 45;
  p.noStroke();
  p.fill(0, 0, 0, 230);
  p.rect(0, 0, CANVAS_W, hudH);

  // 규칙: 움직이지 않던 문제를 완전 수정한 통합 단일 타이머 바 연출
  const barX = 15;
  const barY = 28;
  const barW = CANVAS_W - 30;
  const barH = 10;
  
  p.fill(50);
  p.rect(barX, barY, barW, barH, 4);

  const totalTiles = ROWS * COLS;
  
  if (phase === PHASE_COOP || phase === PHASE_SOLO) {
    const ratio = counts.team / totalTiles;
    p.fill(COLOR_TEAM);
    p.rect(barX, barY, barW * ratio, barH, 4);
  } else {
    const ratioA = counts.A / totalTiles;
    const ratioB = counts.B / totalTiles;
    p.fill(COLOR_A);
    p.rect(barX, barY, barW * ratioA, barH, 4);
    p.fill(COLOR_B);
    p.rect(barX + (barW * ratioA), barY, barW * ratioB, barH, 4);
  }

  p.textSize(12);
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  
  let modeName = "협력전 모드";
  if (phase === PHASE_SOLO) modeName = "독자 생존 타임어택";
  if (phase === PHASE_BETRAYAL) modeName = "⚠️ 배신 서바이벌 ⚠️";
  
  p.text(`${modeName} | 남은 플레이시간: ${Math.ceil(timeLeft)}초`, 15, 8);

  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i];
    n.timer--;
    p.fill(n.color);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`[P-${n.playerId}] ${n.msg}`, CANVAS_W - 15, 8 + (i * 14));
  }
  
  notifications = notifications.filter(n => n.timer > 0);
  p.pop();
}

let betrayalAnnounceFade = 0;
function showBetrayalAnnounce() { betrayalAnnounceFade = 90; }

function drawBetrayalAnnounce(p) {
  if (betrayalAnnounceFade <= 0) return;
  betrayalAnnounceFade--;
  p.push();
  p.fill(255, 23, 68, Math.min(220, betrayalAnnounceFade * 4));
  p.rect(0, CANVAS_H/2 - 40, CANVAS_W, 80);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("⚠ 배신 타이머 발동! ⚠", CANVAS_W / 2, CANVAS_H / 2 - 12);
  p.textSize(14);
  p.text("이제부터 팀원은 적입니다! 더 많은 땅을 차지하세요!", CANVAS_W / 2, CANVAS_H / 2 + 16);
  p.pop();
}

function drawLobby(p) {
  p.background(15, 15, 25);
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(COLOR_TEAM);
  p.textSize(36);
  p.text("좀비 영역 전쟁", CANVAS_W / 2, CANVAS_H / 2 - 50);
  p.fill(200);
  p.textSize(16);
  p.text("시작하려면 [ SPACE ] 키를 누르세요", CANVAS_W / 2, CANVAS_H / 2 + 20);
}

function drawResultScreen(p, counts, winner) {
  p.push();
  p.fill(0, 0, 0, 220);
  p.rect(0, 0, CANVAS_W, CANVAS_H);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("게임 종료", CANVAS_W / 2, CANVAS_H / 2 - 80);

  let winText = "";
  if (winner === 'A') winText = "플레이어 A 우승! (파란색)";
  else if (winner === 'B') winText = "플레이어 B 우승! (보라색)";
  else if (winner === 'draw') winText = "무승부! 땅 영역 크기가 동일합니다.";
  else winText = "좀비 무리의 승리! 감염 완료.";

  p.fill(winner === 'A' ? COLOR_A : (winner === 'B' ? COLOR_B : '#FF5252'));
  p.textSize(18);
  p.text(winText, CANVAS_W / 2, CANVAS_H / 2 - 20);

  p.fill(255);
  p.textSize(14);
  p.text(`최종 결과지 - A 영역: ${counts.A}칸 | B 영역: ${counts.B}칸`, CANVAS_W / 2, CANVAS_H / 2 + 30);
  p.text("재시작하려면 [ R ] 키를 누르세요", CANVAS_W / 2, CANVAS_H / 2 + 80);
  p.pop();
}
