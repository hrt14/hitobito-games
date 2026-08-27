# career-interest-check — SPEC

## 1. One-line product definition
仕事選びに迷っている人が、3分・18問の具体的な仕事活動の比較から、自分が惹かれやすい仕事の方向と次に見る職業候補を得るLEVEL UPアプリ。

## 2. User / trigger / desired change
- User: 進路・転職・副業などで「自分は何の仕事に向いているか」を考えている人。
- Trigger: 職業一覧を眺めても候補が広すぎて選べないとき。
- Before: 自分の適性を抽象的な性格語で考えている。
- After: RIASECの上位2興味領域、仕事環境の条件、職業例、現実で試す1日実験が決まる。

## 3. Evidence / framing
- Framework: O*NET Interest Profiler / Holland RIASEC structure.
- Six areas: Realistic, Investigative, Artistic, Social, Enterprising, Conventional.
- This app is an original short self-check inspired by the framework. It is not the official O*NET Interest Profiler and does not copy official items.
- It measures self-reported occupational interest direction, not objective ability, hiring suitability, or guaranteed career success.
- Official references: https://www.onetcenter.org/IP.html and https://www.onetonline.org/explore/interests/

## 4. Core mechanic
- 18 pairwise “which activity would you rather do for three hours?” choices.
- First 15 questions cover all unordered pairs among six RIASEC areas once.
- Final 3 pairs are R-I, A-S, E-C so each area appears exactly six times.
- Pick left/right = 2 points to that area. “Both equally” = 1 point each.
- Each area max = 12. Display 0–100 normalized score.
- The act of choosing concrete activities, not abstract adjectives, is the learning interaction.

## 5. Result
- Top two RIASEC areas and two-letter code.
- Six score bars.
- Compatible work conditions based on top two.
- Six occupation examples from O*NET interest listings (three per top area), translated into Japanese.
- Skills that may be useful to develop. These are recommendations, not measured ability scores.
- One-day behavioral experiment to test the hypothesis in real life.
- Web Share API with clipboard fallback.
- Last result stored in localStorage only.

## 6. Accuracy guardrails
- Never say “this occupation is definitely suitable.”
- Never label the score as intelligence, talent, competence, or hiring aptitude.
- Start/result screens explicitly state that this is career exploration based on interests.
- Official source links remain visible on result screen.

## 7. UX
- Mobile first, no tutorial screen.
- Start → immediate first choice.
- Touch targets >= 44px.
- Keyboard: left/1, right/2, down/0.
- prefers-reduced-motion respected.
- No external runtime dependencies or blocking network requests.
- Back to LEVEL UP via `/`.

## 8. Share loop
Result text contains type code + result label + direct app URL so the recipient can immediately take the same check.

## 9. Quality self-score before production
- Clarity: 9/10
- Usefulness: 8/10
- Interaction feel: 8/10
- Uniqueness: 8/10
- Replayability: 7/10 (retake is useful after career experiments; not designed as daily play)
