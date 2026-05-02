(function initGameData(global) {
  const GAME_STATES = {
    TITLE: "TITLE",
    CHARACTER_CREATION: "CHARACTER_CREATION",
    CHARACTER_CONFIRM: "CHARACTER_CONFIRM",
    FLOOR_COMBAT: "FLOOR_COMBAT",
    INNER_WORLD: "INNER_WORLD",
    GAME_OVER: "GAME_OVER",
  };

  const COMBAT_STATE = {
    COMBAT_READY: "COMBAT_READY",
    COMBAT_ACTIVE: "COMBAT_ACTIVE",
    PLAYER_DEAD: "PLAYER_DEAD",
    ENEMY_DEAD: "ENEMY_DEAD",
    INNER_WORLD: "INNER_WORLD",
  };

  const STAT_KEYS = ["strength", "agility", "appearance", "intelligence", "vitality", "wisdom"];
  const STAT_LABELS = {
    strength: "힘",
    agility: "민첩",
    appearance: "외모",
    intelligence: "지능",
    vitality: "체력",
    wisdom: "지혜",
  };

  const MANTRA_OPTIONS = [
    "검",
    "신체 강화",
    "그림자",
    "지팡이",
    "인력",
    "야수",
    "망토",
    "피닉스",
    "악마",
    "천사",
    "인과의 눈",
    "무색유리검",
  ];

  const SWORD_STAGES = [
    { name: "없음", maxMpPenalty: 0, attackMultiplier: 1 },
    { name: "검기상인", maxMpPenalty: 50, attackMultiplier: 1.2 },
    { name: "검기", maxMpPenalty: 100, attackMultiplier: 1.5 },
    { name: "검사", maxMpPenalty: 300, attackMultiplier: 3 },
    { name: "검강", maxMpPenalty: 500, attackMultiplier: 10 },
    { name: "강기압환", maxMpPenalty: 300, attackMultiplier: 50 },
    { name: "심검", maxMpPenalty: 0, attackMultiplier: 50 },
  ];

  const SKILL_SLOTS = [
    { id: "skill1", label: "1st", level: 10 },
    { id: "skill2", label: "2nd", level: 20 },
    { id: "skill3", label: "3rd", level: 30 },
    { id: "skill4", label: "4th", level: 40 },
    { id: "skill5", label: "5th", level: 50 },
    { id: "skill6", label: "6th", level: 60 },
    { id: "mandala", label: "만다라", level: 70 },
    { id: "skill8", label: "8th", level: 80 },
    { id: "skill9", label: "9th", level: 90 },
  ];

  const SKILL_COSTS = {
    skill1: 50,
    skill2: 100,
    skill3: 150,
    skill4: 220,
    skill5: 300,
    skill6: 400,
    mandala: 600,
    skill8: 800,
    skill9: 1000,
  };

  const SKILL_MULTIPLIERS = {
    skill1: 1.5,
    skill2: 2,
    skill3: 2.5,
    skill4: 3,
    skill5: 4,
    skill6: 5,
    mandala: 7,
    skill8: 9,
    skill9: 12,
  };

  const SHOP_PRICES = {
    externalManualBuy: 10,
    internalManualBuy: 10,
    swordManualBuy: 30,
    externalManualSell: 5,
    internalManualSell: 5,
    swordManualSell: 12,
    martialManualTicket: 12,
    spellBasicChoice: 3,
    spellIntermediateChoice: 9,
    spellAdvancedChoice: 27,
    spellBasicSell: 1,
    spellIntermediateSell: 3,
    spellAdvancedSell: 9,
  };

  const spellRows = [
    [1, "basic", "light", "라이트", 50, "light", "utility", "self", 0, "주변을 밝히고 짧은 명중 보조", "handSign"],
    [1, "basic", "fire", "파이어", 50, "fire", "projectile", "enemy", 40, "화염 투사체", "handSign"],
    [1, "basic", "ice", "아이스", 50, "ice", "projectile", "enemy", 35, "짧은 둔화", "handSign"],
    [1, "basic", "wind", "윈드", 50, "wind", "projectile", "enemy", 35, "약한 넉백", "handSign"],
    [1, "basic", "magic_arrow", "매직 애로우", 50, "utility", "projectile", "enemy", 45, "순수 마나 화살", "handSign"],
    [1, "basic", "grease", "그리스", 60, "utility", "area", "ground", 0, "적 이동속도 감소", "chant"],
    [1, "basic", "dig", "디그", 60, "earth", "area", "ground", 30, "작은 지형 충격", "chant"],
    [1, "basic", "darkness", "다크니스", 60, "dark", "debuff", "enemy", 0, "적 추적/명중 약화", "chant"],
    [2, "basic", "shining_arrow", "샤이닝 애로우", 80, "light", "projectile", "enemy", 75, "빛 화살", "chant"],
    [2, "basic", "fire_arrow", "파이어 애로우", 80, "fire", "projectile", "enemy", 80, "화염 화살", "chant"],
    [2, "basic", "ice_arrow", "아이스 애로우", 80, "ice", "projectile", "enemy", 70, "둔화 화살", "chant"],
    [2, "basic", "wind_arrow", "윈드 애로우", 80, "wind", "projectile", "enemy", 70, "넉백 화살", "chant"],
    [2, "basic", "rock_arrow", "록 애로우", 80, "earth", "projectile", "enemy", 85, "바위 화살", "chant"],
    [2, "basic", "lightning_arrow", "라이트닝 애로우", 80, "lightning", "projectile", "enemy", 85, "번개 화살", "chant"],
    [2, "basic", "shield", "쉴드", 90, "defense", "shield", "self", 0, "피해 감소 보호막", "chant"],
    [2, "basic", "heal", "힐", 90, "heal", "heal", "self", 0, "HP 회복", "chant"],
    [2, "basic", "ice_fog", "아이스 포그", 90, "ice", "area", "ground", 30, "범위 둔화", "chant"],
    [2, "basic", "dark_arrow", "다크 애로우", 80, "dark", "projectile", "enemy", 80, "암흑 화살", "chant"],
    [3, "intermediate", "shining_defense", "샤이닝 디펜스", 140, "light", "shield", "self", 0, "강한 방어막", "mixed"],
    [3, "intermediate", "fire_ball", "파이어 볼", 140, "fire", "projectile", "enemy", 120, "폭발 범위 피해", "mixed"],
    [3, "intermediate", "ice_ball", "아이스 볼", 140, "ice", "projectile", "enemy", 110, "둔화 폭발", "mixed"],
    [3, "intermediate", "wind_cutter", "윈드 커터", 120, "wind", "projectile", "enemy", 115, "바람 칼날", "mixed"],
    [3, "intermediate", "stone_spike", "스톤 스파이크", 140, "earth", "area", "enemy", 125, "지면 가시", "mixed"],
    [3, "intermediate", "raidein", "라이데인", 160, "lightning", "instant", "enemy", 140, "즉발 번개", "mixed"],
    [3, "intermediate", "sleep", "슬립", 120, "mental", "debuff", "enemy", 0, "짧은 행동 정지", "mixed"],
    [3, "intermediate", "cancellation", "캔슬레이션", 140, "utility", "debuff", "enemy", 0, "적 버프 제거", "mixed"],
    [3, "intermediate", "bone_binding", "본 바인딩", 140, "necro", "debuff", "enemy", 50, "속박", "mixed"],
    [3, "intermediate", "dark_ball", "다크 볼", 140, "dark", "projectile", "enemy", 120, "암흑 구체", "mixed"],
    [3, "intermediate", "web", "웹", 120, "utility", "area", "ground", 0, "이동 제한", "mixed"],
    [3, "intermediate", "memorize", "메모라이즈", 120, "utility", "buff", "self", 0, "다음 마법 준비시간 또는 쿨타임 감소", "mixed"],
    [4, "intermediate", "shining_wave", "샤이닝 웨이브", 240, "light", "area", "forward", 190, "빛 파동", "magicCircle"],
    [4, "intermediate", "shining_enchant", "샤이닝 인첸트", 180, "light", "buff", "self", 0, "기본 공격에 빛 속성 부여", "magicCircle"],
    [4, "intermediate", "shining_blaster", "샤이닝 블레스터", 210, "light", "beam", "enemy", 210, "빛 광선", "magicCircle"],
    [4, "intermediate", "fire_lance", "파이어 랜스", 210, "fire", "projectile", "enemy", 220, "화염 창", "magicCircle"],
    [4, "intermediate", "ice_spear", "아이스 스피어", 210, "ice", "projectile", "enemy", 200, "강한 둔화", "magicCircle"],
    [4, "intermediate", "aero_bomb", "에어로 봄", 180, "wind", "area", "enemy", 170, "넉백 폭발", "magicCircle"],
    [4, "intermediate", "earth_break", "어스 브레이크", 240, "earth", "area", "ground", 230, "지면 파괴", "magicCircle"],
    [4, "intermediate", "blind", "블라인드", 180, "mental", "debuff", "enemy", 0, "적 공격 정확도 감소", "magicCircle"],
    [4, "intermediate", "slow", "슬로우", 180, "utility", "debuff", "enemy", 0, "이동/공격 속도 감소", "magicCircle"],
    [4, "intermediate", "silence", "사일런스", 180, "utility", "debuff", "enemy", 0, "적 마법 제한", "magicCircle"],
    [4, "intermediate", "illusion", "일루젼", 180, "mental", "buff", "self", 0, "회피 보조", "magicCircle"],
    [4, "intermediate", "confusion", "컨퓨전", 180, "mental", "debuff", "enemy", 0, "적 행동 지연", "magicCircle"],
    [5, "advanced", "invisibility", "인비저빌리티", 260, "utility", "buff", "self", 0, "적 추적 약화", "magicCircle"],
    [5, "advanced", "distortion", "디스토션", 300, "space", "area", "enemy", 230, "위치 왜곡/넉백", "magicCircle"],
    [5, "advanced", "shining_field", "샤이닝 필드", 340, "light", "field", "ground", 80, "빛 영역 지속 피해", "magicCircle"],
    [5, "advanced", "laser", "레이져", 300, "utility", "beam", "enemy", 280, "순수 마력 레이저", "magicCircle"],
    [5, "advanced", "barrier", "배리어", 300, "defense", "shield", "self", 0, "강한 방어막", "magicCircle"],
    [5, "advanced", "explosion", "익스플로전", 340, "fire", "area", "enemy", 320, "폭발", "magicCircle"],
    [5, "advanced", "chain_lightning", "체인 라이트닝", 340, "lightning", "projectile", "enemy", 300, "연쇄 번개", "magicCircle"],
    [5, "advanced", "fire_wall", "파이어 월", 300, "fire", "field", "ground", 70, "화염 장벽 지속 피해", "magicCircle"],
    [5, "advanced", "blink", "블링크", 260, "space", "movement", "self", 0, "짧은 순간이동", "magicCircle"],
    [5, "advanced", "gravity_5", "그래비티", 300, "gravity", "area", "enemy", 180, "강한 중력 둔화", "magicCircle"],
    [5, "advanced", "dark_field", "다크 필드", 340, "dark", "field", "ground", 80, "어둠 영역 지속 피해", "magicCircle"],
    [5, "advanced", "life_drain", "라이프 드레인", 300, "dark", "beam", "enemy", 220, "피해 일부 HP 회복", "magicCircle"],
    [6, "advanced", "shining_laser", "샤이닝 레이져", 430, "light", "beam", "enemy", 420, "고위 빛 광선", "doubleMagicCircle"],
    [6, "advanced", "summon_shining", "서먼 샤이닝", 500, "light", "summon", "self", 0, "빛 소환체 임시 생성", "doubleMagicCircle"],
    [6, "advanced", "anti_magic_shell", "안티 매직 쉘", 500, "defense", "shield", "self", 0, "마법 피해 감소", "doubleMagicCircle"],
    [6, "advanced", "pillar_of_fire", "필라 오브 파이어", 430, "fire", "area", "enemy", 430, "불기둥", "doubleMagicCircle"],
    [6, "advanced", "giga_raidein", "기가 라이데인", 500, "lightning", "instant", "enemy", 500, "강력한 즉발 번개", "doubleMagicCircle"],
    [6, "advanced", "tornado", "토네이도", 430, "wind", "area", "enemy", 400, "강한 넉백", "doubleMagicCircle"],
    [6, "advanced", "dispel", "디스펠", 380, "utility", "debuff", "enemy", 0, "적 버프/영역 제거", "doubleMagicCircle"],
    [6, "advanced", "great_shield", "그레이트 쉴드", 430, "defense", "shield", "self", 0, "매우 강한 방어막", "doubleMagicCircle"],
    [6, "advanced", "teleport", "텔레포트", 430, "space", "movement", "self", 0, "지정 방향 순간이동", "doubleMagicCircle"],
    [6, "advanced", "great_heal", "그레이트 힐", 430, "heal", "heal", "self", 0, "큰 HP 회복", "doubleMagicCircle"],
    [6, "advanced", "dark_cannon", "다크 캐논", 430, "dark", "projectile", "enemy", 430, "암흑 포격", "doubleMagicCircle"],
    [6, "advanced", "summon_bone_wyvern", "서먼 본 와이번", 500, "necro", "summon", "self", 0, "뼈 와이번 임시 소환", "doubleMagicCircle"],
    [7, "grimoire", "shining_judgment", "샤이닝 저지먼트", 700, "light", "area", "enemy", 650, "빛 심판", "greatMagicCircle"],
    [7, "grimoire", "heavens_door", "헤븐스 도어", 700, "light", "field", "ground", 500, "빛 영역", "greatMagicCircle"],
    [7, "grimoire", "inferno", "인페르노", 600, "fire", "area", "enemy", 600, "지옥불", "greatMagicCircle"],
    [7, "grimoire", "blizzard", "블리자드", 600, "ice", "area", "enemy", 570, "강한 둔화", "greatMagicCircle"],
    [7, "grimoire", "earth_quake", "어스 퀘이크", 700, "earth", "area", "ground", 700, "지진", "greatMagicCircle"],
    [7, "grimoire", "wind_storm", "윈드 스톰", 600, "wind", "area", "enemy", 560, "강한 넉백", "greatMagicCircle"],
    [7, "grimoire", "warp", "워프", 520, "space", "movement", "self", 0, "공간 이동", "greatMagicCircle"],
    [7, "grimoire", "reflection", "리플렉션", 600, "defense", "shield", "self", 0, "일부 피해 반사", "greatMagicCircle"],
    [7, "grimoire", "gravity_7", "그래비티", 600, "gravity", "area", "enemy", 450, "강한 중력장", "greatMagicCircle"],
    [7, "grimoire", "summon_deathknight", "서먼 데스나이트", 700, "necro", "summon", "self", 0, "데스나이트 임시 소환", "greatMagicCircle"],
    [8, "grimoire", "sword_of_revenge_light", "소드 오브 리벤지 라이트", 820, "light", "projectile", "enemy", 820, "복수의 빛검", "multiLayerMagicCircle"],
    [8, "grimoire", "shining_rain", "샤이닝 레인", 820, "light", "area", "enemy", 780, "빛의 비", "multiLayerMagicCircle"],
    [8, "grimoire", "volcano", "볼케이노", 950, "fire", "area", "ground", 950, "화산 분출", "multiLayerMagicCircle"],
    [8, "grimoire", "ice_crystal_storm", "아이스 크리스탈 오브 스톰", 950, "ice", "area", "enemy", 900, "얼음 폭풍", "multiLayerMagicCircle"],
    [8, "grimoire", "fury_of_the_heaven", "퓨리 오브 더 헤븐", 950, "light", "area", "enemy", 950, "천상의 분노", "multiLayerMagicCircle"],
    [8, "grimoire", "lightning_infinity", "라이트닝 인피니티", 950, "lightning", "area", "enemy", 950, "무한 번개", "multiLayerMagicCircle"],
    [8, "grimoire", "control_weather", "컨트롤 웨더", 700, "utility", "field", "ground", 300, "전투 환경 변화", "multiLayerMagicCircle"],
    [8, "grimoire", "mass_teleport", "매스 텔레포트", 820, "space", "movement", "self", 0, "강화 텔레포트", "multiLayerMagicCircle"],
    [8, "grimoire", "hellfire", "헬파이어", 950, "dark", "area", "enemy", 950, "지옥불", "multiLayerMagicCircle"],
    [8, "grimoire", "summon_bone_dragon", "서먼 본 드래곤", 950, "necro", "summon", "self", 0, "뼈 드래곤 임시 소환", "multiLayerMagicCircle"],
    [9, "grimoire", "meteor_strike", "메테오 스트라이크", 1400, "fire", "area", "enemy", 1400, "운석 낙하", "grandRitualCircle"],
    [9, "grimoire", "meteor_swarm", "메테오 스웜", 1200, "fire", "area", "enemy", 1200, "운석 무리", "grandRitualCircle"],
    [9, "grimoire", "absolute_zero_point", "앱솔루트 제로 포인트", 1400, "ice", "area", "enemy", 1350, "극대 둔화/빙결 연출", "grandRitualCircle"],
    [9, "grimoire", "lightning_world", "라이트닝 월드", 1200, "lightning", "area", "enemy", 1200, "번개 세계", "grandRitualCircle"],
    [9, "grimoire", "ruin_of_ground", "루인 오브 그라운드", 1200, "earth", "area", "ground", 1200, "대지 붕괴", "grandRitualCircle"],
    [9, "grimoire", "elemental_punishment", "엘리멘탈 퍼니시먼트", 1400, "utility", "area", "enemy", 1400, "원소 징벌", "grandRitualCircle"],
    [9, "grimoire", "absolute_shield", "앱솔루트 쉴드", 1200, "defense", "shield", "self", 0, "최상급 방어막", "grandRitualCircle"],
    [9, "grimoire", "warp_gate", "워프 게이트", 900, "space", "movement", "self", 0, "공간문 이동", "grandRitualCircle"],
    [9, "grimoire", "power_word_kill", "파워 워드 킬", 1400, "dark", "instant", "enemy", 1600, "강한 단일 즉발 피해", "grandRitualCircle"],
    [9, "grimoire", "necropolis", "네크로폴리스", 1400, "necro", "field", "ground", 1000, "네크로 영역", "grandRitualCircle"],
  ];

  const prepareTimeByMethod = {
    handSign: 0.4,
    chant: 0.6,
    mixed: 0.8,
    magicCircle: 1,
    doubleMagicCircle: 1.6,
    greatMagicCircle: 2,
    multiLayerMagicCircle: 2.5,
    grandRitualCircle: 3,
  };

  function defaultDuration(type, circle) {
    if (type === "field") return 8 + circle * 2;
    if (["buff", "shield", "debuff", "summon"].includes(type)) return type === "summon" ? 8 + circle * 2 : 5 + circle * 2;
    return 0;
  }

  function defaultCooldown(type, circle) {
    if (type === "field") return 6 + circle;
    if (["buff", "shield", "debuff"].includes(type)) return 4 + circle;
    if (type === "summon") return 8 + circle;
    if (type === "movement") return 4 + circle * 0.5;
    return 1.2 + circle * 0.35;
  }

  const MAGIC_LIST = spellRows.map(([circle, grade, id, name, mpCost, attribute, type, targetType, damage, description, prepareMethod]) => ({
    id,
    name,
    circle,
    grade,
    mpCost,
    attribute,
    type,
    targetType,
    damage,
    duration: defaultDuration(type, circle),
    cooldown: defaultCooldown(type, circle),
    prepareMethod,
    prepareTime: prepareTimeByMethod[prepareMethod] || 0.8,
    description,
  }));

  const MAGIC_BY_ID = Object.fromEntries(MAGIC_LIST.map((spell) => [spell.id, spell]));
  const MAGIC_BY_GRADE = MAGIC_LIST.reduce((acc, spell) => {
    acc[spell.grade] = acc[spell.grade] || [];
    acc[spell.grade].push(spell);
    return acc;
  }, { basic: [], intermediate: [], advanced: [], grimoire: [] });
  const MAGIC_BY_CIRCLE = MAGIC_LIST.reduce((acc, spell) => {
    acc[spell.circle] = acc[spell.circle] || [];
    acc[spell.circle].push(spell);
    return acc;
  }, { 10: [] });

  function randInt(maxExclusive) {
    return Math.floor(Math.random() * maxExclusive);
  }

  function pickWeighted(entries) {
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * total;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) return entry.value;
    }
    return entries[entries.length - 1].value;
  }

  function pickRandom(list) {
    return list[randInt(list.length)];
  }

  function getStatCap(level) {
    return level < 80 ? level + 20 : 100;
  }

  function createEmptyStats(value = 0) {
    return Object.fromEntries(STAT_KEYS.map((key) => [key, value]));
  }

  function getEffectiveStats(player) {
    const effective = {};
    STAT_KEYS.forEach((key) => {
      effective[key] = (player.primaryStats[key] || 0) + (player.bonusStats[key] || 0);
    });
    return effective;
  }

  function computeDerivedStats(player) {
    const stats = getEffectiveStats(player);
    const sword = SWORD_STAGES[player.swordStage] || SWORD_STAGES[0];
    const externalMultiplier = Math.pow(1.2, player.externalManualUseCount || 0);
    const internalMultiplier = Math.pow(1.1, player.internalManualUseCount || 0);
    const maxHp = Math.max(1, Math.floor(stats.vitality * 10 * externalMultiplier));
    const baseMp = (player.level || 1) * 5 + stats.intelligence * 10;
    const maxMp = Math.max(1, Math.floor(baseMp * internalMultiplier - sword.maxMpPenalty));
    const mpRegen = Math.max(0, ((player.level || 1) + stats.wisdom * 2) * internalMultiplier);
    const baseAttack = Math.floor((stats.strength + stats.vitality) / 5) + 2;
    const basicAttackDamage = Math.max(1, Math.floor(baseAttack * sword.attackMultiplier));
    return {
      maxHp,
      maxMp,
      mpRegen,
      basicAttackDamage,
      multiCastingCount: Math.max(1, player.multiCastingCount || 1),
      swordStageName: sword.name,
    };
  }

  function clampVitals(player) {
    player.officialDerivedStats = computeDerivedStats(player);
    player.currentHp = Math.min(player.officialDerivedStats.maxHp, Math.max(0, player.currentHp ?? player.officialDerivedStats.maxHp));
    player.currentMp = Math.min(player.officialDerivedStats.maxMp, Math.max(0, player.currentMp ?? player.officialDerivedStats.maxMp));
  }

  function createInitialInventory() {
    return {
      externalManual: 0,
      internalManual: 0,
      swordManual: 0,
      martialManualTicket: 0,
      spellBooks: [],
      grimoires: 0,
      multiCastingBooks: 0,
    };
  }

  function createDefaultPlayer() {
    const player = {
      profile: null,
      level: 1,
      floor: 1,
      coins: 0,
      statPoints: 0,
      rewardDrawTicketCount: 0,
      mantra: "",
      originalMana: { name: "", type: "attribute", description: "" },
      primaryStats: createEmptyStats(1),
      bonusStats: createEmptyStats(0),
      officialDerivedStats: {},
      combatTuning: {
        moveSpeed: 4.2,
        dodgeDistance: 2.6,
        dodgeInvincibleTime: 0.12,
        guardReduction: 0.65,
        attackCooldown: 0.32,
        magicCooldown: 0.35,
        skillCooldown: 0.65,
      },
      currentHp: 10,
      currentMp: 15,
      externalManualUseCount: 0,
      internalManualUseCount: 0,
      swordStage: 0,
      multiCastingCount: 1,
      preparedSpells: [],
      preparingSpell: null,
      skills: {},
      equippedSkillId: null,
      mandalaActive: false,
      equippedMagicId: "fire",
      magicList: ["fire"],
      inventory: createInitialInventory(),
      temporaryBuffs: [],
    };
    clampVitals(player);
    return player;
  }

  function createDefaultGameState() {
    return {
      gameState: GAME_STATES.TITLE,
      currentMode: "title",
      player: createDefaultPlayer(),
      currentRewards: [],
      rewardSelectionState: { active: false, selected: false },
      floorState: { enemyHp: null, rewardGranted: false, enemyRole: "melee" },
      innerWorld: { openedUI: null, trainingDummyActive: false, noticeSeen: false },
      playerPosition: { x: 0, y: 1, z: 0 },
      lastMessage: "",
    };
  }

  function createPlayerFromCreation(form) {
    const player = createDefaultPlayer();
    player.profile = {
      name: form.name.trim(),
      gender: form.gender.trim(),
      worldDestructionCause: form.worldDestructionCause.trim(),
      destroyer: form.destroyer.trim(),
      destroyerShape: form.destroyerShape.trim(),
      destroyerCombatStyle: form.destroyerCombatStyle.trim(),
      finalMoment: form.finalMoment.trim(),
      goal: form.goal.trim(),
      strongestEmotion: form.strongestEmotion.trim(),
    };
    player.mantra = form.mantra;
    player.originalMana = {
      name: form.originalManaName.trim(),
      type: form.originalManaType,
      description: form.originalManaDescription.trim(),
    };
    STAT_KEYS.forEach((key) => {
      player.primaryStats[key] = 1 + (form.allocatedStats[key] || 0);
    });
    player.currentHp = 999999;
    player.currentMp = 999999;
    clampVitals(player);
    return player;
  }

  function rollReward() {
    const type = pickWeighted([
      { weight: 40, value: "coin_1" },
      { weight: 30, value: "coin_2" },
      { weight: 15, value: "martialManual" },
      { weight: 15, value: "spellBook" },
    ]);
    if (type === "coin_1") return { id: `coin1_${Date.now()}_${Math.random()}`, type, label: "추가 코인 +1", amount: 1 };
    if (type === "coin_2") return { id: `coin2_${Date.now()}_${Math.random()}`, type, label: "추가 코인 +2", amount: 2 };
    if (type === "martialManual") {
      const manualType = pickWeighted([
        { weight: 40, value: "externalManual" },
        { weight: 40, value: "internalManual" },
        { weight: 20, value: "swordManual" },
      ]);
      const labels = { externalManual: "외공서", internalManual: "내공서", swordManual: "검기" };
      return { id: `${manualType}_${Date.now()}_${Math.random()}`, type, manualType, label: `${labels[manualType]} +1` };
    }
    const bookType = pickWeighted([
      { weight: 50, value: "basic" },
      { weight: 30, value: "intermediate" },
      { weight: 10, value: "advanced" },
      { weight: 9, value: "multiCastingBook" },
      { weight: 1, value: "grimoire" },
    ]);
    if (bookType === "multiCastingBook") return { id: `multi_${Date.now()}_${Math.random()}`, type, bookType, label: "멀티케스팅의 서 +1" };
    if (bookType === "grimoire") return { id: `grimoire_${Date.now()}_${Math.random()}`, type, bookType, label: "마도서 +1" };
    return { id: `spellbook_${bookType}_${Date.now()}_${Math.random()}`, type, bookType, label: `${gradeLabel(bookType)} 마법서 +1` };
  }

  function gradeLabel(grade) {
    return { basic: "기초", intermediate: "중급", advanced: "고급", grimoire: "마도서" }[grade] || grade;
  }

  function createRewardChoices() {
    return [rollReward(), rollReward()];
  }

  function applyReward(player, reward) {
    if (reward.type === "coin_1" || reward.type === "coin_2") player.coins += reward.amount;
    if (reward.type === "martialManual") player.inventory[reward.manualType] += 1;
    if (reward.type === "spellBook") {
      if (reward.bookType === "multiCastingBook") player.inventory.multiCastingBooks += 1;
      else if (reward.bookType === "grimoire") player.inventory.grimoires += 1;
      else player.inventory.spellBooks.push({ id: reward.id, grade: reward.bookType });
    }
  }

  function rollSpellForGrade(grade) {
    if (grade === "grimoire") {
      const circle = 7 + randInt(3);
      return pickRandom(MAGIC_BY_CIRCLE[circle]);
    }
    return pickRandom(MAGIC_BY_GRADE[grade]);
  }

  function rollSpellBookLearn(player, grade) {
    const wisdom = getEffectiveStats(player).wisdom;
    const die = { basic: 50, intermediate: 70, advanced: 100, grimoire: 100 }[grade] || 50;
    const auto = (grade === "basic" && wisdom >= 50) || (grade === "intermediate" && wisdom >= 70) || (grade === "advanced" && wisdom >= 100);
    const roll = 1 + randInt(die);
    return { success: auto || roll < wisdom, roll, die, spell: rollSpellForGrade(grade) };
  }

  function createSkillForSlot(player, slotId) {
    const slot = SKILL_SLOTS.find((entry) => entry.id === slotId);
    if (!slot) return null;
    const mantra = player.mantra || "만트라";
    if (slotId === "mandala") {
      return {
        id: "mandala",
        slotId,
        name: `${mantra} 만다라`,
        type: "buff",
        mpCost: SKILL_COSTS[slotId],
        powerMultiplier: SKILL_MULTIPLIERS[slotId],
        description: `${mantra}의 심상영역을 펼쳐 1st~6th 스킬을 강화한다.`,
      };
    }
    const templates = [
      ["melee", `${mantra} 격참`, `${mantra}를 두른 근접 일격으로 적을 벤다.`],
      ["projectile", `${mantra} 투사`, `${mantra}의 형상을 압축해 전방으로 쏜다.`],
      ["area", `${mantra} 파문`, `${mantra}의 힘을 원형 충격으로 터뜨린다.`],
      ["defense", `${mantra} 수호`, `${mantra}를 방어막으로 전개하고 반격한다.`],
      ["movement", `${mantra} 돌진`, `${mantra}의 힘으로 파고들어 충돌 피해를 준다.`],
      ["buff", `${mantra} 각성`, `${mantra}를 일시 강화해 다음 타격을 증폭한다.`],
    ];
    const tpl = templates[SKILL_SLOTS.indexOf(slot) % templates.length];
    return {
      id: slotId,
      slotId,
      name: `${slot.label} ${tpl[1]}`,
      type: tpl[0],
      mpCost: SKILL_COSTS[slotId],
      powerMultiplier: SKILL_MULTIPLIERS[slotId],
      description: tpl[2],
    };
  }

  function requiredUncreatedSkills(player) {
    return SKILL_SLOTS.filter((slot) => player.level >= slot.level && !player.skills[slot.id]);
  }

  function createEnemyForPlayer(player, role) {
    const total = STAT_KEYS.reduce((sum, key) => sum + (player.primaryStats[key] || 0), 0);
    const enemyTotal = Math.max(6, Math.floor(total * 1.15));
    const weightsByRole = {
      melee: { strength: 35, vitality: 25, agility: 20, wisdom: 10, intelligence: 5, appearance: 5 },
      agile: { agility: 35, strength: 20, vitality: 20, wisdom: 10, intelligence: 10, appearance: 5 },
      defense: { vitality: 40, strength: 20, agility: 15, wisdom: 10, intelligence: 10, appearance: 5 },
      magic: { wisdom: 30, intelligence: 30, agility: 15, vitality: 15, strength: 5, appearance: 5 },
      mixed: { strength: 20, agility: 20, appearance: 15, intelligence: 15, vitality: 15, wisdom: 15 },
    };
    const weights = weightsByRole[role] || weightsByRole.melee;
    const stats = {};
    STAT_KEYS.forEach((key) => {
      stats[key] = Math.max(1, Math.floor((enemyTotal * weights[key]) / 100));
    });
    const level = player.level;
    return {
      role,
      level,
      stats,
      maxHp: stats.vitality * 10,
      maxMp: level * 5 + stats.intelligence * 10,
      mpRegen: level + stats.wisdom * 2,
      basicAttackDamage: Math.floor((stats.strength + stats.vitality) / 5) + 2,
    };
  }

  global.ManRPGData = {
    GAME_STATES,
    COMBAT_STATE,
    STAT_KEYS,
    STAT_LABELS,
    MANTRA_OPTIONS,
    SWORD_STAGES,
    SKILL_SLOTS,
    SKILL_COSTS,
    SKILL_MULTIPLIERS,
    SHOP_PRICES,
    MAGIC_LIST,
    MAGIC_BY_ID,
    MAGIC_BY_GRADE,
    MAGIC_BY_CIRCLE,
    createDefaultGameState,
    createDefaultPlayer,
    createPlayerFromCreation,
    createInitialInventory,
    createRewardChoices,
    applyReward,
    rollReward,
    rollSpellBookLearn,
    rollSpellForGrade,
    createSkillForSlot,
    requiredUncreatedSkills,
    computeDerivedStats,
    clampVitals,
    getEffectiveStats,
    getStatCap,
    createEmptyStats,
    createEnemyForPlayer,
    gradeLabel,
    pickRandom,
    randInt,
  };
})(window);
