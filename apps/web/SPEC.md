# Arbos web: style spec taken from the Arbos source

Source: `unarbos/arbos` at the sparse clone in /root/src/arbos (v0.6.419 era, 2026-11-14).
Phone values from `apps/ios/Arbos` (SwiftUI, points = CSS px). Desktop values from
`crates/arbos-mac` (GPUI) and `docs/mac-design-rules.md`. Reference shots:
`site/assets/app/*.webp` (840 x 1824 phone at 2x of 420 x 912, 2320 x 1440 Mac at 2x).

## Colours

| Token | Light | Dark | Source |
|---|---|---|---|
| bg | #FCFCFC | #141414 | Theme.swift light/dark |
| bubbleAssistant | #F2F2F2 | #202020 | Theme.swift |
| bubbleUser | #111111 | #5C5C5C | Theme.swift |
| field | #FFFFFF | #181818 | Theme.swift |
| fieldBorder | #DEDEDE | #1A1A1A | Theme.swift |
| text | #111111 | #FFFFFF | Theme.swift |
| muted | #6B6B70 | #95959B | Theme.swift |
| placeholder | #757579 | #58585B | Theme.swift |
| icon | #6E6E73 | #96969C | Theme.swift |
| accent (links) | #0A6FE0 | #1084FE | Theme.swift |
| unread pill | #1084FE | #006CEB | Theme.swift |
| online | #34C759 | #34C759 | Theme.swift |
| danger | #D7332A | #FF453A | Theme.swift |
| separator | rgba(0,0,0,.10) | rgba(255,255,255,.08) | Theme.swift |
| codeChip | rgba(0,0,0,.06) | rgba(0,0,0,.28) | Theme.swift |
| primary control | #111111 | #FFFFFF | Theme.primary |
| Mac sidebar | #F6F6F6 | #1A1A1A | ui/theme.rs |
| Mac bubble_assistant | #EDEDED | #232323 | ui/theme.rs |
| Mac surface_2 (search, tabs) | #E8E8E8 | #262626 | ui/theme.rs |

Avatar discs: `GET /avatar-colors` palette (7 colours, light/dark top->bottom gradient),
index = sum of the id's UTF-8 bytes mod 7 unless the relay gives `avatar_color_index_effective`.
Initials: first letters of the first two words, uppercase; font = 0.445 x diameter, semibold.

## Type (SF Pro = -apple-system)

| Use | Phone | Mac |
|---|---|---|
| body / bubble | 17 / 22 line | 15 (TEXT_BODY) |
| small (time, preview, system line) | 15 | 13 (TEXT_SMALL) |
| tiny (label, card header) | 13 | 11.5 (TEXT_TINY) |
| row name | 17 semibold | 15 regular |
| unread count | 12 semibold in a 20 min pill | same |
| working spinner | braille frames ⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏ every 90 ms, monospaced | same |

## Metrics

Phone: control disc 48 (glyph 19), field/pill height 48 radius 24, bar inset 16, bar top 6,
control gap 10, pill picture 32 inset 8, header pill gap 5, text inset 17.
Home rows: avatar 48, gap 15, name/preview spacing 4, vertical pad 16 (80 pitch), list side pad 20.
Bubbles: radius 20, pad 14 x 11, agent-chat cap = screen - 76, run gap 2, turn gap 13,
system line gap 20 (+16 above a date stamp), date line "Today 7:57 PM".
Working row: picture 25.3, gap 14, "<name> is working" 17 muted, 22.7 above the composer.
Composer: side inset 31, `+` disc 48, gap 10, field 48 white with 1 px rim, placeholder
"Ask <agent>", trailing mic (44 hit) + 32 black call circle 8.7 from the edge; with text the
send arrow takes the circle. Bottom 2 above the safe area.
Panes (Settings, profile, Store): hero picture 112, card radius 16 fill = bubbleAssistant,
row 48, tile 30 radius 7.5, side inset 16, card header 13 medium muted, chevron 14 semibold placeholder.

Mac: sidebar 296, header 60 (CONTROL_LINE 30), control 36 (glyph 19, gap 8), row avatar 36,
row radius 12, row pad x 14, search row 34, composer height 44 radius 22, width cap 904,
margin 16, bottom 16, bubble pad 15 x 6 (text 15), avatar in header 28, footer avatar 36 at
left 13 bottom 12, tab pills 26 high.

## Copy

Search placeholder "Search"; composer "Ask <name>" (phone) / "Message <name>" (Mac);
empty home "No conversations yet"; date lines "Today 1:12 PM", "Yesterday …", weekday, date;
settings rows Machine, Appearance (System · Light · Dark), Send feedback, About, Relay.
