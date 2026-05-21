// =============================================
// player.js — 플레이어 관련 모든 것
// =============================================

class Player {
  constructor(id, startR, startC, keyUp, keyDown, keyLeft, keyRight) {
    this.id = id;
    this.r = startR;
    this.c = startC;
    this.dr = 0;
    this.dc = 0; 
    this.nextDr = 0;
    this.nextDc = 0;
    this.keys = { up: keyUp, down: keyDown, left: keyLeft, right: keyRight };
    this.alive = true;
    this.tail = [];
    this.owner = OWNER_TEAM;
    this.boostTimer = 0;
    this.steelTailTimer = 0;
    this.bombFlash = 0;
    this.moveAccum = 0;
    this.color = (id === 'A') ? COLOR_A : COLOR_B;
  }

  get displayColor() {
    if (this.owner === OWNER_TEAM) return COLOR_TEAM;
    return (this.id === 'A') ? COLOR_A : COLOR_B;
  }

  setPhase(phase) {
    this.owner = (phase === PHASE_COOP) ? OWNER_TEAM
               : (this.id === 'A') ? OWNER_A : OWNER_B;
  }

  handleKeyPressed(kc) {
    if (kc === this.keys.up    && this.nextDr !== 1)  { this.nextDr = -1; this.nextDc = 0; }
    if (kc === this.keys.down  && this.nextDr !== -1) { this.nextDr = 1;  this.nextDc = 0; }
    if (kc === this.keys.left  && this.nextDc !== 1)  { this.nextDr = 0;  this.nextDc = -1; }
    if (kc === this.keys.right && this.nextDc !== -1) { this.nextDr = 0;  this.nextDc = 1; }
  }

  get speed() {
    return (this.boostTimer > 0) ? PLAYER_SPEED * BOOST_MULTIPLIER : PLAYER_SPEED;
  }

  update(otherPlayer, zombiesArr, phase, p) {
    if (!this.alive) return;
    if (this.boostTimer > 0) this.boostTimer--;
    if (this.steelTailTimer > 0) this.steelTailTimer--;
    if (this.bombFlash > 0) this.bombFlash--;

    this.moveAccum += this.speed / FRAME_RATE;
    while (this.moveAccum >= 1) {
      this.moveAccum -= 1;
      this._step(otherPlayer, zombiesArr, phase, p);
      if (!this.alive) return;
    }
    checkTilePickup(this, zombiesArr, phase, p);
  }

  _step(otherPlayer, zombiesArr, phase, p) {
    this.dr = this.nextDr;
    this.dc = this.nextDc;
    if (this.dr === 0 && this.dc === 0) return;

    const nr = this.r + this.dr;
    const nc = this.c + this.dc;

    // 경계 충돌 처리
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) { 
      if (getOwner(this.r, this.c) !== this.owner) { this._die(); return; }
      else { this.nextDr = 0; this.nextDc = 0; return; }
    }

    // [자신의 땅 안전 검사] 내 땅 안에 안전하게 있을 때는 무적 상태 보장
    const isInsideOwnTerritory = (getOwner(nr, nc) === this.owner);

    // 꼬리 획득 및 땅 따먹기 로직
    const onOwned = getOwner(this.r, this.c) === this.owner;
    if (onOwned) {
      if (this.tail.length > 0) {
        const tailSet = new Set(this.tail.map(t => `${t.r},${t.c}`));
        floodFillEnclosed(tailSet, this.owner, p);
        this.tail = [];
      }
    } else {
      this.tail.push({ r: this.r, c: this.c });
    }

    // 자기 꼬리 충돌 (강철 꼬리가 아닐 때만 사망)
    if (this.tail.some(t => t.r === nr && t.c === nc)) {
      if (this.steelTailTimer <= 0 && !isInsideOwnTerritory) { this._die(); return; }
    }

