(function initSkillSystem(global) {
  function useSkill(skillId, context) {
    if (!context?.player?.skills) return { ok: false, reason: "no_player" };
    const skill = Object.values(context.player.skills.slots).find((s) => s && s.id === skillId);
    if (!skill) return { ok: false, reason: "not_found" };
    if (typeof context.execute !== "function") return { ok: false, reason: "no_execute" };
    return context.execute(skill);
  }

  global.useSkill = useSkill;
})(window);
