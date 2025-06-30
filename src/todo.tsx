#!/usr/bin/env tsx

import React, { useState, useEffect, useMemo, memo } from 'react';
import { render, Box, Text, useInput, useApp, Spacer } from 'ink';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Types and Interfaces
interface Todo {
  id: number;
  task: string;
  completed: boolean;
  priority: Priority;
  persistent: boolean;
  createdAt: string;
  completedAt?: string;
  tags: string[];
}

interface TodoData {
  todos: Todo[];
  lastUpdated: string;
}

type Priority = 'high' | 'medium' | 'low';
type ViewType = 'all' | 'pending' | 'completed';
type FormField = 'task' | 'priority' | 'persistent';

interface PriorityConfig {
  [key: string]: {
    color: string;
    icon: string;
    order: number;
    label: string;
  };
}

interface AppState {
  todos: Todo[];
  selectedIndex: number;
  view: ViewType;
  showAddForm: boolean;
  showHelp: boolean;
  showStats: boolean;
  error: string | null;
}

// Design System & Configuration
const TODO_FILE = path.join(os.homedir(), '.daily-todo.json');

const THEME = {
  colors: {
    primary: 'blue',
    secondary: 'cyan',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    muted: 'gray',
    text: 'white',
    background: 'black'
  },
  spacing: {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4
  },
  layout: {
    maxWidth: 80,
    contentPadding: 2
  }
} as const;

const PRIORITY_CONFIG: PriorityConfig = {
  high: { color: 'red', icon: '●', order: 0, label: 'High' },
  medium: { color: 'yellow', icon: '●', order: 1, label: 'Med' },
  low: { color: 'blue', icon: '●', order: 2, label: 'Low' }
};

const SYMBOLS = {
  completed: '✓',
  pending: '○',
  persistent: '⬡',
  selected: '▶',
  unselected: ' ',
  bullet: '•'
} as const;

// Data Management Class
class TodoManager {
  private static validateTodo(todo: Partial<Todo>): todo is Todo {
    return (
      typeof todo.id === 'number' &&
      typeof todo.task === 'string' &&
      todo.task.trim().length > 0 &&
      typeof todo.completed === 'boolean' &&
      ['high', 'medium', 'low'].includes(todo.priority as string) &&
      typeof todo.persistent === 'boolean' &&
      typeof todo.createdAt === 'string' &&
      Array.isArray(todo.tags)
    );
  }

