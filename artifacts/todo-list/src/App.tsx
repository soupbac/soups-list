import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Moon, Plus, Sun, Trash2 } from 'lucide-react';
import backgroundImage from '@assets/imagestretcherIO-2026-10-24_14-32-59_1792845376693.png';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

type Priority = 'high' | 'medium' | 'low';
type Theme = 'light' | 'dark';
type Task = {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  dueDate: string;
};

const STORAGE_KEY = 'daylight-tasks';
const THEME_STORAGE_KEY = 'soups-list-theme';

function isPriority(value: unknown): value is Priority {
  return value === 'high' || value === 'medium' || value === 'low';
}

function readTasks(): Task[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === 'object' && item !== null && !Array.isArray(item),
      )
      .filter(
        (item) =>
          typeof item.id === 'string' &&
          typeof item.text === 'string' &&
          typeof item.completed === 'boolean',
      )
      .map((item) => ({
        id: item.id as string,
        text: item.text as string,
        completed: item.completed as boolean,
        priority: isPriority(item.priority) ? item.priority : 'medium',
        dueDate:
          typeof item.dueDate === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)
            ? item.dueDate
            : '',
      }));
  } catch {
    return [];
  }
}

function readTheme(): Theme {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark'
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

function formatDueDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function isOverdue(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return false;

  const due = new Date(year, month - 1, day);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function Home() {
  const [tasks, setTasks] = useState<Task[]>(readTasks);
  const [taskText, setTaskText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [theme, setTheme] = useState<Theme>(readTheme);
  const remaining = tasks.filter((task) => !task.completed).length;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Keep the list usable if browser storage is unavailable.
    }
  }, [tasks]);

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The selected theme remains active for the current session.
    }
  }, [theme]);

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = taskText.trim();
    if (!text) return;

    setTasks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        text,
        completed: false,
        priority,
        dueDate,
      },
    ]);
    setTaskText('');
    setPriority('medium');
    setDueDate('');
  }

  function toggleTask(id: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function deleteTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  return (
    <div
      className={`soups-page${theme === 'dark' ? ' theme-dark' : ''}`}
      style={{ backgroundImage: `url("${backgroundImage}")` }}
    >
      <div className="page-content">
        <header className="page-header">
          <h1>Soup&apos;s List</h1>
          <button
            className="theme-toggle"
            type="button"
            onClick={() =>
              setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
            }
            aria-label={
              theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
            aria-pressed={theme === 'dark'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            data-testid="button-theme-toggle"
          >
            {theme === 'dark' ? (
              <Sun size={19} aria-hidden="true" />
            ) : (
              <Moon size={19} aria-hidden="true" />
            )}
          </button>
        </header>

        <main className="task-panel">
          <div className="remaining-count" data-testid="status-remaining">
            {remaining} left
          </div>

          <form
            className="task-form"
            onSubmit={addTask}
            data-testid="form-add-task"
          >
            <input
              className="task-input"
              type="text"
              value={taskText}
              onChange={(event) => setTaskText(event.target.value)}
              placeholder="New task"
              aria-label="New task"
              data-testid="input-task"
              maxLength={180}
            />
            <select
              className="priority-select"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as Priority)
              }
              aria-label="Priority"
              data-testid="select-priority"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input
              className="due-date-input"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              aria-label="Due date"
              data-testid="input-due-date"
            />
            <button
              className="add-button"
              type="submit"
              disabled={!taskText.trim()}
              data-testid="button-add-task"
            >
              <Plus size={17} strokeWidth={2.5} aria-hidden="true" />
              <span>Add</span>
            </button>
          </form>

          {tasks.length > 0 ? (
            <ul className="task-list" aria-label="Tasks" data-testid="list-tasks">
              {tasks.map((task) => {
                const overdue = Boolean(task.dueDate) && isOverdue(task.dueDate);

                return (
                  <li
                    className={`task-row${task.completed ? ' is-complete' : ''}`}
                    key={task.id}
                    data-testid={`row-task-${task.id}`}
                  >
                    <input
                      className="task-checkbox"
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      aria-label={`${task.completed ? 'Mark as not done' : 'Mark as done'}: ${task.text}`}
                      data-testid={`checkbox-task-${task.id}`}
                    />
                    <div className="task-details">
                      <span
                        className="task-text"
                        data-testid={`text-task-${task.id}`}
                      >
                        {task.text}
                      </span>
                      <span className="task-meta">
                        <span
                          className={`priority-badge priority-${task.priority}`}
                          data-testid={`text-priority-${task.id}`}
                        >
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span
                            className={`due-date${overdue && !task.completed ? ' is-overdue' : ''}`}
                            data-testid={`text-due-date-${task.id}`}
                          >
                            {overdue && !task.completed ? 'Overdue · ' : 'Due '}
                            {formatDueDate(task.dueDate)}
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      aria-label={`Delete task: ${task.text}`}
                      title="Delete task"
                      data-testid={`button-delete-task-${task.id}`}
                    >
                      <Trash2 size={17} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="empty-state" data-testid="empty-state">
              No tasks yet
            </p>
          )}
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Router />
    </WouterRouter>
  );
}

export default App;
