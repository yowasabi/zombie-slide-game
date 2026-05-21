// sketch.js — 전체 게임 루프 및 룰 관리의 심장

let phase = PHASE_LOBBY;
let gameTimer = 0; 
let soloTimer = 0;
let deadPlayerId = null;
let winner = null;
let betrayalTriggered = false;

function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  frameRate(FRAME_RATE);
  resetGame();
}

function resetGame() {
  initGrid();
  initZombies();
  initPlayers();
  initTiles(this);
  
  gameTimer = GAME_TOTAL_TIME * FRAME_RATE; // 전체 제한 1분 세팅
  soloTimer = 0;
  deadPlayerId = null;
  winner = null;
  betrayalTriggered = false;
  phase = PHASE_LOBBY;
}

function draw() {
  background(COLOR_EMPTY);

  if (phase === PHASE_LOBBY) {
    drawLobby(this);
    return;
  }

  if (phase === PHASE_END) {
    drawGrid(this);
    drawTiles(this);
    drawZombies(this);
    playerA.draw(this);
    playerB.draw(this);
    drawResultScreen(this, countTiles(), winner);
    return;
  }

  // 매 프레임 시간 차감 연산
  gameTimer--;
  let timeLeftSec = gameTimer / FRAME_RATE;

  // 1. 규칙: 배신타이머 20초 남았을 때 배신 모드 발동
  if (!betrayalTriggered && phase === PHASE_COOP && timeLeftSec <= BETRAYAL_TRIGGER_TIME) {
    _triggerBetrayal();
  }

  // 2. 규칙: 한 명 조기 사망 시 30초 독자 생존 연장전 작동 관리
  if (phase === PHASE_SOLO) {
    soloTimer--;
    if (soloTimer <= 0) {
      _resurrectAndBetray();
    }
  }

  // 전체 제한 시간 완료 타임아웃 종료
  if (gameTimer <= 0) {
    _endGame('timer');
    return;
  }

  // 컴포넌트 실시간 업데이트 루프 호출
  updatePlayers(phase, this);
  updateZombies([playerA, playerB], this);
  
  checkTilePickup(playerA, phase, this);
  checkTilePickup(playerB, phase, this);

  // 협력전 상황 중 조기 탈락자 검출 감시
  if (phase === PHASE_COOP) {
    if (!playerA.alive) {
      phase = PHASE_SOLO;
      deadPlayerId = 'A';
      soloTimer = SOLO_TIME_LIMIT * FRAME_RATE; // 남은 시간 30초 강제 단축 고정
      gameTimer = soloTimer; 
      showNotification('B', '팀원 사망! 30초 독자 생존 타임어택 돌입!', '#FF9800');
    } else if (!playerB.alive) {
      phase = PHASE_SOLO;
      deadPlayerId = 'B';
      soloTimer = SOLO_TIME_LIMIT * FRAME_RATE; // 남은 시간 30초 강제 단축 고정
      gameTimer = soloTimer;
      showNotification('A', '팀원 사망! 30초 독자 생존 타임어택 돌입!', '#FF9800');
    }
  }

  // 플레이어 둘 다 죽었을 때 게임 종료
  if (!playerA.alive && !playerB.alive && phase !== PHASE_SOLO) {
    _endGame('zombie');
    return;
  }

  // 화면 렌더링 순서 보장
  drawGrid(this);
  drawTiles(this);
  drawZombies(this);
  playerA.draw(this);
  playerB.draw(this);
  
  drawUI(this, phase, phase === PHASE_SOLO ? soloTimer/FRAME_RATE : gameTimer/FRAME_RATE, countTiles());
  drawBetrayalAnnounce(this);
}

function _triggerBetrayal() {
  betrayalTriggered = true;
  phase = PHASE_BETRAYAL;
  playerA.setPhase(PHASE_BETRAYAL);
  playerB.setPhase(PHASE_BETRAYAL);
  voronoiSplit(playerA, playerB);
  showBetrayalAnnounce();
}

// 독자 생존 완료 시 패널티 부활 및 배신전 긴급 전개 구현
function _resurrectAndBetray() {
  betrayalTriggered = true;
  phase = PHASE_BETRAYAL;
  
  playerA.setPhase(PHASE_BETRAYAL);
  playerB.setPhase(PHASE_BETRAYAL);

  if (deadPlayerId === 'A') {
    playerA.revive(10, 10, OWNER_A);
    voronoiSplit(playerA, playerB);
    reallocateHalfTerritory(OWNER_B, OWNER_A); // 절반 영토 이전
  } else if (deadPlayerId === 'B') {
    playerB.revive(ROWS - 11, COLS - 11, OWNER_B);
    voronoiSplit(playerA, playerB);
    reallocateHalfTerritory(OWNER_A, OWNER_B); // 절반 영토 이전
  }

  deadPlayerId = null;
  gameTimer = EMERGENCY_BETRAYAL_TIME * FRAME_RATE; // 배신 타이머 30초 강제 발동 적용
  showBetrayalAnnounce();
  showNotification('SYSTEM', '팀원 부활 및 절반 영토 강제 분배! 배신전 시작!', '#FF1744');
}

function _endGame(reason) {
  phase = PHASE_END;
  const counts = countTiles();
  if (reason === 'timer') {
    // 규칙: 종료 시점까지 생존 시 땅이 더 넓은 유저 우승
    if (counts.A > counts.B) winner = 'A';
    else if (counts.B > counts.A) winner = 'B';
    else winner = 'draw';
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

  // 배신 타이머 단계나 어떤 국면에서도 WASD 조작키 바인딩이 절대 안 먹히는 일 없도록 상시 전송 보장
  if (playerA) playerA.handleKeyPressed(keyCode);
  if (playerB) playerB.handleKeyPressed(keyCode);
}
