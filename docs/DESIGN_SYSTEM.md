# Design System — Tabou

## Identité visuelle

**Ambiance** : Premium, sombre, tactique, institutionnel, cinématique sobre.
**Anti-patterns** : Pas de cyberpunk, pas de néon, pas de HUD excessif, pas de kitsch militaire.

---

## Palette de couleurs

### Fonds

| Token Tailwind      | Valeur hex | Usage                              |
|--------------------|------------|------------------------------------|
| `bg-bg-deep`       | `#050403`  | Fond principal de l'application    |
| `bg-bg-surface`    | `#0D0F12`  | Cartes, panneaux, sections alternées |
| `bg-bg-elevated`   | `#15191E`  | Éléments surélevés, tooltips       |
| `bg-bg-overlay`    | `#1C2128`  | Modals, overlays                   |

### Texte

| Token Tailwind       | Valeur hex | Usage                              |
|---------------------|------------|------------------------------------|
| `text-text-primary`  | `#E8E1D3`  | Texte principal, titres            |
| `text-text-secondary`| `#B8AE98`  | Texte de corps, descriptions       |
| `text-text-muted`    | `#7A7268`  | Labels, métadonnées, placeholders  |
| `text-text-inverted` | `#050403`  | Texte sur fond gold (bouton primary) |

### Accents

| Token Tailwind    | Valeur hex | Usage                                      |
|------------------|------------|--------------------------------------------|
| `text-gold`       | `#F0B030`  | Accent principal — signature visuelle      |
| `text-gold-light` | `#F7CC6A`  | Hover gold, highlights                     |
| `text-gold-dark`  | `#D08F30`  | Bronze, accent secondaire                  |
| `text-gold-deep`  | `#9D6823`  | Bronze profond, accents très subtils       |

### Critique (usage ultra-rare)

| Token Tailwind   | Valeur hex | Usage                               |
|-----------------|------------|-------------------------------------|
| `text-red`       | `#900000`  | Alertes critiques, erreurs          |
| `text-red-light` | `#C00000`  | Hover état d'erreur                 |

### Bordures

| Token Tailwind       | Valeur hex | Usage                          |
|---------------------|------------|--------------------------------|
| `border-border`      | `#242830`  | Bordure standard               |
| `border-border-subtle` | `#1A1E24` | Séparateurs très discrets     |
| `border-border-accent` | `#3A3020` | Bordure avec nuance chaude   |

---

## Typographie

### Polices

| Variable CSS         | Police      | Usage                      |
|---------------------|-------------|----------------------------|
| `--font-rajdhani`    | Rajdhani    | Titres, display, labels    |
| `--font-barlow`      | Barlow      | Corps de texte             |

### Classes Tailwind

- `font-display` → Rajdhani
- `font-body` → Barlow

### Échelle de taille (usage recommandé)

| Classe          | Usage                          |
|----------------|--------------------------------|
| `text-7xl`     | Hero headline principal        |
| `text-5xl/6xl` | Titres de page (PageHeader)    |
| `text-4xl`     | Titres de section H2           |
| `text-3xl`     | Sous-titres importants         |
| `text-xl/2xl`  | Titres de card H3              |
| `text-lg`      | Texte de corps large           |
| `text-base`    | Texte de corps standard        |
| `text-sm`      | Labels, descriptions secondaires |
| `text-xs`      | Eyebrows, badges, métadonnées  |

### Tracking (espacement de lettres)

- `tracking-extra-wide` : eyebrows, labels uppercase (`0.35em`)
- `tracking-widest` : ticker, codes (`0.2em`)
- `tracking-wide` : boutons, navigation

---

## Composants UI

### Button

```tsx
<Button variant="primary" size="md">Postuler</Button>
<Button variant="secondary" size="sm">Discord</Button>
<Button variant="ghost">En savoir plus</Button>
<Button variant="danger">Supprimer</Button>
```

**Variants** : `primary` (gold rempli), `secondary` (gold outline), `ghost` (bordure neutre), `danger` (rouge)
**Sizes** : `sm`, `md`, `lg`
**As anchor** : `<Button as="a" href="...">` pour les liens

### Card

```tsx
<Card>
  <CardHeader>...</CardHeader>
  <CardBody>...</CardBody>
  <CardFooter>...</CardFooter>
</Card>

// Variantes
<Card accent>           // Bordure gauche gold
<Card interactive>      // Hover effect pour cartes cliquables
```

### Badge

```tsx
<Badge variant="gold">PvP</Badge>
<Badge variant="muted">Nul-sec</Badge>
<Badge variant="red">Critique</Badge>
```

### Separator

```tsx
<Separator />            // Ligne horizontale neutre
<Separator gold />       // Gradient doré — séparateur de section
```

---

## Composants Blocks

### Hero

Section hero de page d'accueil. Props : `eyebrow`, `headline`, `subheadline`, `primaryCTA`, `secondaryCTA`.

### Section + SectionHeader

Wrapper de section avec fond, espacement et container configurables.

```tsx
<Section bg="surface" spacing="lg">
  <SectionHeader eyebrow="..." headline="..." description="..." />
  {/* contenu */}
</Section>
```

**bg** : `default` (deep), `surface`, `elevated`, `none`
**spacing** : `sm`, `md`, `lg`, `xl`

### CTAPanel

Bloc d'appel à l'action centré. Props : `eyebrow`, `headline`, `description`, `primaryCTA`, `secondaryCTA`.

**variant** : `default` (surface bordée), `bordered`, `gold` (légère teinte chaude)

### InfoPanel

Grille de points d'information.

```tsx
<InfoPanel items={[{title, description}]} columns={2} accent numbered />
```

### StatBlock

Grille de statistiques visuelles.

```tsx
<StatBlock stats={[{label, value, unit}]} />
```

### FAQAccordion / FAQGrouped

Accordéon FAQ avec gestion de catégories.

### ActivityCard

Carte d'activité avec icône Lucide, description et badges.

### RecruitmentStepCard

Carte d'étape de recrutement avec ligne de progression verticale.

---

## Patterns de layout

### PageHeader

Header de page interne avec eyebrow, titre H1, description et ligne décorative.

### Container

```tsx
<Container size="sm|md|lg|xl|full">
```

Padding horizontal responsive : `px-4 sm:px-6 lg:px-8` + max-width.

### MainNav

Navigation fixe en top. Se colore au scroll (`scrolled`). Menu mobile hamburger.

---

## Effets visuels

### Grille tactique

Utilisée dans Hero et PageHeader :
```css
background-image: linear-gradient(gold 1px, transparent 1px), linear-gradient(90deg, ...);
background-size: 80px 80px;
opacity: 0.025
```

### Glow gold

```css
box-shadow: 0 0 20px rgba(240, 176, 48, 0.08);  /* shadow-glow-gold */
box-shadow: 0 0 40px rgba(240, 176, 48, 0.12);  /* shadow-glow-gold-md */
```

### Séparateur gold

```tsx
<Separator gold />
// = gradient horizontal transparent → gold/40 → transparent
```

### Texte gradient gold

```tsx
<span className="text-gradient-gold">...</span>
```

---

## Règles d'usage couleur

1. **Or/gold** : signature visuelle principale. Accents, CTA, icônes actives, soulignement nav actif
2. **Rouge** : réservé aux alertes et états critiques. Jamais décoratif
3. **Pas de bleu néon** : aucune couleur bleue froide dans le design
4. **Fond sombre dominant** : les surfaces claires n'existent pas
5. **Contraste texte** : `text-primary` sur `bg-deep`, jamais de texte muted sur fond elevated
