// constants.js

const TILE_SIZE = 16;
const COLS = 60; 
const ROWS = 60;
const CANVAS_W = COLS * TILE_SIZE;
const CANVAS_H = ROWS * TILE_SIZE;
const FRAME_RATE = 30;

// 시간 설정 (초 단위를 프레임으로 계산하기 위함)
const GAME_TOTAL_TIME = 60;        // 전체 1분
const BETRAYAL_TRIGGER_TIME = 20;  // 배신 타이머 20초 남았을 때 발동

const SOLO_TIME_LIMIT = 30;         // 한 명 사망 시 남은 사람 타임어택 30초
const EMERGENCY_BETRAYAL_TIME = 30; // 부활 후 배신 타이머 30초

// 플레이어 설정
const PLAYER_SPEED = 7.0;             
const BOOST_MULTIPLIER = 2.0;       
const ITEM_DURATION = 150;          // 버프 지속시간 5초 (150프레임)

// 좀비 설정 (플레이어보다 살짝 느리게 조율)
const ZOMBIE_COUNT = 6;             
const ZOMBIE_MAX = 15;              
const ZOMBIE_SPEED_NORMAL = 5.0;    // 플레이어(7.0)보다 살짝 느림
const ZOMBIE_SPEED_BOOSTED = 10.0;  // 폭주 시 속도
const ZOMBIE_SPAWN_INTERVAL = 150;  // 좀비 리스폰 주기 (5초)
const ZOMBIE_RANDOM_CHANCE = 0.15;  

const BOX_COUNT_EACH = 4;           
const BONUS_LAND_RADIUS = 3;        // 약 획득 시 3칸 반경 보너스 땅

// 게임 상태 페이즈
const PHASE_LOBBY = 'LOBBY';
const PHASE_COOP = 'COOP';          
const PHASE_SOLO = 'SOLO';          
const PHASE_BETRAYAL = 'BETRAYAL';  
const PHASE_END = 'END';

// 소유권 식별자
const OWNER_NONE = null;
const OWNER_TEAM = 'team';
const OWNER_A = 'A';
const OWNER_B = 'B';
const OWNER_ZOMBIE = 'Z';

const TILE_TYPE_NORMAL = 'normal';

// 아이템 박스 타입
const BOX_TYPE_MEDICINE = 'medicine'; 
const BOX_TYPE_BLOOD    = 'blood';    
const BOX_TYPE_ENERGY   = 'energy';   

// 테마 색상 설정
const COLOR_EMPTY = '#1A1A24';
const COLOR_GRID = '#2D2D3D';
const COLOR_TEAM = '#4CAF50';
const COLOR_A = '#2196F3';
const COLOR_B = '#9C27B0';
const COLOR_ZOMBIE = '#795548';
