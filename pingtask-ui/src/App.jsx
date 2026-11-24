import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pingtask_v1';

const DEFAULT_TASKS = [
  {
    id: 1,
    title: 'Настроить локальный прототип PingTask',
    description: 'Проверка формы создания задач без отправки в Telegram',
    deadline: '2026-11-26T18:00',
    remindBefore: 30,
    tgUser: '@gorizontaal',
    done: false,
  },
];

export default function App() {
  // 1. Загружаем задачи из localStorage при первом запуске
  const [tasks, setTasks] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_TASKS;
    } catch {
      return DEFAULT_TASKS;
    }
  });

  // Состояния полей формы
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [remindBefore, setRemindBefore] = useState(30);
  const [tgUser, setTgUser] = useState('');

  // Фильтр списка и раскрытые превью JSON
  const [filter, setFilter] = useState('all');
  const [expandedJson, setExpandedJson] = useState({});

  // 2. Сохраняем задачи локально в браузере (никакой отправки в сеть/бот)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Добавление новой задачи только в локальное состояние
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!title.trim() || !deadline || !tgUser.trim()) return;

    const normalizedUser = tgUser.trim().startsWith('@')
      ? tgUser.trim()
      : `@${tgUser.trim()}`;

    const createdTask = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      deadline,
      remindBefore: Number(remindBefore),
      tgUser: normalizedUser,
      done: false,
    };

    setTasks((prev) => [createdTask, ...prev]);

    setTitle('');
    setDescription('');
    setDeadline('');
    setRemindBefore(30);
  };

  const toggleDone = (id) => {
    setTasks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const removeTask = (id) => {
    setTasks((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleJson = (id) => {
    setExpandedJson((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Черновик структуры данных под будущий aiogram-бот / FastAPI
  const buildBotPayload = (task) =>
    JSON.stringify(
      {
        event: 'create_task',
        task_id: task.id,
        recipient: task.tgUser,
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        remind_before_minutes: task.remindBefore,
      },
      null,
      2
    );

  const visibleTasks = tasks.filter((item) => {
    if (filter === 'active') return !item.done;
    if (filter === 'done') return item.done;
    return true;
  });

  const stats = {
    total: tasks.length,
    active: tasks.filter((t) => !t.done).length,
    done: tasks.filter((t) => t.done).length,
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="logo-box">
            <div className="logo-mark">P</div>
            <div>
              <div className="logo-title">
                Ping<span>Task</span>
              </div>
            </div>
          </div>
          <div className="mode-pill">Передача в бот отключена</div>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <h1 className="panel-title">Новая задача</h1>
          <p className="panel-hint">Данные хранятся только в браузере (localStorage)</p>

          <form onSubmit={handleAddTask}>
            <div className="field">
              <label htmlFor="task-title">Название *</label>
              <input
                id="task-title"
                type="text"
                required
                placeholder="Например: Сдать лабу по сетям"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="task-desc">Описание</label>
              <textarea
                id="task-desc"
                rows="2"
                placeholder="Краткие детали..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="field field-row">
              <div>
                <label htmlFor="task-deadline">Дедлайн *</label>
                <input
                  id="task-deadline"
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="task-remind">Напомнить за</label>
                <select
                  id="task-remind"
                  value={remindBefore}
                  onChange={(e) => setRemindBefore(e.target.value)}
                >
                  <option value={15}>15 минут</option>
                  <option value={30}>30 минут</option>
                  <option value={60}>1 час</option>
                  <option value={180}>3 часа</option>
                  <option value={1440}>1 день</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="task-tg">Telegram получателя *</label>
              <input
                id="task-tg"
                type="text"
                required
                placeholder="@username"
                value={tgUser}
                onChange={(e) => setTgUser(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-gold">
              + Добавить задачу
            </button>
          </form>
        </section>

        <section>
          <div className="panel bar">
            <div className="counters">
              <span>
                Всего: <b>{stats.total}</b>
              </span>
              <span>
                Активно: <b className="c-gold">{stats.active}</b>
              </span>
              <span>
                Готово: <b className="c-green">{stats.done}</b>
              </span>
            </div>

            <div className="tabs">
              <button
                type="button"
                className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Все
              </button>
              <button
                type="button"
                className={`tab-btn ${filter === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('active')}
              >
                Активные
              </button>
              <button
                type="button"
                className={`tab-btn ${filter === 'done' ? 'active' : ''}`}
                onClick={() => setFilter('done')}
              >
                Готовые
              </button>
            </div>
          </div>

          <div className="tasks">
            {visibleTasks.length > 0 ? (
              visibleTasks.map((task) => (
                <article
                  key={task.id}
                  className={`task-card ${task.done ? 'done' : ''}`}
                >
                  <div className="task-head">
                    <div>
                      <div className="task-name-wrap">
                        <span className="task-badge">#{String(task.id).slice(-4)}</span>
                        <h2 className="task-name">{task.title}</h2>
                      </div>

                      {task.description && (
                        <p className="task-note">{task.description}</p>
                      )}

                      <div className="task-tags">
                        <span className="tag-deadline">
                          Дедлайн: {task.deadline.replace('T', ' ')}
                        </span>
                        <span>Напомнить за: {task.remindBefore} мин</span>
                        <span className="tag-user">{task.tgUser}</span>
                      </div>
                    </div>

                    <div className="task-controls">
                      <button
                        type="button"
                        className={`btn-act ${task.done ? 'is-done' : ''}`}
                        onClick={() => toggleDone(task.id)}
                      >
                        {task.done ? 'Готово' : 'Завершить'}
                      </button>
                      <button
                        type="button"
                        className="btn-act del"
                        onClick={() => removeTask(task.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>

                  <div className="payload-box">
                    <button
                      type="button"
                      className="payload-btn"
                      onClick={() => toggleJson(task.id)}
                    >
                      {expandedJson[task.id]
                        ? 'Скрыть JSON для бота'
                        : 'Показать JSON для бота'}
                    </button>

                    {expandedJson[task.id] && (
                      <pre className="payload-code">{buildBotPayload(task)}</pre>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="panel empty">В этом фильтре задач пока нет.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}