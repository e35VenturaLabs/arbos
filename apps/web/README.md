# Arbos web

Arbos in the browser: the iPhone app's screens at phone width and the Mac app's layout at desktop width,
installable to the home screen (web app manifest). One Node file serves the page and forwards a short
allowlist of relay calls under the same origin, so the browser never holds a relay token (it gets an
httpOnly session cookie after pairing).

```bash
ARBOS_WEB_RELAY=http://127.0.0.1:7700 ARBOS_WEB_PORT=8481 ARBOS_WEB_DATA=./.arbos-web node apps/web/server.mjs
```

Sign in with a relay pairing code (`arbos-relay pair-code`). Chats today are relay people chats of you
plus one outside agent (`POST /chats/{id}/messages`, `GET /chats/{id}/export`). `SPEC.md` lists the
colours, sizes and copy taken from the Swift and GPUI sources.
