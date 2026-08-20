# LEVEL UP Plugin — Public Submission Checklist

## Architecture

- Submission type: **Skills only**
- Plugin name: **LEVEL UP**
- Initial language: **Japanese**
- MCP server: **None in v0.1**
- Core job: turn a problem ChatGPT already understands into a 30–90 second interactive practice.

## Public listing draft

### Short description

説明より先に、30〜90秒の実践。

### Long description

ChatGPTが会話からすでに理解した悩みや目標を、もう一度診断し直さず、その場で30〜90秒の短い練習に変えます。先延ばし、反芻、気持ちの切り替え、境界線、集中、優先順位、会話などを、読むだけではなく実際に判断・選択・行動する形で練習します。

### Category

Productivity

### Website

https://levelup.hitobito.jp/

### Support

https://levelup.hitobito.jp/support/

### Privacy

https://levelup.hitobito.jp/privacy/

### Terms

https://levelup.hitobito.jp/terms/

### Publisher

株式会社まんがびと

Company page: https://mangabito.biz/?page_id=6081

## Starter prompts

1. 会議で変なことを言った気がして引きずってる。1分で切り替える練習をしたい
2. 仕事を先延ばししてる。今すぐ動けるようにして
3. 相手の反応が気になりすぎる。課題を分ける練習をしたい
4. やることが多すぎる。一個に絞る練習をしたい

## Review test cases

Public submission requires five positive and three negative cases. Final cases are in:

`skills/level-up-practice/references/evals.md`

## Release notes v0.1.0

Initial Japanese Skills-only release. Adds one focused practice workflow that converts already-understood user goals into a short in-chat exercise, with optional links to matching LEVEL UP web trainings for further repetition.

## Human-only steps after technical verification

1. Open the OpenAI Platform organization that will publish LEVEL UP.
2. Confirm the submitter has **Apps Management: Write** (organization owners already have it).
3. Complete **business verification** for 株式会社まんがびと, or choose an already verified matching publisher identity.
4. Open the plugin submission portal and create a **Skills only** draft.
5. Upload the final skill bundle from `plugins/level-up/skills/`.
6. Enter the listing details and URLs above, upload the production logo, and paste the starter prompts/test cases.
7. Select availability and complete the policy attestations.
8. Submit for review.

Do not submit until the live privacy, terms and support URLs return HTTP 200 and match the publisher identity.
