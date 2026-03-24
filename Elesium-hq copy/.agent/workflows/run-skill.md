---
description: How to run any skill from the skills directory
---

# Running a Skill

1. Identify the skill you need from `skills/` directory. Each skill has a `SKILL.md` with instructions.
2. Read the `SKILL.md` for the chosen skill:
   ```bash
   cat skills/<skill-name>/SKILL.md
   ```
3. Follow the instructions in the SKILL.md — they will tell you which scripts to run and in what order.
4. Scripts live in `skills/<skill-name>/scripts/`. Run them like:
   ```bash
   python3 skills/<skill-name>/scripts/<script>.py [args]
   ```
5. If the skill needs environment variables, check `.env.example` and ensure `.env` is configured.
6. If something breaks, read the error, fix the script, and update the SKILL.md with what you learned (self-annealing).
