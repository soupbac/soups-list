import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Check, Plus, Sparkles, Sun, Trash2 } from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type Task = { id: string; text: string; completed: boolean };
const STORAGE_KEY = 'daylight-tasks';

function readTasks(): Task[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Task =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.text === 'string' &&
        typeof item.completed === 'boolean',
    );
  } catch {
    return [];
  }
}

function Home() {
  const [tasks, setTasks] = useState<Task[]>(readTasks);
  const [taskText, setTaskText] = useState('');
  const remaining = tasks.filter((task) => !task.completed).length;
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // The list remains usable when browser storage is unavailable.
    }
  }, [tasks]);

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = taskText.trim();
    if (!text) return;
    setTasks((current) => [...current, { id: crypto.randomUUID(), text, completed: false }]);
    setTaskText('');
  }

  function toggleTask(id: string) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
    );
  }

  function deleteTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  return (
    <div className="daylight-page">
      <div className="page-shell">
        <header className="topbar">
          <div className="brand" aria-label="Daylight Tasks">
            <span className="brand-mark" aria-hidden="true"><Sun size={19} strokeWidth={2.2} /></span>
            <span>daylight tasks</span>
          </div>
          <div className="date-label" data-testid="text-today">
            <span className="date-dot" aria-hidden="true" />
            <span>{dateLabel}</span>
          </div>
        </header>

        <main className="main-content">
          <section className="intro" aria-labelledby="welcome-title">
            <div className="eyebrow"><span className="eyebrow-line" /> A little room to focus</div>
            <h1 id="welcome-title">Make space<br />for <span>today.</span><Sparkles className="sparkle" size={19} aria-hidden="true" /></h1>
            <p className="intro-copy">A gentle place for the little things on your mind. Add one, take it at your own pace.</p>
          </section>

          <section className="list-card" aria-labelledby="task-list-heading">
            <div className="card-heading">
              <div>
                <h2 id="task-list-heading">Your list</h2>
                <p data-testid="text-remaining-count">
                  {remaining === 0
                    ? tasks.length > 0 ? 'Everything is done for now.' : 'A fresh page, whenever you are ready.'
                    : `${remaining} ${remaining === 1 ? 'small thing' : 'small things'} to do`}
                </p>
              </div>
              <span className="count-pill" data-testid="status-remaining">
                {remaining} left
              </span>
            </div>

            <form className="task-form" onSubmit={addTask} data-testid="form-add-task">
              <input
                className="task-input"
                type="text"
                value={taskText}
                onChange={(event) => setTaskText(event.target.value)}
                placeholder="What would you like to do?"
                aria-label="New task"
                data-testid="input-task"
                maxLength={180}
              />
              <button className="add-button" type="submit" disabled={!taskText.trim()} data-testid="button-add-task">
                <Plus size={16} strokeWidth={2.5} />
                <span>Add</span>
              </button>
            </form>

            {tasks.length > 0 ? (
              <ul className="task-list" aria-label="Tasks" data-testid="list-tasks">
                {tasks.map((task) => (
                  <li className={`task-row${task.completed ? ' is-complete' : ''}`} key={task.id} data-testid={`row-task-${task.id}`}>
                    <span className="check-wrap">
                      <input
                        className="task-checkbox"
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        aria-label={`${task.completed ? 'Mark as not done' : 'Mark as done'}: ${task.text}`}
                        data-testid={`checkbox-task-${task.id}`}
                      />
                      <span className="check-visual" aria-hidden="true"><Check size={14} strokeWidth={3} /></span>
                    </span>
                    <span className="task-text" data-testid={`text-task-${task.id}`}>{task.text}</span>
                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      aria-label={`Delete task: ${task.text}`}
                      title="Delete task"
                      data-testid={`button-delete-task-${task.id}`}
                    >
                      <Trash2 size={16} strokeWidth={1.8} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state" data-testid="empty-state">
                <span className="empty-orbit" aria-hidden="true"><Sparkles size={19} /></span>
                <strong>Nothing on the list yet</strong>
                <p>Start with one small thing. You can always add more later.</p>
              </div>
            )}

            <p className="gentle-note"><Sparkles size={12} aria-hidden="true" /> Small steps count, too.</p>
          </section>

          <aside className="visual-column" aria-label="A little daylight">
            <div className="sun-art" aria-hidden="true">
              <div className="sun-halo" />
              <span className="orbit-dot one" />
              <span className="orbit-dot two" />
              <span className="orbit-dot three" />
              <div className="sun-core"><Sun size={65} strokeWidth={1.15} /></div>
            </div>
            <p className="visual-caption"><strong>One thing at a time.</strong><br />Your day can unfold gently.</p>
          </aside>
        </main>
        <footer className="footer-note">A softer way to get things done</footer>
      </div>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
