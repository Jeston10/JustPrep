/** @type {import("@commitlint/types").UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Types allowed in this repo (AGENTS.md §4). "security" is added on top of the conventional set.
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "security",
        "refactor",
        "perf",
        "docs",
        "test",
        "chore",
        "ci",
        "build",
        "style",
        "revert",
      ],
    ],
    "subject-case": [0],
    "header-max-length": [2, "always", 72],
  },
};

export default config;
