// zombie.js — 좀비 생성, AI 및 영역 확보 규칙

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
    // 피 아이템 획득 시 전체 좀비 일시 폭주 속도 적용
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
    // AI 행동 패턴: 낮은 확률로 완전 무작위, 높은 확률로 가까운 플레이어 추적
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

    // 장외 금지
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) {
      this._randomDir(p);
      return;
    }

    this.r = nr;
    this.c = nc;

    // 좀비도 고유의 땅 영역 확보 가능 처리
    const tileOwner = getOwner(this.r, this.c);
    if (tileOwner === OWNER_ZOMBIE) {
      if (this.tail.length > 0) {
        this.tail.push({ r: this.r, c: this.c });
        fillClosedArea(OWNER_ZOMBIE, this.tail);
        this.tail = [];
      }
    } else {
      // 꼬리 남기기
      this.tail.push({ r: this.r, c: this.c });
    }
  }

  _randomDir(p) {
    const rands = [[-1,0],[1,0],[0,-1],[0,1]];
    const pick = p.random(rands);
    this.dr = pick[0]; this.dc = pick[1];
  }

  cutTailAt(index) {
    // 좀비는 저절로 죽지 않으며, 반드시 오직 꼬리를 끊겼을 때만 확실히 사망함
    this.alive = false;
    // 사망 시 점유하던 임시 자취 꼬리 해제
    this.tail = [];
  }
}

let zombies = [];

function initZombies() {
  zombies = [];
  zombieBloodTimer = 0;
  zombieSpawnTimer = 0;
  const startPositions = [[2,2], [2,COLS-3], [ROWS-3,2], [ROWS-3,COLS-3]];
  for (let i = 0; i < Math.min(ZOMBIE_COUNT, startPositions.length); i++) {
    zombies.push(new Zombie(startPositions[i][0], startPositions[i][1]));
  }
}

function updateZombies(players, p) {
  if (zombieBloodTimer > 0) zombieBloodTimer--;

  // 타이머 상시 작동 및 최대 보장 수치 미만이면 무한 재호출 소환
  zombieSpawnTimer++;
  if (zombieSpawnTimer >= ZOMBIE_SPAWN_INTERVAL && zombies.length < ZOMBIE_MAX) {
    zombieSpawnTimer = 0;
    _spawnZombie(p);
  }

  // 살아있는 좀비들 상태 업데이트
  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    if (!z.alive) {
      zombies.splice(i, 1);
      continue;
    }
    z.update(players, p);
  }

  // 충돌 및 인터랙션 판정
  for (const z of zombies) {
    for (const pl of players) {
      if (!pl.alive) continue;

      // 1. 플레이어가 좀비의 꼬리를 밟았을 때 -> 좀비 사망
      for (let i = 0; i < z.tail.length; i++) {
        if (pl.r === z.tail[i].r && pl.c === z.tail[i].c) {
          z.cutTailAt(i);
        }
      }

      // 2. 좀비가 플레이어의 꼬리를 밟았을 때 -> 플레이어 줄을 끊어도 플레이어 수칙 보호 (좀비는 플레이어의 줄을 직접 끊지 않음 혹은 무시됨)
      // 문제 요건: "좀비가 플레이어의 줄을 끊어도 죽지 않음" 준수
      
      // 3. 좀비 머리와 플레이어 본체 충돌
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
