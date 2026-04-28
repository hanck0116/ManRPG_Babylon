(function initSkills(global) {
  let activePlayer = null;

  function createSkillState() {
    const slots = {};
    global.SKILL_SLOTS.forEach((slot) => {
      slots[slot.id] = null;
    });
    return {
      slots,
      battleLoadout: ["skill1", "skill2", "skill3"],
      selectedSlotId: null,
      cooldowns: {},
    };
  }

  function getUnlockedSkillSlots(level) {
    if (level < 10) return [];
    return global.SKILL_SLOTS.filter((slot) => level >= slot.unlockLevel).map((slot) => slot.id);
  }

  function getPendingSkillSlot(player) {
    if (!player?.skills) return null;
    const unlocked = getUnlockedSkillSlots(player.level || 1);
    return unlocked.find((slotId) => !player.skills.slots[slotId]) || null;
  }

  function normalizeSkillName(slotId, type, name) {
    const meta = global.getSkillSlotMeta(slotId);
    if (name && name.trim()) return name.trim();
    return `${meta?.label || slotId} ${type}`;
  }

  function setSkillPlayerContext(player) {
    activePlayer = player;
  }

  function createSkill(slotId, config = {}) {
    if (!activePlayer?.skills) return { ok: false, reason: "no_player" };
    const meta = global.getSkillSlotMeta(slotId);
    if (!meta) return { ok: false, reason: "invalid_slot" };
    if ((activePlayer.level || 1) < meta.unlockLevel) return { ok: false, reason: "not_unlocked" };
    if (activePlayer.skills.slots[slotId]) return { ok: false, reason: "already_created" };

    const type = config.type;
    if (!global.SKILL_TYPES.includes(type)) return { ok: false, reason: "invalid_type" };

    const attribute = global.SKILL_ATTRIBUTES.includes(config.attribute) ? config.attribute : "neutral";
    const skill = {
      id: `${slotId}_${Date.now()}`,
      slotId,
      name: normalizeSkillName(slotId, type, config.name),
      type,
      attribute,
      description: (config.description || "").trim(),
      tierMultiplier: global.getSkillTierMultiplier(slotId),
      mpCost: global.getSkillMpCost(slotId),
      cooldownSec: config.cooldownSec || (meta.isMandala ? 7.5 : 2.4),
      isMandala: !!meta.isMandala,
    };

    activePlayer.skills.slots[slotId] = skill;
    if (!activePlayer.skills.selectedSlotId) {
      activePlayer.skills.selectedSlotId = slotId;
    }
    return { ok: true, skill };
  }

  function getCreatedSkills(player = activePlayer) {
    if (!player?.skills) return [];
    return global.SKILL_SLOTS.map((slot) => player.skills.slots[slot.id]).filter(Boolean);
  }

  function selectBattleSkill(slotId, player = activePlayer) {
    if (!player?.skills?.slots[slotId]) return false;
    player.skills.selectedSlotId = slotId;
    return true;
  }

  function selectNextBattleSkill(player = activePlayer) {
    if (!player?.skills) return null;
    const created = getCreatedSkills(player);
    if (!created.length) {
      player.skills.selectedSlotId = null;
      return null;
    }

    const ids = created.map((s) => s.slotId);
    if (!player.skills.selectedSlotId || !ids.includes(player.skills.selectedSlotId)) {
      player.skills.selectedSlotId = ids[0];
      return player.skills.slots[player.skills.selectedSlotId];
    }

    const idx = ids.indexOf(player.skills.selectedSlotId);
    const next = ids[(idx + 1) % ids.length];
    player.skills.selectedSlotId = next;
    return player.skills.slots[next];
  }

  function canUseSkill(skill, playerState, nowSec, player = activePlayer) {
    if (!skill || !player?.skills) return { ok: false, reason: "no_skill" };
    const readyAt = player.skills.cooldowns[skill.slotId] || 0;
    if (nowSec < readyAt) return { ok: false, reason: "cooldown", remain: readyAt - nowSec };
    if (playerState.mp < skill.mpCost) return { ok: false, reason: "mp" };
    return { ok: true };
  }

  function markSkillUsed(skill, nowSec, player = activePlayer) {
    if (!player?.skills || !skill) return;
    player.skills.cooldowns[skill.slotId] = nowSec + skill.cooldownSec;
  }

  function resetSkill(slotId) {
    if (!activePlayer?.skills) return false;
    if (!activePlayer.skills.slots[slotId]) return false;
    activePlayer.skills.slots[slotId] = null;
    delete activePlayer.skills.cooldowns[slotId];
    if (activePlayer.skills.selectedSlotId === slotId) {
      activePlayer.skills.selectedSlotId = null;
      selectNextBattleSkill(activePlayer);
    }
    return true;
  }

  global.createSkillState = createSkillState;
  global.getUnlockedSkillSlots = getUnlockedSkillSlots;
  global.getPendingSkillSlot = getPendingSkillSlot;
  global.setSkillPlayerContext = setSkillPlayerContext;
  global.createSkill = createSkill;
  global.canUseSkill = canUseSkill;
  global.resetSkill = resetSkill;
  global.selectBattleSkill = selectBattleSkill;
  global.selectNextBattleSkill = selectNextBattleSkill;
  global.getCreatedSkills = getCreatedSkills;
  global.markSkillUsed = markSkillUsed;
})(window);
