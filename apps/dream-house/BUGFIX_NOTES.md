# DREAM HOUSE runtime fix

- Fix prerequisite checks so later build cards do not throw during initial render.
- Use explicit DOM references instead of relying on browser-generated globals from element ids.
- Restore saved state only after helper functions are initialized.
