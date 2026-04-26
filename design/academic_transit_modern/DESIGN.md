---
name: Academic Transit Modern
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#464553'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#777584'
  outline-variant: '#c8c4d5'
  surface-tint: '#544fc0'
  primary: '#1f108e'
  on-primary: '#ffffff'
  primary-container: '#3730a3'
  on-primary-container: '#a9a7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#422700'
  on-tertiary: '#ffffff'
  tertiary-container: '#603b00'
  on-tertiary-container: '#f49d09'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3b35a7'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  h1:
    fontFamily: Cairo
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  h2:
    fontFamily: Cairo
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  h3:
    fontFamily: Cairo
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Cairo
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Cairo
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Cairo
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Cairo
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is built on the pillars of **reliability, community, and academic excellence.** It bridges the gap between a high-utility transport tool and a professional academic service. The brand personality is "The Reliable Peer"—approachable enough for students but structured enough to earn the trust of parents and university administration.

The visual style is rooted in **Modern / Corporate** aesthetics, prioritizing clarity and high-fidelity execution. By utilizing a white-space heavy layout, the design system minimizes cognitive load for students in a hurry. The interface feels premium and intentional, using subtle depth and soft transitions to create a polished, "app-store-featured" quality that differentiates it from local competitors.

## Colors

The palette is anchored by **Indigo Blue**, chosen to represent the stability and professionalism of an institutional service. It is used for primary actions, navigation, and brand-heavy moments. **Emerald Green** serves as the functional secondary color, reserved exclusively for success states, financial transactions (wallet balances, payments), and positive confirmation actions.

A sophisticated neutral scale of cool grays ensures the interface remains clean and readable. The background is a very soft off-white to reduce glare and allow white cards with subtle shadows to "pop" from the surface. Tertiary amber is used sparingly for cautionary alerts and pending ride statuses.

## Typography

This design system utilizes **Cairo** for all linguistic requirements, ensuring a harmonious experience across Arabic and English scripts. Cairo’s geometric yet humanist qualities align with the "student-centric professional" persona. 

Headlines use heavy weights and tight line-heights to create a sense of importance and structure. Body text is optimized for legibility with a generous 1.5x line-height. Label styles are set in semi-bold to ensure they remain distinct from body copy at smaller sizes, particularly in data-heavy transport lists.

## Layout & Spacing

The design system employs a **Fluid Grid** model optimized for mobile-first interaction. A strict 8px spacing rhythm ensures vertical consistency across all components. 

To achieve the "white-space heavy" requirement, the layout utilizes a wide **24px horizontal margin** for main containers, pushing content inward to create a premium, uncrowded feel. Gutters between cards and list items are maintained at 16px to ensure distinct visual separation while maintaining a cohesive flow. Vertical stack spacing follows an exponential scale (8, 16, 32, 64) to define clear content hierarchies.

## Elevation & Depth

This design system uses **Ambient Shadows** to convey hierarchy without adding visual clutter. Shadows are extra-diffused with low opacity (typically 4-8%) and a subtle Indigo tint (`#3730A3`) to ensure they feel like part of the brand environment rather than generic gray blurs.

Depth is structured into three tiers:
1.  **Floor (Level 0):** The background layer (`#F9FAFB`).
2.  **Surface (Level 1):** Primary cards and containers. These use a 12px blur radius shadow with 0px offset.
3.  **Floating (Level 2):** Critical action items like Bottom Sheets or Sticky Buttons. These use a 20px blur with a slight 4px Y-offset to appear closer to the user.

Semi-transparent backdrops with a 10px Gaussian blur (backdrop-filter) are used for headers and modal overlays to maintain a sense of spatial context.

## Shapes

The shape language is defined by **Rounded** geometry. A base radius of 0.5rem (8px) is applied to all standard components like input fields and small buttons. Larger containers, such as ride-detail cards, utilize `rounded-lg` (16px), while modal sheets and major branding elements use `rounded-xl` (24px).

This level of roundedness strikes a balance: it is friendly and modern enough for a student audience, but avoids the "bubble-like" appearance of a more casual consumer app, maintaining the professional rigor required for a transport service.

## Components

**Buttons:** 
- **Primary:** Solid Indigo with white text. High-contrast, no border.
- **Secondary/Action:** Solid Emerald for "Confirm Trip" or "Top-up Wallet."
- **Ghost:** Indigo outline or text-only for secondary navigation.

**Cards:** 
White background, `rounded-lg` corners, and level 1 ambient shadows. Content inside cards should follow the 16px internal padding rule to maintain the "breathable" feel of the system.

**Input Fields:** 
Soft gray borders (`#E5E7EB`) that transition to a 2px Indigo border on focus. Labels should always be visible above the field in `label-md` style.

**Chips & Badges:** 
Used for ride status (e.g., "Arriving," "Completed"). Status chips use low-opacity backgrounds (10%) of the status color (e.g., Emerald for completed) with full-opacity text for maximum readability.

**Lists:** 
Clean, borderless list items separated by whitespace or a very faint 1px divider. Each item should have a minimum height of 64px to ensure touch-targets are student-friendly for on-the-go use.

**Additional Recommended Components:**
- **Route Timeline:** A vertical stepper using Indigo for the track to visualize the crowdsourced pick-up points.
- **Student ID Verification Badge:** A small, emerald-tinted badge to denote verified university commuters.