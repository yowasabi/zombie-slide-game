// sketch.js — 게임의 심장

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

  if (phase === PHASE_LOBBY) { drawLobby(this); return; }

  if (phase === PHASE_END) {
    // [오류 해결] 원본의 drawZombies(this) 오타를 올바른 함수인 drawGrid(this)로 수정했습니다.
    drawGrid(this); 
    playerA.draw(this); playerB.draw(this);
    drawResultScreen(this, countTiles(), winner);
    return;
  }

  // 게임 진행
  gameTimer--;
  const timeLeftSec = gameTimer / FRAME_RATE;

  // 배신 타이머 발동
  if (!betrayalTriggered && timeLeftSec <= BETRAYAL_TRIGGER_TIME) {
    _triggerBetrayal();
  }

  // 솔로 페이즈 타이머
  if (phase === PHASE_SOLO) {
    soloTimer--;
    if (soloTimer <= 0) {
      _handleSoloTimeOut();
    }
  }

  if (gameTimer <= 0) {
    _endGame('timer');
    return;
  }

  // 객체 업데이트
  updatePlayers(phase, this);
  updateZombies([playerA, playerB], this);
  updateTiles(this);

  checkTilePickup(playerA, zombies, phase, this);
  checkTilePickup(playerB, zombies, phase, this);

  // 협력 중 사망 체크
  if (phase === PHASE_COOP) {
    if (!playerA.alive) {
      phase = PHASE_SOLO;
      deadPlayerId = 'A';
      soloTimer = SOLO_TIME_LIMIT * FRAME_RATE;
    } else if (!playerB.alive) {
      phase = PHASE_SOLO;
      deadPlayerId = 'B';
      soloTimer = SOLO_TIME_LIMIT * FRAME_RATE;
    }
  }

  // 둘 다 사망 시 종료 (솔로 모드가 아닐 때)
  if (!playerA.alive && !playerB.alive && phase !== PHASE_SOLO) {
    _endGame('zombie');
    return;
  }

  // 화면 그리기 순서
  drawGrid(this);
  drawTiles(this);
  
  // 좀비 그리기 (기존 오타 수정 후 정상 호출)
  for (const z of zombies) {
    z.draw(this);
  }

  playerA.draw(this);
  playerB.draw(this);

  // UI 스크린 출력
  let displayTime = (phase === PHASE_SOLO) ? soloTimer : gameTimer;
  drawUI(this, phase, displayTime / FRAME_RATE, countTiles());
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
  const dead = (deadPlayerId === 'A') ? playerA : playerB;
  const survivor = (deadPlayerId === 'A') ? playerB : playerA;

  // 생존자 영역 절반 강탈하여 부활자에게 지급
  let targetTiles = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c].owner === survivor.id) {
        targetTiles.push({r, c});
      }
    }
  }
  
  // 절반 나누기
  let half = Math.floor(targetTiles.length / 2);
  for (let i = 0; i < half; i++) {
    grid[targetTiles[i].r][targetTiles[i].c].owner = dead.id;
  }

  // 안전 기지 부활 좌표 설정
  let deadSpawnR = (dead.id === 'A') ? 3 : ROWS-4;
  let deadSpawnC = (dead.id === 'A') ? 3 : COLS-4;
  for (let r = deadSpawnR-2; r <= deadSpawnR+2; r++) {
    for (let c = deadSpawnC-2; c <= deadSpawnC+2; c++) {
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        grid[r][c].owner = dead.id;
      }
    }
  }

  let deadOwner = (dead.id === 'A' ? OWNER_A : OWNER_B);
  dead.revive(deadSpawnR, deadSpawnC, deadOwner);

  // 배신 타이머 30초 발동
  gameTimer = EMERGENCY_BETRAYAL_TIME * FRAME_RATE;
  betrayalTriggered = true;
  phase = PHASE_BETRAYAL;
  playerA.setPhase(PHASE_BETRAYAL);
  playerB.setPhase(PHASE_BETRAYAL);
  deadPlayerId = null;

  showBetrayalAnnounce(this);
  showNotification('A', '부활! 배신 타이머 30초 발동!', '#FF5252');
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
  if (phase === PHASE_LOBBY && keyCode === 32) { phase = PHASE_COOP; return; }
  if (phase === PHASE_END && (key==='r' || key==='R')) { resetGame(); return; }
  if (playerA) playerA.handleKeyPressed(keyCode);
  if (playerB) playerB.handleKeyPressed(keyCode);
}
