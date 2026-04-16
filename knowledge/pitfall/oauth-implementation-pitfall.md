---
name: oauth-implementation-pitfall
description: Common OAuth implementation mistakes revealed by analyzing flow visualization, token inspection, and scope management apps.
category: pitfall
tags:
  - oauth
  - auto-loop
---

# oauth-implementation-pitfall

The most dangerous OAuth pitfall is **silent token expiry with no refresh path**. The token inspector reveals that applications often validate JWT structure (three dot-separated parts, valid base64url) but fail to check the `exp` claim against the current timestamp, or worse, have no fallback when the `exp` claim is missing entirely. In production, this leads to requests succeeding with expired tokens if the resource server relies on structural validation alone. The inspector handles this by computing elapsed minutes since expiry and displaying "No exp claim" as a distinct status, but many real implementations simply crash or silently accept stale tokens. Always treat a missing `exp` claim as an immediate rejection, not a pass-through.

**Grant type mismatches** cause subtle security holes that the flow visualizer makes visible. The Implicit flow delivers tokens in URL fragments (visible in browser history and referrer headers), while Authorization Code flow exchanges a short-lived code on the backend. Choosing Implicit for an app with a backend wastes the security of server-side token exchange. Choosing Authorization Code without PKCE for a public client (SPA, mobile) leaves the authorization code interceptable. The visualizer notably omits PKCE and the `state` parameter—exactly the components most often skipped in real implementations, leading to authorization code injection and CSRF attacks on the redirect URI.

**Scope over-permission and escalation** is the third critical pitfall. The scope playground demonstrates that endpoints requiring multiple scopes (e.g., `DELETE /api/data/:id` needing both `delete` and `write:data`) are safe only when validation uses AND-logic across all required scopes. A common mistake is using OR-logic (any matching scope grants access), which allows a client holding only `write:data` to delete resources. Equally dangerous is granting `admin` scope alongside data scopes in a single consent screen—users click "Allow" without understanding that admin unlocks user management and audit log access. The playground's default of starting with only read scopes models the principle of least privilege, but production systems frequently request maximum scopes upfront "just in case," creating a blast radius far larger than necessary when tokens are leaked or stolen.