  static loadTodos(): TodoData {
    try {
      if (!fs.existsSync(TODO_FILE)) {
        return {
          todos: [],
          lastUpdated: new Date().toDateString()
        };
      }

      const data = fs.readFileSync(TODO_FILE, 'utf8');
      if (!data.trim()) {
        return {
          todos: [],
          lastUpdated: new Date().toDateString()
        };
      }

      const parsed: TodoData = JSON.parse(data);
      
      // Validate data structure
      if (!parsed.todos || !Array.isArray(parsed.todos)) {
        throw new Error('Invalid todo data format');
      }

      // Filter out invalid todos
      const validTodos = parsed.todos.filter(this.validateTodo);
      if (validTodos.length !== parsed.todos.length) {
        console.warn(`Filtered out ${parsed.todos.length - validTodos.length} invalid todos`);
      }
      
      // Reset daily todos if it's a new day
      const today = new Date().toDateString();
      const finalTodos = parsed.lastUpdated !== today 
        ? validTodos.filter(todo => todo.persistent)
        : validTodos;

      const result = {
        todos: finalTodos,
        lastUpdated: today
      };

      if (parsed.lastUpdated !== today) {
        this.saveTodos(result);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to load todos: ${(error as Error).message}`);
    }
  }

  static saveTodos(data: TodoData): void {
    try {
      // Validate all todos before saving
      const validTodos = data.todos.filter(this.validateTodo);
      if (validTodos.length !== data.todos.length) {
        console.warn(`Filtered out ${data.todos.length - validTodos.length} invalid todos before saving`);
      }

      const dataToSave = {
        ...data,
        todos: validTodos
      };

      fs.writeFileSync(TODO_FILE, JSON.stringify(dataToSave, null, 2));
    } catch (error) {
      throw new Error(`Failed to save todos: ${(error as Error).message}`);
    }
  }

  static addTodo(
    todos: Todo[], 
    task: string, 
    priority: Priority = 'medium', 
    persistent: boolean = false
  ): Todo[] {
    const trimmedTask = task.trim();
    if (!trimmedTask) {
      throw new Error('Task cannot be empty');
    }

    if (!['high', 'medium', 'low'].includes(priority)) {
      throw new Error('Invalid priority level');
    }

    const todo: Todo = {
      id: Date.now() + Math.random(), // Avoid collisions
      task: trimmedTask,
      completed: false,
      priority,
      persistent,
      createdAt: new Date().toISOString(),
      tags: this.extractTags(trimmedTask)
    };
    
    const newTodos = [...todos, todo];
    const data: TodoData = {
      todos: newTodos,
      lastUpdated: new Date().toDateString()
    };
    
    this.saveTodos(data);
    return newTodos;
  }

  static extractTags(task: string): string[] {
    const tagRegex = /#(\w+)/g;
    const tags: string[] = [];
    let match: RegExpExecArray | null;
    
    while ((match = tagRegex.exec(task)) !== null) {
      tags.push(match[1]);
    }
    
    return tags;
  }

  static toggleComplete(todos: Todo[], todoId: number): Todo[] {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) {
      throw new Error('Todo not found');
    }

    const newTodos = todos.map(todo => 
      todo.id === todoId 
        ? { 
            ...todo, 
            completed: !todo.completed, 
            completedAt: todo.completed ? undefined : new Date().toISOString() 
          }
        : todo
    );
    
    const data: TodoData = {
      todos: newTodos,
      lastUpdated: new Date().toDateString()
    };
    
    this.saveTodos(data);
    return newTodos;
  }

  static removeTodo(todos: Todo[], todoId: number): Todo[] {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) {
      throw new Error('Todo not found');
    }

    const newTodos = todos.filter(todo => todo.id !== todoId);
    const data: TodoData = {
      todos: newTodos,
      lastUpdated: new Date().toDateString()
    };
    
    this.saveTodos(data);
    return newTodos;
  }

  static getStats(todos: Todo[]) {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const high = todos.filter(t => t.priority === 'high' && !t.completed).length;
    const persistent = todos.filter(t => t.persistent).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, high, persistent, completionRate };
  }
}

// Component Props Interfaces
interface TodoItemProps {
  todo: Todo;
  isSelected: boolean;
}

interface AddTodoFormProps {
  onAdd: (task: string, priority: Priority, persistent: boolean) => void;
  onCancel: () => void;
}

interface StatusBarProps {
  todos: Todo[];
  view: ViewType;
}

interface StatsPanelProps {
  todos: Todo[];
}

interface HeaderProps {
  date: string;
}

// Components
const Header: React.FC<HeaderProps> = memo(({ date }) => {
  const title = "Daily Todo";
  
  return (
    <Box flexDirection="column" marginBottom={THEME.spacing.sm}>
      <Box justifyContent="space-between" paddingX={THEME.layout.contentPadding}>
        <Text bold color={THEME.colors.primary}>{title}</Text>
        <Text color={THEME.colors.muted}>{date}</Text>
      </Box>
      <Box paddingX={THEME.layout.contentPadding}>
        <Text color={THEME.colors.muted}>{"─".repeat(THEME.layout.maxWidth - 4)}</Text>
      </Box>
    </Box>
  );
});

Header.displayName = 'Header';

const TodoItem: React.FC<TodoItemProps> = memo(({ todo, isSelected }) => {
  const priorityConfig = PRIORITY_CONFIG[todo.priority];
  const statusIcon = todo.completed ? SYMBOLS.completed : SYMBOLS.pending;
  const selector = isSelected ? SYMBOLS.selected : SYMBOLS.unselected;
  
  return (
    <Box paddingX={THEME.layout.contentPadding} paddingY={0}>
      <Text color={isSelected ? THEME.colors.primary : THEME.colors.muted}>
        {selector}
      </Text>
      <Text color={todo.completed ? THEME.colors.success : THEME.colors.muted}>
        {statusIcon}
      </Text>
      <Text color="white"> </Text>
      <Text 
        color={todo.completed ? THEME.colors.muted : THEME.colors.text}
        strikethrough={todo.completed}
        dimColor={todo.completed}
      >
        {todo.task}
      </Text>
      {todo.tags.length > 0 && (
        <Text color={THEME.colors.secondary} dimColor>
          {' #'}{todo.tags.join(' #')}
        </Text>
      )}
      <Spacer />
      <Text color={priorityConfig.color} dimColor>
        {priorityConfig.label}
      </Text>
      {todo.persistent && (
        <Text color={THEME.colors.warning}> {SYMBOLS.persistent}</Text>
      )}
    </Box>
  );
});

TodoItem.displayName = 'TodoItem';

const AddTodoForm: React.FC<AddTodoFormProps> = ({ onAdd, onCancel }) => {
  const [task, setTask] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [persistent, setPersistent] = useState<boolean>(false);
  const [field, setField] = useState<FormField>('task');
  const [error, setError] = useState<string>('');

  useInput((input, key) => {
    setError('');
    
    if (key.return) {
      if (field === 'task') {
        if (!task.trim()) {
          setError('Task cannot be empty');
          return;
        }
        setField('priority');
      } else if (field === 'priority') {
        setField('persistent');
      } else if (field === 'persistent') {
        onAdd(task.trim(), priority, persistent);
      }
    } else if (key.escape) {
      onCancel();
    } else if (field === 'task') {
      if (key.backspace || key.delete) {
        setTask(prev => prev.length > 0 ? prev.slice(0, -1) : '');
      } else if (input && input.length > 0 && input.charCodeAt(0) >= 32) {
        setTask(prev => prev + input);
      }
    } else if (field === 'priority') {
      if (input === '1' || input.toLowerCase() === 'h') setPriority('high');
      else if (input === '2' || input.toLowerCase() === 'm') setPriority('medium');
      else if (input === '3' || input.toLowerCase() === 'l') setPriority('low');
      else if (key.upArrow) {
        const priorities: Priority[] = ['low', 'medium', 'high'];
        const currentIndex = priorities.indexOf(priority);
        setPriority(priorities[Math.min(currentIndex + 1, priorities.length - 1)]);
      } else if (key.downArrow) {
        const priorities: Priority[] = ['low', 'medium', 'high'];
        const currentIndex = priorities.indexOf(priority);
        setPriority(priorities[Math.max(currentIndex - 1, 0)]);
      }
    } else if (field === 'persistent') {
      if (input === 'y' || input === 'Y' || key.rightArrow) setPersistent(true);
      else if (input === 'n' || input === 'N' || key.leftArrow) setPersistent(false);
    }
  });

  return (
    <Box flexDirection="column" paddingX={THEME.layout.contentPadding} marginY={THEME.spacing.sm}>
      <Text bold color={THEME.colors.success}>Add New Todo</Text>
      
      <Box marginTop={THEME.spacing.xs}>
        <Text color={field === 'task' ? THEME.colors.primary : THEME.colors.muted}>Task: </Text>
        <Text color={THEME.colors.text}>{task}</Text>
        {field === 'task' && <Text color={THEME.colors.primary}>█</Text>}
      </Box>
      
      <Box>
        <Text color={field === 'priority' ? THEME.colors.primary : THEME.colors.muted}>Priority: </Text>
        <Text color={THEME.colors.text}>{PRIORITY_CONFIG[priority].label} </Text>
        <Text color={THEME.colors.muted}>(1/h:high, 2/m:medium, 3/l:low)</Text>
      </Box>
      
      <Box>
        <Text color={field === 'persistent' ? THEME.colors.primary : THEME.colors.muted}>Persistent: </Text>
        <Text color={THEME.colors.text}>{persistent ? 'Yes' : 'No'} </Text>
        <Text color={THEME.colors.muted}>(y/n)</Text>
      </Box>
      
      <Box marginTop={THEME.spacing.xs}>
        <Text color={THEME.colors.muted}>Enter to continue • Esc to cancel</Text>
      </Box>
      
      {error && (
        <Box>
          <Text color={THEME.colors.error}>{error}</Text>
        </Box>
      )}
    </Box>
  );
};

const StatusBar: React.FC<StatusBarProps> = memo(({ todos, view }) => {
  const stats = useMemo(() => TodoManager.getStats(todos), [todos]);
  
  return (
    <Box flexDirection="column" marginTop={THEME.spacing.sm}>
      <Box paddingX={THEME.layout.contentPadding}>
        <Text color={THEME.colors.muted}>{"─".repeat(THEME.layout.maxWidth - 4)}</Text>
      </Box>
      <Box justifyContent="space-between" paddingX={THEME.layout.contentPadding}>
        <Box>
          <Text color={THEME.colors.success}>{stats.completed} done</Text>
          <Text color={THEME.colors.muted}> • </Text>
          <Text color={THEME.colors.warning}>{stats.pending} pending</Text>
          {stats.high > 0 && (
            <>
              <Text color={THEME.colors.muted}> • </Text>
              <Text color={THEME.colors.error}>{stats.high} urgent</Text>
            </>
          )}
        </Box>
        <Text color={THEME.colors.secondary}>{view}</Text>
      </Box>
    </Box>
  );
});

StatusBar.displayName = 'StatusBar';

const HelpPanel: React.FC = memo(() => (
  <Box flexDirection="column" paddingX={THEME.layout.contentPadding} marginY={THEME.spacing.sm}>
    <Text bold color={THEME.colors.primary}>Keyboard Shortcuts</Text>
    <Box marginTop={THEME.spacing.xs}>
      <Text color={THEME.colors.muted}>Navigation: ↑↓/jk Move • g/G First/Last • Space/Enter Toggle</Text>
    </Box>
    <Box>
      <Text color={THEME.colors.muted}>Actions: a/n Add • d/Del Delete • v/Tab Views • 1/2/3 Quick View</Text>
    </Box>
    <Box>
      <Text color={THEME.colors.muted}>Info: s/i Stats • h/? Help • q/Esc Quit</Text>
    </Box>
    <Box marginTop={THEME.spacing.xs}>
      <Text color={THEME.colors.secondary}>Tips:</Text>
    </Box>
    <Box>
      <Text color={THEME.colors.muted}>• Use #tags for organization • Persistent todos survive daily reset</Text>
    </Box>
  </Box>
));

HelpPanel.displayName = 'HelpPanel';

const StatsPanel: React.FC<StatsPanelProps> = memo(({ todos }) => {
  const stats = useMemo(() => TodoManager.getStats(todos), [todos]);

  return (
    <Box flexDirection="column" paddingX={THEME.layout.contentPadding} marginY={THEME.spacing.sm}>
      <Text bold color={THEME.colors.primary}>Statistics</Text>
      <Box marginTop={THEME.spacing.xs}>
        <Text color={THEME.colors.muted}>Total: </Text>
        <Text color={THEME.colors.text}>{stats.total}</Text>
        <Text color={THEME.colors.muted}> • Completed: </Text>
        <Text color={THEME.colors.success}>{stats.completed}</Text>
        <Text color={THEME.colors.muted}> • Pending: </Text>
        <Text color={THEME.colors.warning}>{stats.pending}</Text>
      </Box>
      <Box>
        <Text color={THEME.colors.muted}>High priority: </Text>
        <Text color={THEME.colors.error}>{stats.high}</Text>
        <Text color={THEME.colors.muted}> • Persistent: </Text>
        <Text color={THEME.colors.secondary}>{stats.persistent}</Text>
      </Box>
      <Box>
        <Text color={THEME.colors.muted}>Completion rate: </Text>
        <Text color={THEME.colors.primary}>{stats.completionRate}%</Text>
      </Box>
    </Box>
  );
});

StatsPanel.displayName = 'StatsPanel';

// Main App Component
const TodoApp: React.FC = () => {
  const [state, setState] = useState<AppState>({
    todos: [],
    selectedIndex: 0,
    view: 'all',
    showAddForm: false,
    showHelp: false,
    showStats: false,
    error: null
  });
  const { exit } = useApp();
  const today = useMemo(() => new Date().toDateString(), []);
  
  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Load todos on mount
  useEffect(() => {
    try {
      const data = TodoManager.loadTodos();
      updateState({ todos: data.todos, error: null });
    } catch (error) {
      updateState({ error: `Failed to load todos: ${(error as Error).message}` });
    }
  }, []);

  // Filter todos based on view
  const filteredTodos = state.todos.filter(todo => {
    switch (state.view) {
      case 'pending':
        return !todo.completed;
      case 'completed':
        return todo.completed;
      default:
        return true;
    }
  });

  // Sort todos by priority and completion status
  const sortedTodos = filteredTodos.sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return PRIORITY_CONFIG[a.priority].order - PRIORITY_CONFIG[b.priority].order;
  });

  // Handle keyboard input
  useInput((input, key) => {
    if (state.showAddForm) return; // Let AddTodoForm handle input

    // Clear error on any input
    if (state.error) {
      updateState({ error: null });
    }

    // Navigation
    if (key.upArrow || input === 'k') {
      if (state.selectedIndex > 0) {
        updateState({ selectedIndex: state.selectedIndex - 1 });
      }
    } else if (key.downArrow || input === 'j') {
      if (state.selectedIndex < sortedTodos.length - 1) {
        updateState({ selectedIndex: state.selectedIndex + 1 });
      }
    } else if (input === 'g') {
      updateState({ selectedIndex: 0 });
    } else if (input === 'G') {
      updateState({ selectedIndex: Math.max(0, sortedTodos.length - 1) });
    } 
    // Actions on selected todo
    else if ((input === ' ' || key.return) && sortedTodos[state.selectedIndex]) {
      try {
        const newTodos = TodoManager.toggleComplete(state.todos, sortedTodos[state.selectedIndex].id);
        updateState({ todos: newTodos });
      } catch (error) {
        updateState({ error: `Failed to toggle todo: ${(error as Error).message}` });
      }
    } else if ((input === 'd' || input === 'D' || key.delete) && sortedTodos[state.selectedIndex]) {
      try {
        const newTodos = TodoManager.removeTodo(state.todos, sortedTodos[state.selectedIndex].id);
        const newSelectedIndex = state.selectedIndex >= newTodos.length ? Math.max(0, newTodos.length - 1) : state.selectedIndex;
        updateState({ todos: newTodos, selectedIndex: newSelectedIndex });
      } catch (error) {
        updateState({ error: `Failed to delete todo: ${(error as Error).message}` });
      }
    }
    // App actions
    else if (input === 'a' || input === 'A' || input === 'n') {
      updateState({ showAddForm: true, showHelp: false, showStats: false });
    } else if (input === 'v' || input === 'V' || key.tab) {
      const views: ViewType[] = ['all', 'pending', 'completed'];
      const currentIndex = views.indexOf(state.view);
      updateState({ view: views[(currentIndex + 1) % views.length], selectedIndex: 0 });
    } else if (input === '1') {
      updateState({ view: 'all', selectedIndex: 0 });
    } else if (input === '2') {
      updateState({ view: 'pending', selectedIndex: 0 });
    } else if (input === '3') {
      updateState({ view: 'completed', selectedIndex: 0 });
    }
    // Info panels
    else if (input === 'h' || input === 'H' || input === '?') {
      updateState({ showHelp: !state.showHelp, showStats: false });
    } else if (input === 's' || input === 'S' || input === 'i') {
      updateState({ showStats: !state.showStats, showHelp: false });
    } 
    // Exit
    else if (input === 'q' || input === 'Q' || key.escape) {
      exit();
    }
  });

  const handleAddTodo = (task: string, priority: Priority, persistent: boolean): void => {
    try {
      const newTodos = TodoManager.addTodo(state.todos, task, priority, persistent);
      updateState({ todos: newTodos, showAddForm: false, error: null });
    } catch (error) {
      updateState({ error: `Failed to add todo: ${(error as Error).message}` });
    }
  };

  const handleCancelAdd = (): void => {
    updateState({ showAddForm: false, error: null });
  };

  // Adjust selected index if it's out of bounds
  useEffect(() => {
    if (state.selectedIndex >= sortedTodos.length) {
      updateState({ selectedIndex: Math.max(0, sortedTodos.length - 1) });
    }
  }, [sortedTodos.length, state.selectedIndex]);

  return (
    <Box flexDirection="column" minHeight={24}>
      <Header date={today} />
      
      {state.error && (
        <Box paddingX={THEME.layout.contentPadding}>
          <Text color={THEME.colors.error}>{state.error}</Text>
        </Box>
      )}
      
      {state.showAddForm ? (
        <AddTodoForm onAdd={handleAddTodo} onCancel={handleCancelAdd} />
      ) : (
        <Box flexDirection="column" flexGrow={1}>
          <Box flexDirection="column" minHeight={5} flexGrow={1}>
            {sortedTodos.length === 0 ? (
              <Box padding={THEME.spacing.md}>
                <Text color={THEME.colors.muted}>No todos found. Press 'a' to add one!</Text>
              </Box>
            ) : (
              sortedTodos.map((todo, index) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  isSelected={index === state.selectedIndex}
                />
              ))
            )}
          </Box>

          {state.showHelp && <HelpPanel />}
          {state.showStats && <StatsPanel todos={state.todos} />}
        </Box>
      )}

      <StatusBar todos={state.todos} view={state.view} />
    </Box>
  );
};

// CLI Interface
interface CLIArgs {
  command?: string;
  task?: string;
  priority?: Priority;
  persistent?: boolean;
}

const parseArgs = (args: string[]): CLIArgs => {
  const [command, task, priority] = args;
  return {
    command,
    task,
    priority: (priority as Priority) || 'medium',
    persistent: args.includes('--persistent') || args.includes('-p')
  };
};

// Entry Point
const main = (): void => {
  const args = process.argv.slice(2);
  const { command, task, priority, persistent } = parseArgs(args);

  
  if (args.length === 0) {
    // console.log('Starting TUI mode');
    console.clear()
    // Start TUI mode
    render(<TodoApp />);
  } else {
    // Command line mode
    const data = TodoManager.loadTodos();

    switch (command) {
      case 'add':
      case 'a':
        if (!task) {
          console.log('Usage: todo add "task description" [priority] [--persistent]');
          break;
        }
        TodoManager.addTodo(data.todos, task, priority!, persistent!);
        console.log(`✓ Added: ${task}`);
        break;

      case 'tui':
      case 'ui':
        render(<TodoApp />);
        break;

      default:
        console.log(`Daily Todo - Modern Terminal Interface

Usage:
  npm start                           # Interactive TUI mode
  npm start add "task" [priority] [-p] # Add from command line
  npm start tui                       # Explicit TUI mode

Keyboard Shortcuts:
  Navigation    ↑↓ j k         Move up/down
                g G             First/last item
                Space Enter     Toggle completion
                
  Actions       a n             Add new todo
                d Delete        Remove todo
                v Tab           Cycle views
                1 2 3           Quick view switch
                
  Information   s i             Show statistics  
                h ?             Show help
                q Esc           Quit

Features:
  • Daily reset (except persistent todos)
  • Priority levels with visual indicators
  • Tag support with #hashtags
  • Multiple view modes
  • Completion tracking

Data stored at: ${TODO_FILE}`);
    }
  }
};

main();

export { TodoManager, Todo, TodoData, Priority, ViewType };
export default TodoApp;