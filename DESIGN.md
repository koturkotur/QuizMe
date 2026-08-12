# Design System: Educational Editorial

## 1. Overview & Creative North Star: "The Academic Sanctuary"
This design system moves away from the chaotic, high-pressure environment of traditional testing apps. Our Creative North Star is **"The Academic Sanctuary"**—a space that feels as organized as a Notion workspace but as encouraging as a high-end educational atelier.

To achieve this, we reject the "boxed-in" look of standard mobile apps. We utilize **intentional asymmetry**, deep tonal layering, and sophisticated typography scales to create a sense of breathing room. The interface should feel like high-quality stationery: tactile, premium, and focused. By prioritizing white space and background shifts over rigid lines, we reduce cognitive load, allowing the student to focus entirely on the "Politehnika" entrance exam material.

---

## 2. Colors & Surface Philosophy
The palette balances the authority of `primary` (Soft Blue) with the creative energy of `secondary` (Purple).

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to define sections. Layout boundaries must be defined exclusively through background color shifts.
- Use `surface` (#f5f6f7) for the main application canvas.
- Use `surface_container_low` (#eff1f2) for secondary content areas.
- Use `surface_container_lowest` (#ffffff) for the primary interaction cards (questions/answers).

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. An answer card (`surface_container_lowest`) should sit atop a quiz background (`surface`). This creates "natural" depth that feels sophisticated rather than "templated."

### Signature Textures & Glassmorphism
- **Floating Actions:** Use `surface_container_lowest` with a 15% opacity and a `20px` backdrop-blur for floating navigation or progress bars. This "Glassmorphism" ensures the app feels modern and integrated.
- **Visual Soul:** Apply a subtle linear gradient to main CTAs (from `primary` #4546d7 to `primary_container` #9396ff) to move away from flat, lifeless buttons.

---

## 3. Typography: Editorial Authority
We use a dual-font pairing to distinguish between "Information" and "Instruction."

* **Display & Headlines (Plus Jakarta Sans):** Used for titles, scores, and headers. The wider proportions of Plus Jakarta Sans provide a "modern dashboard" feel.
* **Body & Titles (Inter):** Used for question text and answer options. Inter is optimized for screen readability and ensures the Serbian Cyrillic/Latin characters are perfectly balanced.

**Hierarchy Guidance:**
- **`display-md` (2.75rem):** High-impact feedback (e.g., "Svaka čast!").
- **`title-lg` (1.375rem):** The primary question text. It must be authoritative and clear.
- **`body-md` (0.875rem):** Supporting explanations or "Hints."

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often a crutch for poor layout. In this system, depth is earned through tone.

* **The Layering Principle:** Stacking `surface_container` tiers creates a soft, natural lift. A card using `surface_container_highest` (#dadddf) on a `surface` background creates immediate focus without a single shadow.
* **Ambient Shadows:** For the "Floating Answer" state, use an extra-diffused shadow: `Y: 8px, Blur: 24px, Color: rgba(44, 47, 48, 0.06)`. This mimics natural light.
* **The Ghost Border:** If a border is required for accessibility (e.g., an unselected state), use `outline_variant` (#abadae) at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components

### Buttons (Primary & Secondary)
- **Styling:** Large `xl` (3rem) corner radius.
- **Padding:** `vertical: 5 (1.7rem)`, `horizontal: 8 (2.75rem)`.
- **Primary:** Gradient from `primary` to `primary_container`. Text in `on_primary`.
- **Secondary:** Surface-based. Use `surface_container_high` with `primary` text. No border.

### Question Cards
- **Forbid Dividers:** Do not use lines between questions or answers.
- **Separation:** Use `spacing-4` (1.4rem) between answer choices.
- **States:**
- *Default:* `surface_container_lowest`.
- *Selected:* `primary_container` with a `Ghost Border` of `primary`.
- *Correct:* `tertiary_container` (#ff8ed2) - a sophisticated nod to "correctness" without using jarring "Stoplight Green."

### Input Fields
- **Styling:** `surface_container_low` background.
- **Interaction:** On focus, the background shifts to `surface_container_lowest` with a subtle `primary` ghost border.

### Progress Indicators (Signature Component)
Instead of a thin line, use a thick `md` (1.5rem) rounded bar using `surface_container_highest` as the track and a `primary` to `secondary` gradient as the fill. This adds "Duolingo-style" playfulness.

---

## 6. Do’s and Don’ts

### Do:
- **Use Asymmetry:** Align headers to the left but center-align specific "Success" state illustrations to create visual rhythm.
- **Respect the Spacing Scale:** Use `spacing-10` (3.5rem) for section breathing room. High-end design requires "wasteful" space.
- **Prioritize Taps:** Every answer option should have a minimum height of `16` (5.5rem) to ensure mobile-first usability.

### Don't:
- **No Pure Black:** Never use `#000000`. Use `on_surface` (#2c2f30) for text to maintain the "Soft Minimalist" feel.
- **No 1px Lines:** Do not use horizontal rules (`
`) to separate content. Use a `1.5rem` background block or empty space.

- **Don't Over-Elevate:** If everything has a shadow, nothing is important. Reserve shadows for "active" or "floating" elements only.

---

## 7. Language-Specific Notes (Serbian)
- **Case Sensitivity:** Use `headline-sm` in Sentence case for Serbian labels. Avoid All-Caps for long strings, as it reduces readability of Cyrillic/Latin diacritics (š, ć, č, ž).
- **Text Expansion:** Allow for 20% extra horizontal space in buttons, as Serbian words are often longer than English equivalents (e.g., "Start" vs "Započni").