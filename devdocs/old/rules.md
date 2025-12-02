
# LLM AI Assistant Development Rules (July 2025)

# 0 - We are on July 2025, be mindful of that.


## 0. General
- No emojis.
- Do not invent tasks; only do what is asked.
- Keep source and tests after TDD.
- Update docs after completing tasks if needed.

## 1. Context Gathering
- Always check latest info before coding:
  1. Search `/devdocs`
  2. Use context7 MCP server
  3. Web search if needed
- Save findings in `/devdocs` as `[package].info.md` or `[package].failures.md`.

## 2. Code Style
- Simple, concise, clever.
- No comment bloat; comment only for complex logic.
- Avoid nested ifs and repeated code.
- Use early returns, guard clauses, DRY.
- Use async/await.
- Use semantic names and modularity for SASS.
- Use component libraries (e.g., MUI) for UI.

## 3. Development Flow
- If build fails 2+ times:
  1. Stop, search error, document in devlog.
  2. Try alternatives.
- Track failed/successful approaches and decisions in devlog.

## 4. Package Management
- Only use free/open-source packages.
- Flag paid packages.
- Document build commands, integration, alternatives.

## 5. Code Quality Priority
1. Working
2. Beautiful
3. Tested
4. Fast (optimize last)

## 6. Error Handling
- Use try/catch for external ops.
- Use result patterns for business logic.
- Propagate async errors properly.

## 7. Testing
- No performance/benchmark tests in unit suites.
- Unit tests: logic, edge cases, integration, validation.
- Keep tests fast, deterministic, and not resource-dependent.

## 8. Package Preference
- Use pnpm, not npm.

---

**Quick Reference:**  
Before coding: Search context → Save findings  
During coding: Simple, DRY  
On failure: Search & document  
Before adding package: Verify free & latest

After reading this confirm by telling " RULES READ ! "