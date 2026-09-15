# 0004. Object storage: Cloudflare R2 (Supabase Storage fallback)

- **Status:** Proposed (confirm at Phase 2 step 6)
- **Date:** 2026-09-15
- **Deciders:** Jeston Singh

## Context
Profile photos are currently stored as base64 inside Firestore documents (1 MB limit). Resumes and optional audio recordings need object storage. Firebase Storage needs the Blaze plan for projects created after October 2024.

## Decision
Use Cloudflare R2 (S3-compatible, 10 GB free, no egress fees) behind an `ObjectStorage` interface with presigned uploads. If R2 account creation requires a card at sign-up time, use Supabase Storage (1 GB free) through the same interface.

## Consequences
- One more vendor and env set; CSP `img-src` / `media-src` must include the bucket domain.
- Presigned upload flow (`getUploadUrl` → PUT → `confirmUpload`) with server-side validation after upload.
- Exit strategy: the interface allows swapping to any S3-compatible store.

## Alternatives considered
- Firebase Storage on Blaze: card required — rejected.
- Vercel Blob / Uploadthing free tiers: smaller quotas and tighter vendor coupling — rejected.
- Storing files in Firestore: violates size limits — rejected.
