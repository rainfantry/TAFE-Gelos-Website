# Gelos Enterprises — Task Manager Website

A pure HTML/CSS/JavaScript task manager built without Bootstrap or external libraries. Three pages: home (landing), tasks (job tracker with search), and contact (form with validation).

https://rainfantry.github.io/TAFE-Gelos-Website/

## Architecture

```
index.html      — Landing page with hero image and call-to-action
tasks.html      — Job tracker: add, complete, delete, and search tasks
contact.html    — Contact form with validation and success message
css/styles.css  — All styling (custom grid, components, responsive)
app.js          — All behaviour (navigation, tasks, search, forms)
```

One CSS file styles everything. One JS file runs everything. No frameworks.

## How the CSS Works

### Visual Sectioning (Bordered Boxes)

The site uses `background`, `border`, `border-radius`, and `padding` to create distinct visual boxes that separate different functional areas:

```css
.task-form {
  background: #f8f9fa;        /* light grey fill — separates it from white page */
  border: 1px solid #ddd;     /* subtle border defines the box edge */
  border-radius: 0.5rem;      /* rounded corners */
  padding: 1.5rem;            /* breathing room inside the box */
}
```

This same pattern is used three times for three different sections:
- `.task-form` — the "Add New Job" form on tasks.html
- `.search-section` — the search bar area on tasks.html
- `.contact-form` — the contact form on contact.html

Each one is visually a "card" — a filled, bordered container that groups related content. The light grey background (`#f8f9fa`) contrasts against the white page, and the border draws a clear boundary.

### Colour System (CSS Variables)

Colours are defined once at the top using CSS custom properties (variables):

```css
:root {
  --ge-gold: #b59a5b;    /* brand gold — headings, primary buttons */
  --ge-dark: #3d4654;    /* dark blue-grey — navbar, footer, body text */
  --ge-teal: #2a8a9e;    /* teal — links, active nav, focus rings */
  --ge-light: #f8f9fa;   /* light grey — form backgrounds */
}
```

Every colour in the stylesheet references these variables. To rebrand the site, you only change 4 values.

### Custom Grid (Replacing Bootstrap)

Instead of Bootstrap's grid, the CSS builds its own using flexbox:

```css
.row { display: flex; flex-wrap: wrap; }
.col-md-6 { flex: 0 0 50%; max-width: 50%; }  /* half-width on tablets+ */
```

Responsive breakpoints at `768px` (tablet) and `992px` (desktop) control when columns stack vs. sit side-by-side.

### The Navbar

- Sticky (`position: sticky; top: 0`) — stays visible when scrolling
- Teal bottom border (`border-bottom: 3px solid var(--ge-teal)`) and box shadow for separation
- Hamburger menu built with pure CSS pseudo-elements (`::before`, `::after`) — three horizontal lines from one `<span>`
- Mobile: nav links hidden by default, toggled via JS adding/removing the `.show` class

### Tables

The task table header uses the dark brand colour as background with white text:
```css
.task-table th { background-color: var(--ge-dark); color: white; }
```

Alternating row colours via `:nth-child(odd)` (striped rows). Completed tasks get `text-decoration: line-through` and reduced opacity.

### Priority Badges

Coloured labels next to each task: green (low), gold (medium), red (high). Small inline blocks with bold white text on a coloured background.

## How the JavaScript Works

### Data Storage

Tasks live in a plain array in memory:
```js
var tasks = [];
```
Each task is an object: `{ name, dueDate, priority, consultant, completed }`. Adding a task pushes to the array. Deleting splices it out. Nothing persists — refresh the page and they're gone.

### DOM Event Binding

On page load (`DOMContentLoaded`), the script finds elements by ID and attaches event listeners:
```js
document.getElementById('taskForm').addEventListener('submit', handleAddTask);
document.getElementById('searchBtn').addEventListener('click', handleSearch);
```
The `if (taskForm)` checks prevent errors on pages that don't have that element (e.g., the contact page doesn't have a task form).

### Rendering (DOM Manipulation)

`renderTasks()` clears the table body, loops through the `tasks` array, creates a `<tr>` for each task using `document.createElement('tr')`, fills it with `innerHTML`, and appends it to the table. Every add/delete/complete calls `renderTasks()` to rebuild the display from the array.

### Linear Search

The search iterates through every task comparing names (case-insensitive). If found, it stops early with `break`. The result is shown in a styled div — green background for found, red for not found.

### Form Validation

Pure JS validation — no HTML5 `required` attribute enforcement. Each field is checked manually (is it empty? does the email match a regex pattern?). Invalid fields get a red border applied directly via `field.style.borderColor`. Valid submission resets the form.

### XSS Prevention

User input is escaped before being inserted into HTML:
```js
function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;')...
}
```
This prevents someone typing `<script>alert('hacked')</script>` as a task name from executing code.

### Mobile Navigation

The hamburger button toggles a `.show` CSS class on the nav menu via `classList.toggle('show')`. ARIA attributes (`aria-expanded`) are updated for screen readers. Nav links auto-close the menu on mobile when clicked.

## Accessibility Features

- Skip-to-content link (hidden until focused via Tab)
- ARIA labels on interactive sections
- Focus-visible outlines (`:focus-visible`) for keyboard navigation
- Screen-reader-only class (`.sr-only`)
- Semantic HTML (`<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`)
