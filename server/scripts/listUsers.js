"use strict";

/**
 * Shows every user file and what is inside it:
 *   node scripts/listUsers.js
 *   node scripts/listUsers.js amit
 */
const userStore = require("../src/storage/userStore");

async function main() {
  const wanted = (process.argv[2] || "").toLowerCase();
  const names = wanted ? [wanted] : await userStore.listUsernames();

  if (names.length === 0) {
    console.log("no user files yet, create one with: npm run create-user amit");
    return;
  }

  for (const name of names) {
    const entry = await userStore.read(name);
    if (!entry) {
      console.log(`${name}: file not found`);
      continue;
    }
    const { user } = entry;
    console.log(`\n${name}.alarms`);
    console.log(`  devices: ${user.deviceTokens.length}`);
    user.priceAlarms.forEach((a) => {
      console.log(
        `  - ${a.instrument} @ ${a.price} ${a.direction} ` +
          `${a.repeat ? "repeat" : "once"} ${a.state}` +
          (a.lastFiredAt ? ` lastFired=${a.lastFiredAt}` : "")
      );
    });
  }
  console.log("");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

