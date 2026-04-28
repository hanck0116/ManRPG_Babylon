(function initMagicData(global) {
  const BASE_DAMAGE = { 1: 40, 2: 70, 3: 110, 4: 170, 5: 250, 6: 360, 7: 500, 8: 700, 9: 950, 10: 1300 };
  const gradeByCircle = (c) => (c <= 2 ? "기초" : c <= 4 ? "중급" : c <= 6 ? "고급" : "마도서");

  function m(id, name, circle, mpCost, attribute, type, targetType, description, damage = BASE_DAMAGE[circle], duration = 1.5, cooldown = 1.2) {
    return { id, name, circle, grade: gradeByCircle(circle), mpCost, attribute, type, targetType, damage, duration, cooldown, description };
  }

  const circles = {
    1: [
      m("light", "라이트", 1, 50, "light", "utility", "self", "주변을 밝힘", 0, 8, 3),
      m("fire", "파이어", 1, 50, "fire", "projectile", "enemy", "기본 화염탄"),
      m("ice", "아이스", 1, 50, "ice", "projectile", "enemy", "짧은 둔화", 35),
      m("wind", "윈드", 1, 50, "wind", "projectile", "enemy", "약한 넉백", 35),
      m("magic_arrow", "매직 애로우", 1, 50, "utility", "projectile", "enemy", "기본 마법 화살", 45),
      m("grease", "그리스", 1, 60, "utility", "area", "ground", "적 이동속도 감소", 0, 4, 3),
      m("dig", "디그", 1, 60, "earth", "area", "ground", "작은 지형 충격", 30),
      m("darkness", "다크니스", 1, 60, "dark", "debuff", "enemy", "명중/추적 성능 감소", 0, 4, 3),
    ],
    2: [
      m("shining_arrow", "샤이닝 에로우", 2, 80, "light", "projectile", "enemy", "빛 화살", 75),
      m("fire_arrow", "파이어 애로우", 2, 80, "fire", "projectile", "enemy", "화염 화살", 80),
      m("ice_arrow", "아이스 애로우", 2, 80, "ice", "projectile", "enemy", "둔화 화살", 70),
      m("wind_arrow", "윈드 애로우", 2, 80, "wind", "projectile", "enemy", "넉백 화살", 70),
      m("rock_arrow", "록 애로우", 2, 80, "earth", "projectile", "enemy", "암석 화살", 85),
      m("lightning_arrow", "라이트닝 애로우", 2, 80, "lightning", "projectile", "enemy", "번개 화살", 85),
      m("shield", "쉴드", 2, 90, "defense", "shield", "self", "받는 피해 감소", 0, 6, 4),
      m("heal", "힐", 2, 90, "heal", "heal", "self", "HP 회복", 0, 0, 3),
      m("ice_fog", "아이스 포그", 2, 90, "ice", "area", "ground", "범위 둔화", 30),
      m("dark_arrow", "다크 애로우", 2, 80, "dark", "projectile", "enemy", "어둠 화살", 80),
    ],
    3: [
      m("shining_defense", "샤이닝 디펜스", 3, 140, "light", "shield", "self", "강한 방어막", 0, 7, 5),
      m("fire_ball", "파이어 볼", 3, 140, "fire", "projectile", "enemy", "폭발 범위 피해", 120),
      m("ice_ball", "아이스 볼", 3, 140, "ice", "projectile", "enemy", "둔화", 110),
      m("wind_cutter", "윈드 커터", 3, 120, "wind", "projectile", "enemy", "바람 절단", 115),
      m("stone_spike", "스톤 스파이크", 3, 140, "earth", "area", "enemy", "지면 창", 125),
      m("raiden", "라이데인", 3, 160, "lightning", "instant", "enemy", "즉시 번개", 140),
      m("sleep", "슬립", 3, 120, "mental", "debuff", "enemy", "행동 정지", 0, 2.2, 4),
      m("cancellation", "캔슬레이션", 3, 140, "utility", "debuff", "enemy", "버프 제거", 0, 0, 4),
      m("bone_binding", "본 바인딩", 3, 140, "necro", "debuff", "enemy", "속박", 50, 3, 4),
      m("dark_ball", "다크 볼", 3, 140, "dark", "projectile", "enemy", "어둠 구체", 120),
      m("web", "웹", 3, 120, "utility", "area", "ground", "이동 제한", 0, 4, 4),
      m("memorize", "메모라이즈", 3, 120, "utility", "buff", "self", "다음 마법 쿨타임 감소", 0, 8, 6),
    ],
    4: [
      m("shining_wave", "샤이닝 웨이브", 4, 240, "light", "area", "forward", "전방 파동", 190),
      m("shining_enchant", "샤이닝 인첸트", 4, 180, "light", "buff", "self", "공격 빛 속성화", 0, 9, 6),
      m("shining_blaster", "샤이닝 블레스터", 4, 210, "light", "beam", "enemy", "빛 광선", 210),
      m("fire_lance", "파이어 랜스", 4, 210, "fire", "projectile", "enemy", "화염 창", 220),
      m("ice_spear", "아이스 스피어", 4, 210, "ice", "projectile", "enemy", "강한 둔화", 200),
      m("aero_bomb", "에어로 봄", 4, 180, "wind", "area", "enemy", "넉백 폭풍", 170),
      m("earth_break", "어스 브레이크", 4, 240, "earth", "area", "ground", "대지 파쇄", 230),
      m("blind", "블라인드", 4, 180, "mental", "debuff", "enemy", "정확도 감소", 0, 4, 5),
      m("slow", "슬로우", 4, 180, "utility", "debuff", "enemy", "속도 감소", 0, 4, 5),
      m("silence", "사일런스", 4, 180, "utility", "debuff", "enemy", "마법 제한", 0, 4, 5),
      m("illusion", "일루젼", 4, 180, "mental", "buff", "self", "회피 보조", 0, 6, 5),
      m("confusion", "컨퓨전", 4, 180, "mental", "debuff", "enemy", "행동 지연", 0, 3, 5),
    ],
    5: [
      m("invisibility", "인비저빌리티", 5, 260, "utility", "buff", "self", "적 추적 약화", 0, 6, 7),
      m("distortion", "디스토션", 5, 300, "space", "area", "enemy", "위치 왜곡", 230),
      m("shining_field", "샤이닝 필드", 5, 340, "light", "field", "ground", "빛 영역", 80, 12, 10),
      m("laser", "레이져", 5, 300, "utility", "beam", "enemy", "집중 광선", 280),
      m("barrier", "배리어", 5, 300, "defense", "shield", "self", "강한 방어막", 0, 7, 8),
      m("explosion", "익스플로전", 5, 340, "fire", "area", "enemy", "폭발", 320),
      m("chain_lightning", "체인 라이트닝", 5, 340, "lightning", "projectile", "enemy", "연쇄 번개", 300),
      m("fire_wall", "파이어 월", 5, 300, "fire", "field", "ground", "화염 영역", 70, 12, 10),
      m("blink", "블링크", 5, 260, "space", "movement", "self", "짧은 순간이동", 0, 0, 4),
      m("gravity", "그래비티", 5, 300, "gravity", "area", "enemy", "중력장", 180),
      m("dark_field", "다크 필드", 5, 340, "dark", "field", "ground", "어둠 영역", 80, 12, 10),
      m("life_drain", "라이프 드레인", 5, 300, "dark", "beam", "enemy", "흡수 광선", 220),
    ],
    6: [
      m("shining_laser", "샤이닝 레이져", 6, 430, "light", "beam", "enemy", "강력 광선", 420),
      m("summon_shining", "서먼 샤이닝", 6, 500, "light", "summon", "self", "빛 소환체", 0, 7, 9),
      m("anti_magic_shell", "안티 매직 쉘", 6, 500, "defense", "shield", "self", "마법 피해 감소", 0, 8, 9),
      m("pillar_of_fire", "필라 오브 파이어", 6, 430, "fire", "area", "enemy", "화염 기둥", 430),
      m("giga_raiden", "기가 라이데인", 6, 500, "lightning", "instant", "enemy", "초고출력 번개", 500),
      m("tornado", "토네이도", 6, 430, "wind", "area", "enemy", "강한 넉백", 400),
      m("dispel", "디스펠", 6, 380, "utility", "debuff", "enemy", "버프/영역 제거", 0, 0, 6),
      m("great_shield", "그레이트 쉴드", 6, 430, "defense", "shield", "self", "매우 강한 방어막", 0, 8, 9),
      m("teleport", "텔레포트", 6, 430, "space", "movement", "self", "지정 방향 순간이동", 0, 0, 5),
      m("great_heal", "그레이트 힐", 6, 430, "heal", "heal", "self", "큰 회복", 0, 0, 6),
      m("dark_cannon", "다크 캐논", 6, 430, "dark", "projectile", "enemy", "어둠 포탄", 430),
      m("summon_bone_wyvern", "서먼 본 와이번", 6, 500, "necro", "summon", "self", "뼈 와이번 소환", 0, 7, 9),
    ],
    7: [
      m("shining_judgement", "샤이닝 저지먼트", 7, 700, "light", "area", "enemy", "심판의 빛", 650),
      m("heavens_door", "헤븐스 도어", 7, 700, "light", "field", "ground", "성역 생성", 500, 12, 12),
      m("inferno", "인페르노", 7, 600, "fire", "area", "enemy", "대화염", 600),
      m("blizzard", "블리자드", 7, 600, "ice", "area", "enemy", "극한 한파", 570),
      m("earth_quake", "어스 퀘이크", 7, 700, "earth", "area", "ground", "대지진", 700),
      m("wind_storm", "윈드 스톰", 7, 600, "wind", "area", "enemy", "폭풍", 560),
      m("warp", "워프", 7, 520, "space", "movement", "self", "원거리 이동", 0, 0, 6),
      m("reflection", "리플렉션", 7, 600, "defense", "shield", "self", "피해 일부 반사", 0, 6, 8),
      m("gravity_7", "그래비티", 7, 600, "gravity", "area", "enemy", "강한 중력장", 450),
      m("summon_deathknight", "서먼 데스나이트", 7, 700, "necro", "summon", "self", "데스나이트 소환", 0, 8, 10),
    ],
    8: [
      m("sword_revenge_light", "소드 오브 리벤지 라이트", 8, 820, "light", "projectile", "enemy", "빛 검광", 820),
      m("shining_rain", "샤이닝 레인", 8, 820, "light", "area", "enemy", "빛의 비", 780),
      m("volcano", "볼케이노", 8, 950, "fire", "area", "ground", "화산 분출", 950),
      m("ice_crystal_storm", "아이스 크리스탈 오브 스톰", 8, 950, "ice", "area", "enemy", "빙정 폭풍", 900),
      m("fury_of_heaven", "퓨리 오브 더 헤븐", 8, 950, "light", "area", "enemy", "천벌", 950),
      m("lightning_infinity", "라이트닝 인피니티", 8, 950, "lightning", "area", "enemy", "무한 번개", 950),
      m("control_weather", "컨트롤 웨더", 8, 700, "utility", "field", "ground", "환경 변화", 300, 12, 12),
      m("mass_teleport", "매스 텔레포트", 8, 820, "space", "movement", "self", "대규모 이동", 0, 0, 6),
      m("hellfire", "헬파이어", 8, 950, "dark", "area", "enemy", "지옥불", 950),
      m("summon_bone_dragon", "서먼 본 드래곤", 8, 950, "necro", "summon", "self", "본 드래곤 소환", 0, 8, 10),
    ],
    9: [
      m("meteor_strike", "메테오 스트라이크", 9, 1400, "fire", "area", "enemy", "운석 낙하", 1400),
      m("meteor_swarm", "메테오 스웜", 9, 1200, "fire", "area", "enemy", "운석 군집", 1200),
      m("absolute_zero", "앱솔루트 제로 포인트", 9, 1400, "ice", "area", "enemy", "절대영도", 1350),
      m("lightning_world", "라이트닝 월드", 9, 1200, "lightning", "area", "enemy", "번개 세계", 1200),
      m("ruin_ground", "루인 오브 그라운드", 9, 1200, "earth", "area", "ground", "대지 붕괴", 1200),
      m("elemental_punishment", "엘리멘탈 퍼니시먼트", 9, 1400, "utility", "area", "enemy", "원소 심판", 1400),
      m("absolute_shield", "앱솔루트 쉴드", 9, 1200, "defense", "shield", "self", "최상급 방어막", 0, 8, 10),
      m("warp_gate", "워프 게이트", 9, 900, "space", "movement", "self", "공간 게이트", 0, 0, 6),
      m("power_word_kill", "파워 워드 킬", 9, 1400, "dark", "instant", "enemy", "즉발 처형급 피해", 1600),
      m("necropolis", "네크로폴리스", 9, 1400, "necro", "field", "ground", "네크로 영역", 1000, 12, 12),
    ],
    10: [],
  };

  function getSpellsByCircle(circle) {
    return circles[circle] || [];
  }

  function getGradeCircles(grade) {
    if (grade === "기초") return [1, 2];
    if (grade === "중급") return [3, 4];
    if (grade === "고급") return [5, 6];
    if (grade === "마도서") return [7, 8, 9, 10];
    return [];
  }

  global.magicData = { circles, getSpellsByCircle, getGradeCircles, BASE_DAMAGE };
})(window);
