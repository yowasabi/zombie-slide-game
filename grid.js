// grid.js — 땅 영역 및 소유권 알고리즘 관리

let grid = [];

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = { owner: OWNER_NONE };
    }
  }
}

function setOwner(r, c, owner) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
  grid[r][c].owner = owner;
}

function getOwner(r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
  return grid[r][c].owner;
}

// 기존 스케치 코드와 충돌을 막기 위해 색상 반환 함수 완벽 구현
function tileColor(owner) {
  if (owner === OWNER_TEAM) return COLOR_TEAM;
  if (owner === OWNER_A) return COLOR_A;
  if (owner === OWNER_B) return COLOR_B;
  if (owner === OWNER_ZOMBIE) return COLOR_ZOMBIE;
  return COLOR_EMPTY;
}

function drawGrid(p) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = grid[r][c];
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;

      // 영역 채우기
      if (tile.owner) {
        p.fill(tileColor(tile.owner) + 'B3'); // 투명도 살짝 부여
      } else {
        p.fill(COLOR_EMPTY);
      }
      p.noStroke();
      p.rect(x, y, TILE_SIZE, TILE_SIZE);

      // 격자선 그리기
      p.stroke(COLOR_GRID);
      p.strokeWeight(0.3);
      p.noFill();
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
    }
  }
}

// 폐곡선 영역 내부 자동 채우기 알고리즘 (Flood Fill)
function fillClosedArea(owner, tailList) {
  const tailSet = new Set(tailList.map(t => `${t.r},${t.c}`));
  const visited = new Set();
  const queue = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
        const key = `${r},${c}`;
        if (grid[r][c].owner !== owner && !tailSet.has(key)) {
          visited.add(key);
          queue.push({ r, c });
        }
      }
    }
  }

  const dr = [-1, 1, 0, 0];
  const dc = [0, 0, -1, 1];

  while (queue.length > 0) {
    const curr = queue.shift();
    for (let i = 0; i < 4; i++) {
      const nr = curr.r + dr[i];
      const nc = curr.c + dc[i];
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        const nKey = `${nr},${nc}`;
        if (!visited.has(nKey) && grid[nr][nc].owner !== owner && !tailSet.has(nKey)) {
          visited.add(nKey);
          queue.push({ r: nr, c: nc });
        }
      }
    }
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = `${r},${c}`;
      if (grid[r][c].owner !== owner && !visited.has(key) && !tailSet.has(key)) {
        setOwner(r, c, owner);
      }
    }
  }
}

// 배신 모드 발동 시: 위치 기준 반반 분할 (Voronoi 분할)
function voronoiSplit(posA, posB) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c].owner === OWNER_TEAM) {
        const dA = Math.abs(r - posA.r) + Math.abs(c - posA.c);
        const dB = Math.abs(r - posB.r) + Math.abs(c - posB.c);
        grid[r][c].owner = dA <= dB ? OWNER_A : OWNER_B;
      }
    }
  }
}

// 부활 시 규칙: 살아남은 플레이어 땅 영역의 딱 절반을 떼어줌
function reallocateHalfTerritory(fromId, toId) {
  let targetTiles = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c].owner === fromId) {
        targetTiles.push({ r, c });
      }
    }
  }
  const halfCount = Math.floor(targetTiles.length / 2);
  for (let i = 0; i < halfCount; i++) {
    grid[targetTiles[i].r][targetTiles[i].c].owner = toId;
  }
}

function countTiles() {
  let counts = { team: 0, A: 0, B: 0, Z: 0, none: 0 };
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const o = grid[r][c].owner;
      if (o === OWNER_TEAM) counts.team++;
      else if (o === OWNER_A) counts.A++;
      else if (o === OWNER_B) counts.B++;
      else if (o === OWNER_ZOMBIE) counts.Z++;
      else counts.none++;
    }
  }
  return counts;
}
