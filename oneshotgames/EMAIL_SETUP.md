# OneShotGames completion email setup

OneShotGames queues a completion email when a production game request is closed successfully.

## Runtime flow

1. A completed OSG GitHub Issue triggers `.github/workflows/complete-osg-request.yml`.
2. `functions/complete-osg-request-from-issue.mjs` marks the Firebase request completed.
3. The script loads the request owner's email from Firebase Authentication server-side.
4. It writes one idempotent document to the Firestore `mail` collection using document id `osg-complete-<requestId>`.
5. Firebase's official Trigger Email extension sends the message.

Rejected requests do not send completion mail. If a request completion workflow is replayed, the deterministic Firestore document id prevents duplicate queue entries.

## One-time manual setup

Install the official Firebase extension `firebase/firestore-send-email` in project `hitobito-levelup`.

Recommended settings:

- Mail collection: `mail`
- Default FROM address: `OneShotGames <noreply@hitobito.jp>` (or another sender verified by the SMTP provider)
- SMTP provider: a transactional email provider such as SendGrid, Mailgun, Resend SMTP, Brevo, etc.
- Templates collection: optional / unused by the current implementation

The SMTP account/provider credentials must be configured during extension setup. Never commit SMTP passwords or API keys to this repository.

Firebase documentation:
https://firebase.google.com/docs/extensions/official/firestore-send-email

## Firestore document shape

The completion workflow creates documents shaped like:

```json
{
  "to": ["user@example.com"],
  "message": {
    "subject": "🎮 ゲームが完成しました｜OneShotGames",
    "text": "...",
    "html": "..."
  },
  "osg": {
    "kind": "game-completed",
    "requestId": "...",
    "gameId": "...",
    "userId": "...",
    "resultUrl": "https://osg.hitobito.jp/g/.../"
  }
}
```

The official extension adds its own `delivery` state to the document as it processes the message.

## Privacy and abuse controls

- The recipient email is read from Firebase Authentication with Admin SDK, not trusted from browser input.
- Browser clients do not get a public rule that allows writes to the `mail` collection.
- Only successful game completions enqueue mail.
- One completion request maps to one deterministic mail document.
