# boothfinder — UI Tokens

> **Rule**: Never use raw hex codes or arbitrary Tailwind values.
> Always reference the CSS variables or Tailwind tokens defined here.

## Color Palette

```css
:root {
  /* Brand */
  --color-primary:        #2563EB;  /* Blue 600 — primary actions, CTAs */
  --color-primary-hover:  #1D4ED8;  /* Blue 700 — hover state */
  --color-primary-subtle: #DBEAFE;  /* Blue 100 — tinted backgrounds */

  /* Neutral */
  --color-bg:             #FFFFFF;
  --color-bg-subtle:      #F8FAFC;
  --color-surface:        #F1F5F9;
  --color-border:         #E2E8F0;

  /* Text */
  --color-text:           #0F172A;
  --color-text-subtle:    #64748B;
  --color-text-disabled:  #94A3B8;
  --color-text-inverse:   #FFFFFF;

  /* Status */
  --color-success:        #16A34A;
  --color-success-subtle: #DCFCE7;
  --color-warning:        #D97706;
  --color-warning-subtle: #FEF3C7;
  --color-error:          #DC2626;
  --color-error-subtle:   #FEE2E2;
  --color-info:           #0EA5E9;
  --color-info-subtle:    #E0F2FE;

  /* Map overlay colours */
  --color-route:          #2563EB;  /* Navigation path line */
  --color-booth-pin:      #2563EB;  /* Default booth marker */
  --color-booth-pin-active: #DC2626; /* Selected booth marker */
  --color-user-dot:       #16A34A;  /* Blue-dot user position */
}

.dark {
  --color-primary:        #3B82F6;  /* Blue 500 — slightly lighter for dark bg */
  --color-primary-hover:  #60A5FA;
  --color-primary-subtle: #1E3A5F;

  --color-bg:             #0F172A;
  --color-bg-subtle:      #1E293B;
  --color-surface:        #334155;
  --color-border:         #475569;

  --color-text:           #F8FAFC;
  --color-text-subtle:    #94A3B8;
  --color-text-disabled:  #64748B;
  --color-text-inverse:   #0F172A;

  --color-success:        #22C55E;
  --color-success-subtle: #14532D;
  --color-warning:        #F59E0B;
  --color-warning-subtle: #451A03;
  --color-error:          #EF4444;
  --color-error-subtle:   #450A0A;
  --color-info:           #38BDF8;
  --color-info-subtle:    #082F49;

  --color-route:          #60A5FA;
  --color-booth-pin:      #60A5FA;
  --color-booth-pin-active: #F87171;
  --color-user-dot:       #4ADE80;
}
```

## Typography

```css
:root {
  --font-sans: 'Ubuntu', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Scale */
  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg:   1.125rem;   /* 18px */
  --text-xl:   1.25rem;    /* 20px */
  --text-2xl:  1.5rem;     /* 24px */
  --text-3xl:  1.875rem;   /* 30px */

  /* Weight */
  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;
}
```

Load Ubuntu via Google Fonts in `app/layout.tsx`:
```ts
import { Ubuntu } from 'next/font/google';
const ubuntu = Ubuntu({ subsets: ['latin'], weight: ['400','500','700'] });
```

## Border Radius

```css
:root {
  --radius-sm:   0.25rem;   /* 4px  — tags, badges */
  --radius-md:   0.5rem;    /* 8px  — cards, inputs */
  --radius-lg:   0.75rem;   /* 12px — modals, sheets */
  --radius-xl:   1rem;      /* 16px — large panels */
  --radius-full: 9999px;    /* pills, avatar rings */
}
```

## Shadows

```css
:root {
  --shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-map: 0 2px 8px 0 rgb(0 0 0 / 0.25); /* elevated map overlays */
}
```

## Tailwind Config Mapping

```ts
// tailwind.config.ts (excerpt)
theme: {
  extend: {
    colors: {
      primary:        'var(--color-primary)',
      'primary-hover':'var(--color-primary-hover)',
      'primary-subtle':'var(--color-primary-subtle)',
      bg:             'var(--color-bg)',
      'bg-subtle':    'var(--color-bg-subtle)',
      surface:        'var(--color-surface)',
      border:         'var(--color-border)',
      text:           'var(--color-text)',
      'text-subtle':  'var(--color-text-subtle)',
      success:        'var(--color-success)',
      warning:        'var(--color-warning)',
      error:          'var(--color-error)',
    },
    fontFamily: {
      sans: ['var(--font-sans)'],
      mono: ['var(--font-mono)'],
    },
    borderRadius: {
      sm:   'var(--radius-sm)',
      md:   'var(--radius-md)',
      lg:   'var(--radius-lg)',
      xl:   'var(--radius-xl)',
    },
    boxShadow: {
      map: 'var(--shadow-map)',
    },
  },
},
```
