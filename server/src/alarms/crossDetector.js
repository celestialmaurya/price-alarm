"use strict";

/**
 * Pure crossing rules. No state, no side effects - easy to test and to change
 * without touching the engine.
 *
 * `previous` is the last mid we saw for this alarm, `current` is the new mid.
 * Sitting exactly on the level is never a cross: the move has to come from
 * one side and reach the level.
 */
function detectCross(previous, current, level, direction) {
  if (previous === null || previous === undefined) return null;
  if (!Number.isFinite(previous) || !Number.isFinite(current)) return null;

  const up = previous < level && current >= level;
  const down = previous > level && current <= level;

  switch (direction) {
    case "rises_to":
      return up ? "up" : null;
    case "falls_to":
      return down ? "down" : null;
    case "either":
    default:
      if (up) return "up";
      if (down) return "down";
      return null;
  }
}

/**
 * After a ring, a repeat alarm has to see the other side of the level again
 * before it may ring once more.
 */
function hasLeftToOtherSide(firedDirection, current, level) {
  if (firedDirection === "up") return current < level;
  if (firedDirection === "down") return current > level;
  return current !== level;
}

module.exports = { detectCross, hasLeftToOtherSide };

