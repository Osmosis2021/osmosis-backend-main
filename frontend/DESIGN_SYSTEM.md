# Studio Time Unified Design System Guide

This project implements a unified design system that ensures aesthetic consistency across both web and mobile platforms. The system uses a centralized design token configuration, shared by both **Material UI (MUI)** and **Tailwind CSS**.

---

## 🏛️ System Architecture

All styles are governed by a single JSON file containing our design tokens:
- **Token Source**: `src/theme/designTokens.json`
- **Material UI Implementation**: `src/theme.js` imports these tokens to configure the MUI theme.
- **Tailwind CSS Implementation**: `tailwind.config.js` loads the tokens to extend Tailwind utility classes.

---

## 🎨 Color Palette

| Category | Token Key | Hex Value | Tailwind Class | MUI Theme Mapping |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** | `colors.primary.main` | `#0A0A0A` | `bg-primary` / `text-primary` | `theme.palette.primary.main` |
| | `colors.primary.light` | `#1F1F1F` | `bg-primary-light` | `theme.palette.primary.light` |
| | `colors.primary.dark` | `#000000` | `bg-primary-dark` | `theme.palette.primary.dark` |
| **Secondary** | `colors.secondary.main` | `#F7F7F7` | `bg-secondary` / `text-secondary` | `theme.palette.secondary.main` |
| | `colors.secondary.light` | `#FAFAFA` | `bg-secondary-light` | `theme.palette.secondary.light` |
| | `colors.secondary.dark` | `#E5E5E5` | `bg-secondary-dark` | `theme.palette.secondary.dark` |
| **Background**| `colors.background.default` | `#FFFFFF` | `bg-background-default` | `theme.palette.background.default` |
| | `colors.background.paper` | `#F7F7F7` | `bg-background-paper` | `theme.palette.background.paper` |
| **Text** | `colors.text.primary` | `#0A0A0A` | `text-text-primary` | `theme.palette.text.primary` |
| | `colors.text.secondary` | `#525252` | `text-text-secondary` | `theme.palette.text.secondary` |
| | `colors.text.disabled` | `#8C8C8C` | `text-text-disabled` | `theme.palette.text.disabled` |
| **Divider** | `colors.divider` | `#E5E5E5` | `border-divider` | `theme.palette.divider` |
| **Error** | `colors.error.main` | `#EF4444` | `bg-error` / `text-error` | `theme.palette.error.main` |
| **Success** | `colors.success.main` | `#10B981` | `bg-success` / `text-success` | `theme.palette.success.main` |
| **Warning** | `colors.warning.main` | `#F59E0B` | `bg-warning` / `text-warning` | `theme.palette.warning.main` |
| **Info** | `colors.info.main` | `#3B82F6` | `bg-info` / `text-info` | `theme.palette.info.main` |

---

## 🔠 Typography & Type Scale

The design system employs **Outfit** for headings (modern, clean, geometric) and **Inter** for UI labels and readable body copy.

### Font Families
- **Heading**: `"Outfit", sans-serif` (applied to `h1`-`h6`, buttons) -> Tailwind `font-heading`
- **Body**: `"Inter", sans-serif` (applied to body copy, inputs, captions) -> Tailwind `font-body`

### Sizing Scale & Line Heights

| Style Name | Font Size | Line Height | Font Weight | MUI Mapping |
| :--- | :--- | :--- | :--- | :--- |
| **H1** | `2.25rem` (36px) | `1.2` | `800` (Extra Bold) | `<Typography variant="h1">` |
| **H2** | `1.875rem` (30px)| `1.25` | `700` (Bold) | `<Typography variant="h2">` |
| **H3** | `1.5rem` (24px) | `1.3` | `700` (Bold) | `<Typography variant="h3">` |
| **H4** | `1.25rem` (20px) | `1.35` | `600` (Semi Bold) | `<Typography variant="h4">` |
| **H5** | `1.125rem` (18px)| `1.4` | `600` (Semi Bold) | `<Typography variant="h5">` |
| **H6** | `1rem` (16px) | `1.4` | `600` (Semi Bold) | `<Typography variant="h6">` |
| **Subtitle1**| `1rem` (16px) | `1.5` | `600` (Semi Bold) | `<Typography variant="subtitle1">` |
| **Subtitle2**| `0.875rem` (14px)| `1.5` | `500` (Medium) | `<Typography variant="subtitle2">` |
| **Body1** | `1rem` (16px) | `1.6` | `400` (Regular) | `<Typography variant="body1">` |
| **Body2** | `0.875rem` (14px)| `1.6` | `400` (Regular) | `<Typography variant="body2">` |
| **Button** | `0.95rem` (15px) | `1.5` | `600` (Semi Bold) | Underlying `<Button>` style |
| **Caption** | `0.75rem` (12px) | `1.4` | `500` (Medium) | `<Typography variant="caption">` |

---

