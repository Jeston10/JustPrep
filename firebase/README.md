# Firebase project configuration

| File | Purpose |
|---|---|
| `firestore.rules` | Deny-all for the client SDK. All reads/writes go through `firebase-admin` in `server/` (SECURITY §2.7). Deploy with `firebase deploy --only firestore:rules`. |
| `firestore.indexes.json` | Every composite index the app's queries need — mirrored from the production project on 2026-09-16 (RISKS R17). Add an entry in the same PR as any new query; deploy with `firebase deploy --only firestore:indexes`. |
| `../firebase.json` | Points the CLI at the files above and configures the local emulators (Auth 9099, Firestore 8080). |

Composite indexes in use:

| Collection | Fields | Query |
|---|---|---|
| `interviews` | `finalized ↑, createdAt ↓, userId ↓` | community list: `finalized == true`, `userId != me`, newest first |
| `interviews` | `userId ↑, createdAt ↓` | my interviews, newest first |
| `feedback` | `userId ↑, createdAt ↑` | my feedback in a date range |

`feedback` by `(interviewId ==, userId ==)` needs no composite index (equality-only merge).

## Emulators

`pnpm dev:emulators` starts Auth + Firestore emulators, seeds a demo account (`scripts/seed-emulator.ts`), and runs `next dev` against them. Requires JDK 21+ on PATH.
