// grid.js

let grid = [];

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = { owner: OWNER_NONE, type: TILE_TYPE_NORMAL, dirty: true };
    }
  }
  
  // [필수 수정] 시작할 때 두 플레이어의 기본 스타팅 땅 할당 (아무것도 없이 시작하는 버그 해결)
  for (let r = 5; r < 15; r++) {
    for (let c = 5; c < 15; c++) {
      grid[r][c].owner = OWNER_TEAM;
    }
  }
  for (let r = ROWS - 16; r < ROWS - 6; r++) {
    for (let c = COLS - 16; c < COLS - 6; c++) {
      grid[r][c].owner = OWNER_TEAM;
    }
  }
}

function setOwner(r, c, owner) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
  if (grid[r][c].owner !== owner) {
    grid[r][c].owner = owner;
    grid[r][c].dirty = true;
  }
}

function getOwner(r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
  return grid[r][c].owner;
}

// 시스템 및 UI 모듈에서 가져다 쓰는 타일 색상 반환 함수
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

      if (tile.owner) {
        p.fill(tileColor(tile.owner) + 'B3'); 
      } else {
        p.fill(COLOR_EMPTY);
      }
      p.noStroke();
      p.rect(x, y, TILE_SIZE, TILE_SIZE);

      p.stroke(COLOR_GRID);
      p.strokeWeight(0.3);
      p.noFill();
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
    }
  }
}

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

// 부활 시 살아남은 자의 영역의 절반을 떼어 이전해 주는 로직
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
