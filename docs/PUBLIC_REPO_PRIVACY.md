# Public repository privacy rules

`hrt14/hitobito-games` is a public code repository. Treat every Issue, pull request, commit message, branch name, Actions run title, workflow log, checked-in file, and generated status issue as publicly readable.

## Never publish raw user context

Do not copy raw free-text requests, personal episodes, private conversations, names, email addresses, phone numbers, addresses, family/school/health details, employer/client internal details, or other user-specific context into this public repository unless that exact text is intentionally part of the public product itself.

This rule applies even when the information is not a credential or legal secret. Personal context is private by default.

## Public identifiers only

Public operational records should use opaque identifiers and non-sensitive metadata, for example:

- request ID
- game/app slug
- issue/PR number
- generic request type (`create`, `improve`, `bug`)
- build/commit SHA
- test/deploy state
- public production URL

Do not put a request's free-text prompt in an Issue/PR/commit title, branch name, Actions `run-name`, workflow summary, status issue, or log line.

## Private request queue

LEVEL UP feedback and OneShotGames creator requests that contain free text must be written only to the dedicated private request repository configured by:

- repository variable: `PRIVATE_REQUEST_REPOSITORY`
- repository secret: `PRIVATE_REQUEST_TOKEN`

Sync workflows must verify through the GitHub API that the configured target repository is private before sending any user text.

If either setting is missing, the token cannot access the target, or the target is not private, **fail closed**: leave the request in Firestore and do not create a public fallback Issue.

The public `hitobito-games` repository remains the code/deployment repository. The private repository is a lightweight work queue and should not run heavy build/deploy Actions.

## AI development rule

When implementing an app inspired by a user's personal story, abstract the story into the minimum product requirement needed for implementation. PR descriptions and commit messages should describe the product behavior, not the user's original episode.

If a concrete detail is intentionally shown in the public app itself, it may exist in source code because it is already product content. Otherwise, omit it.

## Logs and status reporting

Do not mirror raw build/sync logs into public Issues. Public status reporting should contain only outcome, run URL, commit SHA, and a short generic error class when needed.

Workflow console output must not echo user free text. Redact or suppress it before it reaches public Actions logs.

## Secrets

This privacy policy does not replace secret-management rules. API keys, private keys, passwords, PATs, service-account credentials, and other secrets must never be committed, even to a private repository. Use GitHub Secrets, Workload Identity Federation, or an appropriate secret manager.
