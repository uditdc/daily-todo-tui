# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Running the Application
```bash
npm start          # Run the TUI application
npm run dev        # Development mode (same as start)
tsx src/todo.tsx   # Direct execution
```

### TypeScript
```bash
npx tsc --noEmit   # Type checking only (no build output)
```

### CLI Usage Examples
```bash
npm start add "Buy groceries" high --persistent
npm start tui      # Explicit TUI mode
```

## Architecture Overview

This is a Terminal User Interface (TUI) todo application built with React and Ink. The application has dual modes: interactive TUI and command-line interface.

### Core Structure
- **Single-file architecture**: All code lives in `src/todo.tsx` (590+ lines)
- **Data persistence**: JSON file storage in user's home directory (`~/.daily-todo.json`)
- **Daily reset functionality**: Non-persistent todos automatically reset each day
- **Tag support**: Extract hashtags from task descriptions

### Key Classes and Components

#### TodoManager (Static Class)
Handles all data operations:
- `loadTodos()`: Loads and handles daily reset logic
- `saveTodos()`: Persists to JSON file
- `addTodo()`, `toggleComplete()`, `removeTodo()`: CRUD operations
- `extractTags()`: Parses hashtags from task text
- `getStats()`: Calculates completion metrics

#### React Components
- **TodoApp**: Main application component with keyboard navigation
- **Header**: Styled header with date and title
- **TodoItem**: Individual todo rendering with priority icons
- **AddTodoForm**: Multi-step form for creating todos
- **StatusBar**: Shows completion stats and current view
- **HelpPanel/StatsPanel**: Modal-style information panels

### Data Models
```typescript
interface Todo {
  id: number;
  task: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  persistent: boolean;  // Survives daily reset
  createdAt: string;
  completedAt?: string;
  tags: string[];       // Extracted from task text
}
```

### Key Features
- **Priority system**: High/Medium/Low with visual indicators (🔥⚡💧)
- **Persistent todos**: Marked todos carry over to next day
- **View filtering**: All/Pending/Completed views
- **Keyboard navigation**: Full keyboard control with Ink's useInput
- **Daily reset**: Automatic cleanup of non-persistent todos

### TUI Implementation Details
- Uses Ink for React-in-terminal rendering
- ASCII box drawing characters for UI borders
- Color-coded priority system with emojis
- Form handling with multi-field navigation
- Real-time statistics and completion tracking

### File I/O Pattern
All data operations go through TodoManager class methods that automatically handle JSON serialization and daily reset logic. No direct file system access elsewhere in the code.