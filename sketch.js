// sketch.js — 게임의 메인 스케줄러 루프

let phase = PHASE_LOBBY;
let gameTimer = 0;
let betrayalTriggered = false;
let winner = null;
let soloTimer = 0;
let deadPlayerId = null;

function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  frameRate(FRAME_RATE);
  textFont('monospace');
  resetGame();
}

function resetGame() {
  initGrid();
  initZombies();
  initPlayers();
  initTiles(this);
  gameTimer = GAME_TOTAL_TIME * FRAME_RATE;
  betrayalTriggered = false;
  winner = null;
  betrayalAnnounceFade = 0;
  soloTimer = 0;
  deadPlayerId = null;
  notifications = [];
  phase = PHASE_LOBBY;
}

function draw() {
  background(COLOR_EMPTY);

  // 로비 화면
  if (phase === PHASE_LOBBY) { 
    drawLobby(this); 
    return; 
  }

  // 엔딩 화면 (종료 상태에서도 현재 오브젝트들이 배경에 보이도록 렌더링 유지)
  if (phase === PHASE_END) {
    drawGrid(this); 
    drawTiles(this); 
    for (const z of zombies) z.draw(this);
    playerA.draw(this); 
    playerB.draw(this);
    drawResultScreen(this, countTiles(), winner);
    return;
  }

  // ─── 실시간 게임 루프 연산 ───
  gameTimer--;
  const timeLeftSec = gameTimer / FRAME_RATE;

  // 배신 타이머 강제 발동 조건 검사
  if (!betrayalTriggered && phase === PHASE_COOP && timeLeftSec <= BETRAYAL_TRIGGER_TIME) {
    _triggerBetrayal();
  }

  // 독자 생존(SOLO) 페이즈 타임어택 관리
  if (phase === PHASE_SOLO) {
    soloTimer--;
    if (soloTimer <= 0) {
      _handleSoloTimeOut();
    }
  }

  // 메인 타임아웃 종료 조건
  if (gameTimer <= 0) {
    _endGame('timer');
    return;
  }

  // 오브젝트 상태 업데이트 업데이트
  updatePlayers(phase, this);
  updateZombies([playerA, playerB], this);
  checkTilePickup(playerA, zombies, phase, this);
  checkTilePickup(playerB, zombies, phase, this);

  // 협력 모드 도중 사망 시 독자 생존(SOLO)으로 전환 처리
  if (phase === PHASE_COOP) {
    if (!playerA.alive) {
      phase = PHASE_SOLO;
      deadPlayerId = 'A';
      soloTimer = SOLO_TIME_LIMIT * FRAME_RATE;
      gameTimer = soloTimer; 
    } else if (!playerB.alive) {
      phase = PHASE_SOLO;
      deadPlayerId = 'B';
      soloTimer = SOLO_TIME_LIMIT * FRAME_RATE;
      gameTimer = soloTimer;
    }
  }

  // 두 플레이어 모두 사망 시 게임 종료
  if (!playerA.alive && !playerB.alive && phase !== PHASE_SOLO) {
    _endGame('zombie');
    return;
  }

  // ─── 화면 렌더링 순서 보장 ───
  drawGrid(this);
  drawTiles(this);
  for (const z of zombies) z.draw(this);
  playerA.draw(this);
  playerB.draw(this);
  
  // UI 요소 상단에 드로우
  drawUI(this, phase, phase === PHASE_SOLO ? soloTimer / FRAME_RATE : gameTimer / FRAME_RATE, countTiles());
  drawBetrayalAnnounce(this);
}

function _triggerBetrayal() {
  betrayalTriggered = true;
  phase = PHASE_BETRAYAL;
  playerA.setPhase(PHASE_BETRAYAL);
  playerB.setPhase(PHASE_BETRAYAL);
  voronoiSplit(playerA, playerB);
  showBetrayalAnnounce(this);
}

function _handleSoloTimeOut() {
  betrayalTriggered = true;
  phase = PHASE_BETRAYAL;
  playerA.setPhase(PHASE_BETRAYAL);
  playerB.setPhase(PHASE_BETRAYAL);

  if (deadPlayerId === 'A') {
    playerA.revive(10, 10, OWNER_A);
    voronoiSplit(playerA, playerB);
    reallocateHalfTerritory(OWNER_B, OWNER_A);
  } else if (deadPlayerId === 'B') {
    playerB.revive(ROWS - 11, COLS - 11, OWNER_B);
    voronoiSplit(playerA, playerB);
    reallocateHalfTerritory(OWNER_A, OWNER_B);
  }
  
  deadPlayerId = null;
  gameTimer = EMERGENCY_BETRAYAL_TIME * FRAME_RATE;
  showBetrayalAnnounce(this);
  showNotification('SYSTEM', '부활 완료! 배신 서바이벌 발동!', '#FF5252');
}

function _endGame(reason) {
  phase = PHASE_END;
  const counts = countTiles();
  if (reason === 'timer') {
    if (playerA.alive && playerB.alive) {
      if (counts.A > counts.B) winner = 'A';
      else if (counts.B > counts.A) winner = 'B';
      else winner = 'draw';
    } else if (playerA.alive) {
      winner = 'A';
    } else if (playerB.alive) {
      winner = 'B';
    } else {
      winner = 'zombie';
    }
  } else {
    winner = 'zombie';
  }
}

function keyPressed() {
  if (phase === PHASE_LOBBY && keyCode === 32) { 
    phase = PHASE_COOP; 
    return; 
  }
  if (phase === PHASE_END && (key === 'r' || key === 'R')) { 
    resetGame(); 
    return; 
  }
  if (playerA) playerA.handleKeyPressed(keyCode);
  if (playerB) playerB.handleKeyPressed(keyCode);
}
