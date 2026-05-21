// constants.js — 게임 상수 설정

// 1. 맵 및 화면 크기 설정 (맵 크기를 더 크게 확장)
const TILE_SIZE = 16;
const COLS = 60; 
const ROWS = 60;
const CANVAS_W = COLS * TILE_SIZE;
const CANVAS_H = ROWS * TILE_SIZE;

const FRAME_RATE = 30;

// 2. 게임 시간 규칙
const GAME_TOTAL_TIME = 60;        // 전체 게임 시간 1분
const BETRAYAL_TRIGGER_TIME = 20;  // 배신 타이머 발동 잔여 시간 20초

const SOLO_TIME_LIMIT = 30;         // 한 명 사망 후 제한 시간 30초
const EMERGENCY_BETRAYAL_TIME = 30; // 부활 후 배신 타이머 30초

// 3. 플레이어 설정
const PLAYER_SPEED = 8;             // 플레이어 기본 속도 (초당 타일 이동 수)
const BOOST_MULTIPLIER = 2.0;       // 에너지드링크 속도 2배
const ITEM_DURATION = 150;          // 5초 (5 * 30fps)

// 4. 좀비 설정 (플레이어보다 살짝 느리게 조정)
const ZOMBIE_COUNT = 6;             // 시작 좀비 수
const ZOMBIE_MAX = 12;              // 최대 좀비 제한
const ZOMBIE_SPEED_NORMAL = 6.0;    // 플레이어(8)보다 살짝 느림
const ZOMBIE_SPEED_BOOSTED = 11.0;  // 피 획득 시 폭주 속도
const ZOMBIE_SPAWN_INTERVAL = 150;  // 5초마다 추가 생성
const ZOMBIE_RANDOM_CHANCE = 0.15;  // 무작위 이동 확률

// 5. 아이템 박스 설정
const BOX_COUNT_EACH = 4;           // 종류별 생성 개수
const BONUS_LAND_RADIUS = 3;        // 약 획득 시 보너스 땅 반지름

// 6. 상태 및 진역 소유권 정의
const PHASE_LOBBY = 'LOBBY';
const PHASE_COOP = 'COOP';          // 협력 단계
const PHASE_SOLO = 'SOLO';          // 한 명 죽었을 때 독자 생존 단계
const PHASE_BETRAYAL = 'BETRAYAL';  // 배신 단계
const PHASE_END = 'END';

const OWNER_NONE = null;
const OWNER_TEAM = 'team';
const OWNER_A = 'A';
const OWNER_B = 'B';
const OWNER_ZOMBIE = 'Z';

const BOX_TYPE_MEDICINE = 'medicine'; // 약
const BOX_TYPE_BLOOD    = 'blood';    // 피
const BOX_TYPE_ENERGY   = 'energy';   // 에너지드링크

// 색상 정의
const COLOR_EMPTY = '#1A1A24';
const COLOR_GRID = '#2D2D3D';
const COLOR_TEAM = '#4CAF50';
const COLOR_A = '#2196F3';
const COLOR_B = '#9C27B0';
const COLOR_ZOMBIE = '#795548';