## 📏 Spacing System (4px Grid)

Use these standardized steps for all margins, paddings, and gaps.

| Token | Pixels | Tailwind Spacing Class |
| :--- | :--- | :--- |
| `space-1` | `4px` | `p-space-1`, `m-space-1`, `gap-space-1` |
| `space-2` | `8px` | `p-space-2`, `m-space-2`, `gap-space-2` |
| `space-3` | `12px` | `p-space-3`, `m-space-3`, `gap-space-3` |
| `space-4` | `16px` | `p-space-4`, `m-space-4`, `gap-space-4` |
| `space-5` | `20px` | `p-space-5`, `m-space-5`, `gap-space-5` |
| `space-6` | `24px` | `p-space-6`, `m-space-6`, `gap-space-6` |
| `space-8` | `32px` | `p-space-8`, `m-space-8`, `gap-space-8` |
| `space-10`| `40px` | `p-space-10`, `m-space-10`, `gap-space-10` |
| `space-12`| `48px` | `p-space-12`, `m-space-12`, `gap-space-12` |
| `space-16`| `64px` | `p-space-16`, `m-space-16`, `gap-space-16` |

---

## 📐 Corner Radii (Border Radius)

| Token Key | Radius Value | Tailwind Class | Usage Example |
| :--- | :--- | :--- | :--- |
| `borderRadius.xs` | `4px` | `rounded-xs` | Badges, small overlays |
| `borderRadius.sm` | `8px` | `rounded-sm` | Chips, small buttons |
| `borderRadius.md` | `12px` | `rounded-md` | Buttons, text field inputs |
| `borderRadius.lg` | `16px` | `rounded-lg` | Cards, dialog modals, sections |
| `borderRadius.xl` | `32px` | `rounded-xl` | Bottom floating navigation docks |

---

## 🌌 Shadows & Borders

- **Borders**:
  - Divider border: `1px solid #E5E5E5` (Tailwind: `border border-divider`)
  - Hover border: `1px solid #8C8C8C` (Tailwind: `hover:border-text-disabled`)
  - Focus border: `2px solid #0A0A0A` (Tailwind: `focus:border-2 focus:border-primary`)
  - Error border: `1px solid #EF4444` (Tailwind: `border-error`)
- **Shadows**:
  - `shadow-sm`: `0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)` (Tailwind: `shadow-sm`)
  - `shadow-md`: `0 4px 6px -1px rgba(15, 23, 42, 0.08)` (Tailwind: `shadow-md` / hover states)
  - `shadow-lg`: `0 10px 15px -3px rgba(15, 23, 42, 0.1)` (Tailwind: `shadow-lg` / dialogs)
  - `shadow-xl`: `0 8px 32px rgba(15, 23, 42, 0.12)` (Tailwind: `shadow-xl` / floating elements)

---

## 🛠️ Reusable Component Specifications

### 1. Button Styles
- **Primary Contained**: Near-black background (`#0A0A0A`), white text, 12px border radius, Outfit font, weight 600. On hover: translate-y(-1px), shadow-md, slightly lighter black bg (`#1F1F1F`).
- **Secondary Contained**: Off-white background (`#F7F7F7`), near-black text (`#0A0A0A`), 12px border-radius. On hover: translate-y(-1px), slightly darker off-white background (`#E5E5E5`).
- **Outlined**: transparent background, 1px #E5E5E5 border, near-black text (`#0A0A0A`). On hover: very subtle near-black background with low opacity (rgba(10, 10, 10, 0.04)), near-black border.
- **Disabled**: Slate 200 background, Slate 400 text, cursor-not-allowed, no active click/translation transitions.

### 2. Input Styles
- **Default**: White background, 1px #E5E5E5 border, 12px corner radius, Inter font. Padding: `12px 16px`.
- **Hover**: #8C8C8C border.
- **Focus**: 2px #0A0A0A border.
- **Error**: 1px Red 500 border, error message rendered below in Red 500.

### 3. Navbar Styles
- **Top Bar (Desktop & Mobile Sticky Headers)**:
  - Height: `64px`
  - Horizontal Padding: `16px`
  - Background: White with 85% opacity (`rgba(255, 255, 255, 0.85)`)
  - Effect: `backdrop-filter: blur(16px)`
  - Divider: `1px solid rgba(10, 10, 10, 0.06)` border at bottom
  - Elevation: 0 (flat border-based hierarchy)
- **Bottom Navigation Dock (Mobile Bottom floating docks)**:
  - Height: `48px` active icon tabs (inside a `calc(64px + safe-area)` outer box)
  - Layout: Flex row with space-around distribution
  - Background: `rgba(255, 255, 255, 0.94)` with `backdrop-filter: blur(12px)`
  - Border Radius: `32px` (`rounded-xl` / pill shape)
  - Border & Shadow: 1px thin border `rgba(0, 0, 0, 0.08)`, shadow-xl.
