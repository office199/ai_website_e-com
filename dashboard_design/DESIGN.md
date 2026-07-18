---
name: Executive Precision
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191c1e'
  on-tertiary-container: '#818486'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  display-sm:
    fontFamily: Geist
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1440px
  sidebar-width: 260px
  gutter: 24px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is engineered for high-density information environments where clarity and speed of decision-making are paramount. The brand personality is **Efficient, Trustworthy, and Data-Driven**, catering to e-commerce administrators who manage complex inventories and financial data. 

The aesthetic leans into **Corporate Modernism** with a focus on functional minimalism. It utilizes a structured workspace to reduce cognitive load, characterized by subtle tonal shifts rather than aggressive decorative elements. The UI should evoke a sense of "calm control," ensuring that users can navigate large datasets without visual fatigue. High-quality typography and a restrained color palette reinforce a professional, tool-like reliability.

## Colors
The color strategy prioritizes functional hierarchy. 
- **Primary (Deep Blue):** Reserved for global navigation and structural anchors to provide a sense of stability.
- **Secondary (Vibrant Blue):** Used for primary actions, active states, and focus indicators.
- **Surface Colors:** A progression of slates and grays (`#F8FAFC` for the workspace background, `#FFFFFF` for cards) provides clear separation between the tool and the content.
- **Semantic Palette:** Success, Warning, and Error colors are calibrated for high legibility against white backgrounds, ensuring critical system statuses are instantly recognizable.

## Typography
The typography system uses a pairing of **Geist** for structural headings and labels to lend a technical, precise feel, and **Inter** for body text and data tables to ensure maximum readability. 

Numeric data in tables and metric cards should utilize Geist with tabular lining figures where possible to ensure columns of numbers align perfectly. Use `label-md` for table headers and section overviews to provide a clear secondary hierarchy.

## Layout & Spacing
This design system employs a **Fixed-Fluid Hybrid Grid**. 
- **Navigation:** A fixed-width sidebar (260px) on the left provides consistent access to top-level domains.
- **Workspace:** A fluid main content area that stretches to a maximum of 1440px to prevent excessive line lengths on ultra-wide monitors.
- **Rhythm:** An 8px linear scale governs all spacing. Use 24px gutters between dashboard cards and 16px internal padding within those cards. 

**Breakpoints:**
- **Desktop (1024px+):** Full sidebar visible, 12-column grid.
- **Tablet (768px - 1023px):** Sidebar collapses to icons only, 8-column grid.
- **Mobile (<768px):** Sidebar moves to a bottom sheet or hamburger overlay, 4-column grid, 16px margins.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows.
- **Level 0 (Background):** `#F8FAFC` – The base canvas.
- **Level 1 (Cards/Surface):** `#FFFFFF` – Pure white surfaces with a 1px border (`#E2E8F0`).
- **Level 2 (Dropdowns/Modals):** White surface with a soft, ambient shadow (0px 4px 20px rgba(0, 0, 0, 0.05)) to suggest it is floating above the workspace.

Avoid the use of heavy "outer glows" or colorful shadows. The goal is to make elements look docked and stable.

## Shapes
The shape language is **Soft and Professional**. A standard radius of 0.25rem (4px) is applied to buttons and input fields to maintain a crisp, organized appearance. Larger containers like dashboard cards use a 0.5rem (8px) radius to soften the overall interface and make the workspace feel modern and approachable.

## Components
- **Data Tables:** Use a zebra-stripe pattern or subtle hover states (`#F1F5F9`). Headers should be sticky with a 1px bottom border. Cells containing currency or counts should be right-aligned.
- **Metric Cards:** Feature a title, a large "Display" value, and a small sparkline chart (1:4 aspect ratio). Include a "trend badge" showing percentage change in semantic colors.
- **Status Badges:** Use a "Subtle Filled" style — low-opacity background color with high-contrast text (e.g., Success: Background 10% green, Text 100% green).
- **Buttons:** 
  - *Primary:* Solid Deep Blue or Vibrant Blue with white text.
  - *Secondary:* White background with 1px slate border.
- **Input Fields:** Focus state should use a 2px Vibrant Blue ring with 0% offset.
- **Side Navigation:** Active links should use a vertical 3px "pill" indicator on the far left and a subtle background tint.