    // 상대방과의 충돌 제어 (머리끼리 충돌은 허용, 오직 꼬리만 타격 가능)
    if (otherPlayer && otherPlayer.alive) {
      const hitsOtherTail = otherPlayer.tail.some(t => t.r === nr && t.c === nc);
      if (hitsOtherTail && !isInsideOwnTerritory) {
        if (this.steelTailTimer > 0 && otherPlayer.steelTailTimer === 0) {
          otherPlayer._cutTailAt(nr, nc);
        } else if (otherPlayer.steelTailTimer > 0) {
          if (this.steelTailTimer <= 0) { this._die(); return; }
        } else {
          if (phase !== PHASE_COOP) {
            otherPlayer._cutTailAt(nr, nc);
          }
        }
      }
    }

    // 좀비 충돌 검사
    for (const z of zombiesArr) {
      if (!z.alive) continue;
      
      // 플레이어가 좀비의 꼬리를 먼저 밟았는지 확인 (보상 판정 선적용)
      const hitsZombieTail = z.tail.some(t => t.r === nr && t.c === nc);
      if (hitsZombieTail) {
        z.cutTailAt(nr, nc);
        break;
      }
      
      // 좀비 머리와 충돌했을 때: 안전지대가 아닐 때만 플레이어 사망
      if (z.r === nr && z.c === nc) { 
        if (!isInsideOwnTerritory) { this._die(); return; } 
      }
    }

    this.r = nr;
    this.c = nc;
  }

  _cutTailAt(r, c) {
    const idx = this.tail.findIndex(t => t.r === r && t.c === c);
    if (idx !== -1) {
      this.tail.splice(idx);
      this._die(); // 꼬리가 끊기면 사망 처리
    }
  }

  _die() {
    this.alive = false;
    this.tail = [];
  }

  revive(r, c, areaOwner) {
    this.alive = true;
    this.r = r;
    this.c = c;
    this.dr = 0; this.dc = 0;
    this.nextDr = 0; this.nextDc = 0;
    this.tail = [];
    this.moveAccum = 0;
    this.boostTimer = 0;
    this.steelTailTimer = 0;
    this.owner = areaOwner;
  }

  draw(p) {
    if (!this.alive) return;

    // 꼬리 렌더링
    const tailCol = (this.steelTailTimer > 0) ? '#B0BEC5' : this.displayColor;
    p.noStroke();
    for (const t of this.tail) {
      p.fill(tailCol);
      p.rect(t.c * TILE_SIZE + 2, t.r * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4, 1);
    }

    const x = this.c * TILE_SIZE;
    const y = this.r * TILE_SIZE;

    if (this.boostTimer > 0) {
      p.fill(0, 230, 230, 60);
      p.rect(x - 2, y - 2, TILE_SIZE + 4, TILE_SIZE + 4, 4);
    }
    if (this.bombFlash > 0 && Math.floor(p.frameCount / 3) % 2 === 0) {
      p.fill(255, 200, 0, 120);
      p.rect(x - 3, y - 3, TILE_SIZE + 6, TILE_SIZE + 6, 4);
    }

    p.fill(this.displayColor);
    p.rect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2, 3);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(9);
    p.text(this.id, x + TILE_SIZE / 2, y + TILE_SIZE / 2);

    if (this.steelTailTimer > 0) {
      p.fill(255, 255, 255, 200);
      p.textSize(8);
      p.text('⚙', x + TILE_SIZE - 4, y + 4);
    }
  }
}

let playerA, playerB;

function initPlayers() {
  const midR = Math.floor(ROWS / 2);
  const midC = Math.floor(COLS / 2);

  playerA = new Player('A', midR, midC - 4, 87, 83, 65, 68);
  playerB = new Player('B', midR, midC + 4, 38, 40, 37, 39);

  // 공동 시작 영역 초기화 (확장된 맵 크기에 비례하여 조정)
  for (let r = midR - 3; r <= midR + 3; r++) {
    for (let c = midC - 6; c <= midC + 6; c++) {
      setOwner(r, c, OWNER_TEAM);
    }
  }
}
