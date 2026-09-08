# Habit Planet deploy IAM

GitHub ActionsのWorkload Identity Federation認証自体は成功している。
現在のblockerは、既存deployer service accountが新規Firebase project `habit-planet-5bbc3` のresourceを読む/更新するIAMを持っていないこと。

対象principal:

`github-firebase-deployer@hitobito-levelup.iam.gserviceaccount.com`

## Bootstrap deploy（Hosting + Firestore Rules）

`habit-planet-5bbc3` project側で次の2 roleを付与する。

- Firebase Hosting Admin — `roles/firebasehosting.admin`
- Firebase Rules Admin — `roles/firebaserules.admin`

これらはHosting deployに必要なFirebase project/site read-write権限と、Firestore Security Rulesのruleset/release publish権限を分けて付与する最小寄りの構成。

Google Cloud IAM:
https://console.cloud.google.com/iam-admin/iam?project=habit-planet-5bbc3

権限追加後はGitHub Actionsの `Habit Planet Firebase bootstrap deploy` を再実行する。

## Functions deployを始める段階

Functionsは別途、少なくともFirebase公式が案内する以下のroleが必要になる。

- Cloud Functions Admin — `roles/cloudfunctions.admin`
- Service Account User — `roles/iam.serviceAccountUser`

Secret Managerを使うための権限は、初回deployログで実際に不足したpermissionを確認してから必要最小限を追加する。先回りでOwner/Editorは付けない。

## ポリシー

- GitHubにservice account JSON keyを保存しない
- 既存WIFを使い、target project側で必要なroleだけ付与する
- `roles/owner` / `roles/editor` はdeploy用principalに付けない
- PRはE2E完了までDraftのまま
