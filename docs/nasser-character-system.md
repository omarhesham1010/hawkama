# Nasser Character System

This module uses **Nasser** as the storytelling trainer inside the slide player.
He is the visual host, coach, and guide for the learner, not a decorative mascot.

## Asset Location

Browser-ready assets live in:

```text
public/nasser-assets/
```

The root-level `nasser-assets/` folder is ignored by git to avoid committing duplicate binary files.

## Components

- `src/components/character/Nasser.tsx`
  Maps each Nasser pose to its PNG asset and renders the character.

- `src/components/character/SpeechBubble.tsx`
  Renders short coaching lines beside Nasser.

- `src/components/player/SlideStage.tsx`
  Selects the right Nasser pose and line from the active narration beat/sentence, then renders him in a fixed transparent bottom story layer inside the slide canvas.

## Pose Usage

| Pose | Asset | Usage |
| --- | --- | --- |
| `welcome` | `nasser-welcome.png` | Course opening and greeting |
| `pointLeft` / `pointRight` | pointing assets | Concept explanation slides |
| `tabletLeft` / `tabletRight` | tablet assets | Governance, compliance, DoA, and policy/checklist slides |
| `question` | `nasser-question.png` | Classification activity and knowledge check |
| `thinking` | `nasser-thinking.png` | Reflection and flip-card thinking moments |
| `warning` | `nasser-warning.png` | Conflict-of-interest decision scenario |
| `completion` | `nasser-completion.png` | Final completion screen |

## UX Rules

- Nasser appears inside the 16:9 slide canvas.
- Nasser is larger than a decorative mascot and anchored to the bottom of each slide, with a transparent area behind the character.
- The pose and speech bubble update as the current narration beat/sentence changes.
- The speech bubble appears only while the slide narration is actively speaking, then disappears while Nasser remains visible.
- The bubble tail is side-mounted so it points toward Nasser's position instead of pointing downward.
- Slide content reserves bottom space so Nasser does not cover text, cards, or buttons.
- Activities, quiz, and reflection use a more compact bottom layer to preserve interaction space.
- Mobile keeps the same slide composition through a narrower 16:9 authored canvas, so animation timing stays identical while text, buttons, and Nasser remain easier to see.
- Nasser's lines are short, Saudi-friendly, and professional.
