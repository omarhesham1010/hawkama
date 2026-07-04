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
  Selects the right Nasser pose and line based on slide type and context, then renders him in a fixed bottom story layer inside the slide canvas.

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
- Nasser is anchored to the bottom of each slide, with the speech bubble beside him.
- Slide content reserves bottom space so Nasser does not cover text, cards, or buttons.
- Activities, quiz, and reflection use a more compact bottom layer to preserve interaction space.
- Mobile keeps the same slide composition through the existing scaled 16:9 player.
- Nasser's lines are short, Saudi-friendly, and professional.
