// zombie.js — 좀비 무한 생성 리스폰 및 땅 영역 보장 AI 알고리즘

let zombieBloodTimer = 0;
let zombieSpawnTimer = 0;

class Zombie {
  constructor(r, c) {
    this.r = r;
    this.c = c;
    this.dr = 0;
    this.dc = 1;
    this.moveAccum = 0;
    this.tail = [];
    this.alive = true;
  }

  get speed() {
    return zombieBloodTimer > 0 ? ZOMBIE_SPEED_BOOSTED : ZOMBIE_SPEED_NORMAL;
  }

  update(players, p) {
    if (!this.alive) return;
    this.moveAccum += this.speed / FRAME_RATE;
    while (this.moveAccum >= 1) {
      this.moveAccum -= 1;
      this._step(players, p);
      if (!this.alive) return;
    }
  }

  _step(players, p) {
    // 무작위 움직임 또는 최단 거리 플레이어 추적 AI
    if (p.random() < ZOMBIE_RANDOM_CHANCE) {
      this._randomDir(p);
    } else {
      let target = null;
      let minDist = 9999;
      for (const pl of players) {
        if (!pl.alive) continue;
        const d = p.dist(this.c, this.r, pl.c, pl.r);
        if (d < minDist) { minDist = d; target = pl; }
      }
      if (target) {
        if (p.abs(target.c - this.c) > p.abs(target.r - this.r)) {
          this.dc = target.c > this.c ? 1 : -1; this.dr = 0;
        } else {
          this.dr = target.r > this.r ? 1 : -1; this.dc = 0;
        }
      } else {
        this._randomDir(p);
      }
    }

    const nr = this.r + this.dr;
    const nc = this.c + this.dc;

    // 맵 장외 이탈 방지
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) {
      this._randomDir(p);
      return;
    }

    this.r = nr;
    this.c = nc;

    // 규칙: 좀비도 자신의 고유 땅 영역을 보유 및 획득 가능
    const tileOwner = getOwner(this.r, this.c);
    if (tileOwner === OWNER_ZOMBIE) {
      if (this.tail.length > 0) {
        this.tail.push({ r: this.r, c: this.c });
        fillClosedArea(OWNER_ZOMBIE, this.tail);
        this.tail = [];
      }
    } else {
      this.tail.push({ r: this.r, c: this.c });
    }
  }

  _randomDir(p) {
    const rands = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const pick = p.random(rands);
    this.dr = pick[0]; this.dc = pick[1];
  }

  cutTailAt(index) {
    // 좀비는 저절로 절대 죽지 않고 꼬리를 끊겨야만 사망함
    this.alive = false;
    this.tail = [];
  }

  draw(p) {
    if (!this.alive) return;
    
    // 좀비 꼬리 그리기
    p.noStroke();
    p.fill(121, 85, 72, 120);
    for (const t of this.tail) {
      p.rect(t.c * TILE_SIZE + 4, t.r * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    }

    // 좀비 머리 본체
    const x = this.c * TILE_SIZE;
    const y = this.r * TILE_SIZE;
    p.fill(COLOR_ZOMBIE);
    p.rect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4, 3);
    
    // 좀비 붉은 눈
    p.fill(255, 0, 0);
    p.rect(x + 5, y + 5, 2, 2);
    p.rect(x + TILE_SIZE - 7, y + 5, 2, 2);
  }
}

let zombies = [];

function initZombies() {
  zombies = [];
  zombieBloodTimer = 0;
  zombieSpawnTimer = 0;
  const startPositions = [[2, 2], [2, COLS - 3], [ROWS - 3, 2], [ROWS - 3, COLS - 3]];
  for (let i = 0; i < Math.min(ZOMBIE_COUNT, startPositions.length); i++) {
    zombies.push(new Zombie(startPositions[i][0], startPositions[i][1]));
  }
}

// 스케치에서 쉽게 통합 드로잉 호출할 수 있도록 랩핑용 함수 구현 추가
function drawZombies(p) {
  for (const z of zombies) z.draw(p);
}

function updateZombies(players, p) {
  if (zombieBloodTimer > 0) zombieBloodTimer--;

  // 규칙: 배신타이머 때도 좀비가 없어지지 않고 계속 무한으로 리스폰 생성됨
  zombieSpawnTimer++;
  if (zombieSpawnTimer >= ZOMBIE_SPAWN_INTERVAL && zombies.length < ZOMBIE_MAX) {
    zombieSpawnTimer = 0;
    _spawnZombie(p);
  }

  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    if (!z.alive) {
      zombies.splice(i, 1);
      continue;
    }
    z.update(players, p);
  }

  // 충돌 감지 처리
  for (const z of zombies) {
    for (const pl of players) {
      if (!pl.alive) continue;

      // 1. 플레이어가 좀비 꼬리를 밟았을 때 -> 좀비 처단
      for (let i = 0; i < z.tail.length; i++) {
        if (pl.r === z.tail[i].r && pl.c === z.tail[i].c) {
          z.cutTailAt(i);
        }
      }

      // 2. 규칙 준수: 좀비가 플레이어의 줄을 끊어도 플레이어는 죽지 않음 (그냥 지나침)
      
      // 3. 좀비 본체와 플레이어 본체 정면 충돌
      if (z.r === pl.r && z.c === pl.c) {
        if (!pl.isInOwnTerritory() && pl.steelTailTimer <= 0) {
          pl.alive = false; 
        }
      }
    }
  }
}

function _spawnZombie(p) {
  const edges = [
    {r: 0, c: Math.floor(p.random(COLS))},
    {r: ROWS-1, c: Math.floor(p.random(COLS))},
    {r: Math.floor(p.random(ROWS)), c: 0},
    {r: Math.floor(p.random(ROWS)), c: COLS-1}
  ];
  const spawnPoint = p.random(edges);
  zombies.push(new Zombie(spawnPoint.r, spawnPoint.c));
}
