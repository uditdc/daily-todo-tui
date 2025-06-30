# Daily Todo TUI

A beautiful terminal-based todo application built with React and Ink, featuring a modern TUI interface.

## Features

- ✨ **Modern TUI Interface** - Beautiful terminal UI with colors and icons
- 📋 **Daily Todo Management** - Todos reset daily (except persistent ones)
- 🏷️ **Tag Support** - Use #tags in your task descriptions
- ⭐ **Priority Levels** - High, Medium, Low priority with visual indicators
- 🔄 **Persistent Todos** - Mark todos to carry over to next day
- 📊 **Statistics** - Track completion rates and task counts
- 🎯 **Multiple Views** - All, Pending, and Completed views
- ⌨️ **Keyboard Navigation** - Full keyboard support

## Recent Fixes

### ✅ Fixed Issues
- **Backspace Handling** - Fixed backspace not working in todo input field
- **Header Alignment** - Fixed broken header alignment with proper spacing calculations
- **Input Validation** - Added better input validation and error handling
- **Case Insensitive Controls** - All keyboard shortcuts now work with both upper and lowercase

### 🔧 Improvements
- Better error handling in form inputs
- Improved visual feedback for empty tasks
- Enhanced help panel with tips
- More robust keyboard input handling
- Proper spacing calculations for UI elements

## Installation

```bash
npm install
```

## Usage

### Interactive TUI Mode
```bash
npm start
# or
npm run dev
```

### Command Line Mode
```bash
# Add a todo
npm start add "Buy groceries" high --persistent

# Start TUI mode explicitly
npm start tui
```

## Controls

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate todos |
| Space | Toggle complete |
| d/D | Delete todo |
| a/A | Add new todo |
| v/V | Change view (all/pending/completed) |
| s/S | Show statistics |
| h/H | Toggle help |
| q/Q | Quit |
| Esc | Quit (when not in form) |

## Tips

- Use `#tags` in your task descriptions for better organization
- Mark important todos as "persistent" to carry them over daily
- High priority tasks appear first in the list
- The app automatically resets non-persistent todos each day

## Technical Details

- Built with React and Ink for TUI
- TypeScript for type safety
- JSON file storage in user's home directory
- Automatic daily todo reset
- Tag extraction from task descriptions

## Development

```bash
# Type check
npx tsc --noEmit

# Run in development
npm run dev
```

The todo data is stored in `~/.daily-todo.json` and automatically manages daily resets for non-persistent todos. 