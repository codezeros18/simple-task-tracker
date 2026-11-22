// Mirrors the backend rules (backend/app/models.py and backend/app/schemas.py)
export const STATUSES = ['Todo', 'In Progress', 'Done']
export const TITLE_MAX = 120
export const DESC_MAX = 2000

// How long a success notice stays on screen
export const NOTICE_MS = 3000

// The title counter appears once the title gets close to TITLE_MAX
export const TITLE_COUNTER_FROM = 100

// Placeholder cards per column while the first load is running
export const SKELETON_CARDS = 2
