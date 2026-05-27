import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Home, ListChecks, CalendarDays, Flame, BarChart3, Timer,
  Search, Bell, Plus, Check, Trash2, Play, Pause, RotateCcw,
  Dumbbell, Briefcase, Brain, Target, Droplet,
  BookOpen, Wind, Smartphone, ChevronLeft, ChevronRight, Zap, Leaf, Pencil
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar as ReBar,
  XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
 
/* ----------------------------- config ----------------------------- */
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const todayIdx = (new Date().getDay() + 6) % 7; // lunes = 0
const monthDay = new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long" });
 
const CATS = {
  fisico:     { label: "Físico",     Icon: Dumbbell,  color: "#34d399" },
  negocios:   { label: "Negocios",   Icon: Briefcase, color: "#2dd4bf" },
  estudio:    { label: "Estudio IA", Icon: Brain,     color: "#5eead4" },
  disciplina: { label: "Disciplina", Icon: Target,    color: "#86efac" },
};
 
/* mapa de íconos para hábitos: se guarda la CLAVE (texto), no la función */
const HABIT_ICONS = {
  book: BookOpen, wind: Wind, phone: Smartphone, water: Droplet,
  gym: Dumbbell, leaf: Leaf, target: Target, brain: Brain,
};
const habitIcon = (key) => HABIT_ICONS[key] || Leaf;
 
const SEED_TASKS = [
  { id: 1, title: "Deep Work GenMove",     time: "08:00", day: todayIdx,        cat: "negocios",   done: false },
  { id: 2, title: "Gym — Pierna",          time: "10:00", day: todayIdx,        cat: "fisico",     done: true  },
  { id: 3, title: "Estudio IA / prompting",time: "12:00", day: todayIdx,        cat: "estudio",    done: false },
  { id: 4, title: "Seguimiento clientes",  time: "16:00", day: todayIdx,        cat: "negocios",   done: false },
  { id: 5, title: "Lectura 30 min",        time: "21:00", day: todayIdx,        cat: "disciplina", done: false },
  { id: 6, title: "Propuesta lab + log",   time: "09:00", day: (todayIdx+1)%7,  cat: "negocios",   done: false },
  { id: 7, title: "Cardio + movilidad",    time: "07:00", day: (todayIdx+1)%7,  cat: "fisico",     done: false },
  { id: 8, title: "Repaso métricas semana",time: "18:00", day: (todayIdx+2)%7,  cat: "disciplina", done: false },
];
 
const SEED_HABITS = [
  { id: 1, name: "Leer",       iconKey: "book",  streak: 12, week: [1,1,1,0,1,1,0] },
  { id: 2, name: "Meditación", iconKey: "wind",  streak: 8,  week: [1,1,0,1,1,0,0] },
  { id: 3, name: "Sin redes",  iconKey: "phone", streak: 5,  week: [1,0,1,1,1,0,0] },
  { id: 4, name: "Agua 3L",    iconKey: "water", streak: 21, week: [1,1,1,1,1,1,0] },
  { id: 5, name: "Gym",        iconKey: "gym",   streak: 9,  week: [1,1,0,1,1,1,0] },
];
 
const SEED_FOCUS = [40, 75, 50, 90, 60, 30, 0]; // min por día (lun..dom)
 
/* lectura segura de localStorage (si está corrupto, usa el seed) */
const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
 
/* ----------------------------- root ----------------------------- */
export default function TempleOS() {
  const [tab, setTab] = useState("inicio");
  const [tasks, setTasks]   = useState(() => load("temple_tasks_v2", SEED_TASKS));
  const [habits, setHabits] = useState(() => load("temple_habits_v2", SEED_HABITS));
  const [focus, setFocus]   = useState(() => load("temple_focus_v2", SEED_FOCUS));
 
  useEffect(() => { localStorage.setItem("temple_tasks_v2", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem("temple_habits_v2", JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem("temple_focus_v2", JSON.stringify(focus)); }, [focus]);
 
  /* derivados ------------------------------------------------------ */
  const todayTasks = tasks.filter(t => t.day === todayIdx);
  const doneToday = todayTasks.filter(t => t.done).length;
  const pctToday = todayTasks.length ? Math.round((doneToday / todayTasks.length) * 100) : 0;
 
  const goals = useMemo(() => {
    const byCat = (c) => {
      const arr = tasks.filter(t => t.cat === c);
      return arr.length ? Math.round((arr.filter(t => t.done).length / arr.length) * 100) : 0;
    };
    const habitsToday = habits.filter(h => h.week[todayIdx]).length;
    const disc = Math.round(0.5 * byCat("disciplina") + 0.5 * (habits.length ? habitsToday / habits.length * 100 : 0));
    return { fisico: byCat("fisico"), negocios: byCat("negocios"), estudio: byCat("estudio"), disciplina: disc };
  }, [tasks, habits]);
 
  const focusToday = focus[todayIdx];
  const totalStreak = habits.length ? Math.max(...habits.map(h => h.streak)) : 0;
 
  /* acciones ------------------------------------------------------- */
  const toggleTask = (id) => setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const delTask = (id) => setTasks(p => p.filter(t => t.id !== id));
  const addTask = (t) => setTasks(p => [...p, { ...t, id: Date.now(), done: false }]);
  const editTask = (id, title) => setTasks(p => p.map(t => t.id === id ? { ...t, title } : t));
  const toggleHabit = (id) => setHabits(p => p.map(h => {
    if (h.id !== id) return h;
    const w = [...h.week]; const was = w[todayIdx]; w[todayIdx] = was ? 0 : 1;
    return { ...h, week: w, streak: Math.max(0, h.streak + (was ? -1 : 1)) };
  }));
  const addHabit = (name) => setHabits(p => [...p, { id: Date.now(), name, iconKey: "leaf", streak: 0, week: [0,0,0,0,0,0,0] }]);
  const delHabit = (id) => setHabits(p => p.filter(h => h.id !== id));
  const addFocus = (min) => setFocus(p => p.map((v, i) => i === todayIdx ? v + min : v));
 
  const NAV = [
    { id: "inicio",  label: "Inicio",       Icon: Home },
    { id: "tareas",  label: "Tareas",       Icon: ListChecks },
    { id: "agenda",  label: "Calendario",   Icon: CalendarDays },
    { id: "habitos", label: "Hábitos",      Icon: Flame },
    { id: "stats",   label: "Estadísticas", Icon: BarChart3 },
    { id: "enfoque", label: "Enfoque",      Icon: Timer },
  ];
 
  const shared = { tasks, habits, focus, goals, todayTasks, doneToday, pctToday,
focusToday, totalStreak, toggleTask, delTask, addTask, editTask, toggleHabit, addHabit, delHabit, addFocus, setTab }; 
  return (
    <div className="tos">
      <Style />
      <div className="bg-glow a" />
      <div className="bg-glow b" />
 
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="logo">☯</div>
            <div>
              <p className="eyebrow">Temple OS</p>
              <h1 className="brand-name">Modo Monje</h1>
            </div>
          </div>
          <div className="searchwrap">
            <Search size={17} className="dim" />
            <input placeholder="Buscar enfoque, tareas o ideas…" />
          </div>
          <div className="topright">
            <div className="streak-pill"><Flame size={15} /> {totalStreak}</div>
            <button className="iconbtn"><Bell size={18} /></button>
            <div className="avatar">M</div>
          </div>
        </header>
 
        <div className="body">
          <nav className="sidebar">
            {NAV.map(({ id, label, Icon }) => (
              <button key={id} className={`navbtn ${tab === id ? "on" : ""}`} onClick={() => setTab(id)} title={label}>
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
 
          <main className="content" key={tab}>
            {tab === "inicio"  && <Inicio  {...shared} />}
            {tab === "tareas"  && <Tareas  {...shared} />}
            {tab === "agenda"  && <Agenda  {...shared} />}
            {tab === "habitos" && <Habitos {...shared} />}
            {tab === "stats"   && <Stats   {...shared} />}
            {tab === "enfoque" && <Enfoque {...shared} />}
          </main>
        </div>
      </div>
    </div>
  );
}
 
/* ----------------------------- INICIO ----------------------------- */
function Inicio({ todayTasks, doneToday, pctToday, goals, focusToday, totalStreak, habits, toggleTask, setTab }) {
  const habitsToday = habits.filter(h => h.week[todayIdx]).length;
  const resumen = [
    { ok: true,  txt: `${doneToday} de ${todayTasks.length} tareas completadas hoy.` },
    { ok: true,  txt: `${habitsToday}/${habits.length} hábitos sostenidos.` },
    { ok: focusToday > 0, txt: `${focusToday} min de enfoque profundo.` },
    { ok: pctToday >= 60, txt: pctToday >= 60 ? "Vas a buen ritmo, seguí así." : "Falta cierre: priorizá lo de negocio." },
  ];
  return (
    <div className="stack">
      <div className="pagehead">
        <div>
          <p className="eyebrow">Bienvenido de vuelta</p>
          <h2 className="h2">Maverick · {monthDay}</h2>
        </div>
        <div className="day-ring">
          <Ring pct={pctToday} size={70} />
          <div><p className="big">{pctToday}%</p><p className="dim sm">del día</p></div>
        </div>
      </div>
 
      <Card title="Agenda de hoy" right={<button className="ghostbtn" onClick={() => setTab("agenda")}>Ver semana</button>}>
        <div className="task-grid">
          {todayTasks.length === 0 && <p className="dim">Sin tareas para hoy. Cargá una en la pestaña Tareas.</p>}
          {todayTasks.map(t => {
            const c = CATS[t.cat];
            return (
              <button key={t.id} className={`task-card ${t.done ? "done" : ""}`} onClick={() => toggleTask(t.id)} style={{ "--c": c.color }}>
                <div className="tc-top">
                  <span className="tc-time">{t.time}</span>
                  <c.Icon size={16} style={{ color: c.color }} />
                </div>
                <h4>{t.title}</h4>
                <div className="check">{t.done && <Check size={14} />}</div>
              </button>
            );
          })}
        </div>
      </Card>
 
      <div className="two-col">
        <Card title="Objetivos">
          <div className="goals">
            {Object.entries(goals).map(([k, v]) => (
              <div key={k} className="goalrow">
                <div className="goalhead"><span>{CATS[k].label}</span><span>{v}%</span></div>
                <Bar pct={v} color={CATS[k].color} />
              </div>
            ))}
          </div>
        </Card>
 
        <Card title="Resumen del día" accent>
          <div className="resumen">
            {resumen.map((r, i) => (
              <p key={i} className={r.ok ? "" : "warn"}>{r.ok ? "✔" : "⚠"} {r.txt}</p>
            ))}
          </div>
          <div className="mini-stats">
            <div><p className="big">{totalStreak}</p><p className="dim sm">racha máx</p></div>
            <div><p className="big">{focusToday}′</p><p className="dim sm">enfoque hoy</p></div>
          </div>
        </Card>
      </div>
 
      <Card glass>
        <div className="cta-row">
          <div>
            <p className="eyebrow">Estado mental</p>
            <h3 className="h3">Calma + Enfoque</h3>
            <div className="chips">{["Disciplina", "Estrategia", "Consistencia"].map(c => <span key={c} className="chip">{c}</span>)}</div>
          </div>
          <button className="primary" onClick={() => setTab("enfoque")}><Zap size={18} /> Entrar en Modo Enfoque</button>
        </div>
      </Card>
    </div>
  );
}
 
/* ----------------------------- TAREAS ----------------------------- */
function Tareas({ tasks, toggleTask, delTask, addTask, editTask }) {
  const [filter, setFilter] = useState("todas");
  const [form, setForm] = useState({ title: "", time: "08:00", day: todayIdx, cat: "negocios" });
  const list = tasks.filter(t => filter === "todas" ? true : t.cat === filter);
  const submit = () => { if (!form.title.trim()) return; addTask(form); setForm({ ...form, title: "" }); };
 
  return (
    <div className="stack">
      <div className="pagehead"><h2 className="h2">Tareas</h2>
        <span className="dim">{tasks.filter(t => t.done).length}/{tasks.length} hechas</span>
      </div>
 
      <Card title="Cargar tarea">
        <div className="addbar">
          <input className="inp grow" placeholder="¿Qué hay que hacer?" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            onKeyDown={e => e.key === "Enter" && submit()} />
          <input className="inp" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
          <select className="inp" value={form.day} onChange={e => setForm({ ...form, day: +e.target.value })}>
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <select className="inp" value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>
            {Object.entries(CATS).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
          </select>
          <button type="button" className="primary sm" onClick={submit}><Plus size={16} /> Agregar</button>
        </div>
      </Card>
 
      <div className="filters">
        <button className={`fchip ${filter === "todas" ? "on" : ""}`} onClick={() => setFilter("todas")}>Todas</button>
        {Object.entries(CATS).map(([k, c]) => (
          <button key={k} className={`fchip ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)} style={{ "--c": c.color }}>{c.label}</button>
        ))}
      </div>
 
      <Card>
        <div className="tasklist">
          {list.length === 0 && <p className="dim">No hay tareas en este filtro.</p>}
          {list.slice().sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)).map(t => {
            const c = CATS[t.cat];
            return (
              <div key={t.id} className={`taskrow ${t.done ? "done" : ""}`} style={{ "--c": c.color }}>
                <button type="button" className="rowedit" onClick={() => {
                  const nuevo = prompt("Editar tarea", t.title);
                  if (nuevo && nuevo.trim()) editTask(t.id, nuevo.trim());
                }}><Pencil size={14} /></button>
                <button type="button" className="rowcheck" onClick={() => toggleTask(t.id)}>{t.done && <Check size={14} />}</button>
                <div className="rowmain">
                  <span className="rowtitle">{t.title}</span>
                  <span className="rowmeta"><c.Icon size={12} style={{ color: c.color }} /> {c.label} · {DAYS[t.day]} {t.time}</span>
                </div>
                <button type="button" className="rowdel" onClick={() => delTask(t.id)}><Trash2 size={15} /></button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
 
/* ----------------------------- AGENDA ----------------------------- */
function Agenda({ tasks, toggleTask }) {
  const [weekOff, setWeekOff] = useState(0);
  const [dayView, setDayView] = useState(todayIdx);
  const HOURS = ["07:00","08:00","09:00","10:00","12:00","16:00","18:00","21:00"];

  const dayTasks = tasks
    .filter(t => t.day === dayView)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="stack">
      <div className="pagehead">
        <h2 className="h2">Calendario</h2>
        <div className="weeknav">
          <button type="button" className="iconbtn" onClick={() => setWeekOff(w => w - 1)}><ChevronLeft size={18} /></button>
          <span>{weekOff === 0 ? "Esta semana" : weekOff > 0 ? `+${weekOff} sem` : `${weekOff} sem`}</span>
          <button type="button" className="iconbtn" onClick={() => setWeekOff(w => w + 1)}><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="cal-desktop">
        <Card>
          <div className="cal">
            <div className="cal-head">
              <div className="cal-corner" />
              {DAYS.map((d, i) => (
                <div key={i} className={`cal-day ${i === todayIdx && weekOff === 0 ? "today" : ""}`}>{d}</div>
              ))}
            </div>
            <div className="cal-body">
              {HOURS.map(h => (
                <div key={h} className="cal-row">
                  <div className="cal-time">{h}</div>
                  {DAYS.map((_, di) => {
                    const cell = tasks.filter(t => t.day === di && t.time === h);
                    return (
                      <div key={di} className="cal-cell">
                        {cell.map(t => {
                          const c = CATS[t.cat];
                          return (
                            <button key={t.id} type="button" className={`cal-ev ${t.done ? "done" : ""}`} style={{ "--c": c.color }} onClick={() => toggleTask(t.id)}>
                              {t.title}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="cal-mobile">
        <Card>
          <div className="dayswitch">
            <button type="button" className="iconbtn" onClick={() => setDayView(d => (d + 6) % 7)}><ChevronLeft size={18} /></button>
            <div className="dayswitch-label">
              <p className="big">{DAYS[dayView]}</p>
              {dayView === todayIdx && <span className="today-pill">Hoy</span>}
            </div>
            <button type="button" className="iconbtn" onClick={() => setDayView(d => (d + 1) % 7)}><ChevronRight size={18} /></button>
          </div>
          <div className="daylist">
            {dayTasks.length === 0 && <p className="dim center" style={{padding:"20px 0"}}>Sin tareas este día.</p>}
            {dayTasks.map(t => {
              const c = CATS[t.cat];
              return (
                <button key={t.id} type="button" className={`dayrow ${t.done ? "done" : ""}`} style={{ "--c": c.color }} onClick={() => toggleTask(t.id)}>
                  <span className="dayrow-time">{t.time}</span>
                  <div className="dayrow-main">
                    <span className="dayrow-title">{t.title}</span>
                    <span className="rowmeta"><c.Icon size={12} style={{ color: c.color }} /> {c.label}</span>
                  </div>
                  <span className="dayrow-check">{t.done && <Check size={15} />}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
 
/* ----------------------------- HÁBITOS ----------------------------- */
function Habitos({ habits, toggleHabit, addHabit, delHabit }) {
  const [name, setName] = useState("");
  const consistency = habits.length
    ? Math.round(habits.reduce((s, h) => s + h.week.filter(Boolean).length, 0) / (habits.length * 7) * 100)
    : 0;
  const crear = () => { if (name.trim()) { addHabit(name.trim()); setName(""); } };
  return (
    <div className="stack">
      <div className="pagehead"><h2 className="h2">Hábitos</h2>
        <div className="day-ring"><Ring pct={consistency} size={54} /><div><p className="big">{consistency}%</p><p className="dim sm">consistencia</p></div></div>
      </div>
 
      <Card title="Nuevo hábito">
        <div className="addbar">
          <input className="inp grow" placeholder="Ej: Frío, journaling, sin azúcar…" value={name}
            onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && crear()} />
          <button type="button" className="primary sm" onClick={crear}><Plus size={16} /> Crear</button>
        </div>
      </Card>
 
      <Card>
        <div className="hablist">
          {habits.length === 0 && <p className="dim">No hay hábitos. Creá uno arriba.</p>}
          {habits.map(h => {
            const HIcon = habitIcon(h.iconKey);
            return (
              <div key={h.id} className="habrow">
                <div className="hableft">
                  <div className="habicon"><HIcon size={18} /></div>
                  <div><p className="habname">{h.name}</p><p className="dim sm"><Flame size={11} /> {h.streak} días</p></div>
                </div>
                <div className="habweek">
                  {h.week.map((d, i) => (
                    <span key={i} className={`dot ${d ? "fill" : ""} ${i === todayIdx ? "today" : ""}`}>{DAYS[i][0]}</span>
                  ))}
                </div>
                <button type="button" className={`habtoggle ${h.week[todayIdx] ? "on" : ""}`} onClick={() => toggleHabit(h.id)}>
                  {h.week[todayIdx] ? <Check size={16} /> : <Plus size={16} />}
                </button>
                <button type="button" className="rowdel" onClick={() => { if (confirm(`¿Eliminar el hábito "${h.name}"?`)) delHabit(h.id); }}><Trash2 size={15} /></button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
 
/* ----------------------------- STATS ----------------------------- */
function Stats({ focus, tasks, goals, totalStreak }) {
  const data = DAYS.map((d, i) => ({
    d, enfoque: focus[i],
    tareas: tasks.filter(t => t.day === i && t.done).length,
  }));
  const focusTotal = focus.reduce((a, b) => a + b, 0);
  const tasksDone = tasks.filter(t => t.done).length;
  const avgGoal = Math.round(Object.values(goals).reduce((a, b) => a + b, 0) / 4);
 
  return (
    <div className="stack">
      <h2 className="h2">Estadísticas</h2>
 
      <div className="kpis">
        <KPI label="Enfoque semanal" value={`${Math.round(focusTotal/60*10)/10}h`} sub={`${focusTotal} min`} />
        <KPI label="Tareas hechas" value={tasksDone} sub={`de ${tasks.length}`} />
        <KPI label="Racha máxima" value={totalStreak} sub="días" />
        <KPI label="Progreso global" value={`${avgGoal}%`} sub="objetivos" />
      </div>
 
      <Card title="Enfoque por día (min)">
        <div className="chart">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="d" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#06231a", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 12, color: "#fff" }} />
              <Area type="monotone" dataKey="enfoque" stroke="#34d399" strokeWidth={2.5} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
 
      <div className="two-col">
        <Card title="Tareas completadas por día">
          <div className="chart">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="d" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(52,211,153,0.08)" }} contentStyle={{ background: "#06231a", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 12, color: "#fff" }} />
                <ReBar dataKey="tareas" fill="#2dd4bf" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
 
        <Card title="Balance por área">
          <div className="goals">
            {Object.entries(goals).map(([k, v]) => (
              <div key={k} className="goalrow">
                <div className="goalhead"><span>{CATS[k].label}</span><span>{v}%</span></div>
                <Bar pct={v} color={CATS[k].color} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
 
/* ----------------------------- ENFOQUE ----------------------------- */
function Enfoque({ addFocus, focusToday }) {
  const MODES = [
    { id: "deep", label: "Deep Work", min: 50 },
    { id: "pomo", label: "Pomodoro", min: 25 },
    { id: "break", label: "Descanso", min: 5 },
  ];
  const [mode, setMode] = useState(MODES[0]);
  const [secs, setSecs] = useState(MODES[0].min * 60);
  const [run, setRun] = useState(false);
  const [sessions, setSessions] = useState(0);
  const ref = useRef(null);
 
  useEffect(() => {
    if (run) {
      ref.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            clearInterval(ref.current); setRun(false);
            if (mode.id !== "break") { addFocus(mode.min); setSessions(n => n + 1); }
            return mode.min * 60;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(ref.current);
  }, [run, mode]);
 
  const pick = (m) => { setMode(m); setSecs(m.min * 60); setRun(false); };
  const reset = () => { setRun(false); setSecs(mode.min * 60); };
  const total = mode.min * 60;
  const pct = ((total - secs) / total) * 100;
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
 
  return (
    <div className="stack">
      <h2 className="h2">Modo Enfoque</h2>
      <div className="focuswrap">
        <div className="modeswitch">
          {MODES.map(m => (
            <button key={m.id} type="button" className={`mbtn ${mode.id === m.id ? "on" : ""}`} onClick={() => pick(m)}>{m.label}<span>{m.min}′</span></button>
          ))}
        </div>
 
        <div className={`timer ${run ? "live" : ""}`}>
          <svg viewBox="0 0 220 220" className="timer-svg">
            <circle cx="110" cy="110" r="96" className="t-bg" />
            <circle cx="110" cy="110" r="96" className="t-fg"
              strokeDasharray={2 * Math.PI * 96}
              strokeDashoffset={2 * Math.PI * 96 * (1 - pct / 100)} />
          </svg>
          <div className="timer-inner">
            <p className="timer-time">{mm}:{ss}</p>
            <p className="dim">{mode.label}</p>
          </div>
        </div>
 
        <div className="timer-ctrl">
          <button type="button" className="iconbtn lg" onClick={reset}><RotateCcw size={20} /></button>
          <button type="button" className="primary lg" onClick={() => setRun(r => !r)}>
            {run ? <><Pause size={20} /> Pausar</> : <><Play size={20} /> Empezar</>}
          </button>
          <div className="sessioncount"><p className="big">{sessions}</p><p className="dim sm">sesiones</p></div>
        </div>
 
        <p className="dim center">Enfoque acumulado hoy: <b style={{ color: "#34d399" }}>{focusToday} min</b></p>
      </div>
    </div>
  );
}
 
/* ----------------------------- helpers UI ----------------------------- */
function Card({ title, right, accent, glass, children }) {
  return (
    <section className={`card ${accent ? "accent" : ""} ${glass ? "glasscard" : ""}`}>
      {(title || right) && <div className="cardhead">{title && <h3 className="cardtitle">{title}</h3>}{right}</div>}
      {children}
    </section>
  );
}
function Bar({ pct, color }) {
  return <div className="track"><div className="fill" style={{ width: `${pct}%`, background: color }} /></div>;
}
function Ring({ pct, size = 64 }) {
  const r = size / 2 - 5, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="ring">
      <circle cx={size/2} cy={size/2} r={r} className="r-bg" />
      <circle cx={size/2} cy={size/2} r={r} className="r-fg" strokeDasharray={c} strokeDashoffset={c * (1 - pct/100)} />
    </svg>
  );
}
function KPI({ label, value, sub }) {
  return <div className="kpi"><p className="dim sm">{label}</p><p className="kpival">{value}</p><p className="dim sm">{sub}</p></div>;
}
 
/* ----------------------------- styles ----------------------------- */
function Style() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body,#root{width:100%;min-height:100%}
body{background:#03130d}
::-webkit-scrollbar{width:8px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(52,211,153,.22);border-radius:20px}
::-webkit-scrollbar-thumb:hover{background:rgba(52,211,153,.4)}
 
.tos{
  --bg:#03130d;--panel:rgba(255,255,255,.045);--line:rgba(255,255,255,.09);
  --em:#34d399;--em2:#2dd4bf;--txt:#eafff6;--dim:rgba(234,255,246,.45);
  font-family:'Manrope',system-ui,sans-serif;color:var(--txt);min-height:100vh;
  background:var(--bg);position:relative;overflow-x:hidden;padding:18px;
}
.bg-glow{position:fixed;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0}
.bg-glow.a{top:-160px;left:30%;width:560px;height:560px;background:radial-gradient(circle,rgba(0,255,170,.22),transparent 70%);animation:breathe 7s ease-in-out infinite}
.bg-glow.b{bottom:-200px;right:-80px;width:480px;height:480px;background:radial-gradient(circle,rgba(0,255,170,.10),transparent 70%);animation:breathe 9s ease-in-out infinite}
@keyframes breathe{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.1);opacity:1}}
 
.shell{position:relative;z-index:1;max-width:1320px;margin:0 auto;border:1px solid var(--line);
  border-radius:34px;background:rgba(255,255,255,.04);backdrop-filter:blur(26px);overflow:hidden;
  box-shadow:0 40px 120px -40px rgba(0,0,0,.8)}
h1,h2,h3,h4{font-family:'Sora',sans-serif;font-weight:700;letter-spacing:-.02em}
.dim{color:var(--dim)}.sm{font-size:12px}.center{text-align:center}
.eyebrow{color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:.32em;margin-bottom:4px}
.h2{font-size:28px}.h3{font-size:22px}
 
.topbar{display:flex;align-items:center;gap:18px;padding:18px 26px;border-bottom:1px solid var(--line)}
.brand{display:flex;align-items:center;gap:13px;min-width:170px}
.logo{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;font-size:22px;
  background:linear-gradient(135deg,rgba(52,211,153,.3),rgba(45,212,191,.08));border:1px solid rgba(52,211,153,.25)}
.brand-name{font-size:19px}
.searchwrap{flex:1;display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.05);
  border:1px solid var(--line);border-radius:16px;padding:11px 18px;max-width:440px}
.searchwrap input{background:none;border:none;outline:none;color:var(--txt);width:100%;font-size:14px;font-family:inherit}
.searchwrap input::placeholder{color:var(--dim)}
.topright{display:flex;align-items:center;gap:12px;margin-left:auto}
.streak-pill{display:flex;align-items:center;gap:6px;background:rgba(52,211,153,.14);color:var(--em);
  border:1px solid rgba(52,211,153,.25);padding:8px 13px;border-radius:13px;font-weight:700;font-size:14px}
.avatar{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#34d399,#2dd4bf);
  display:grid;place-items:center;color:#032018;font-weight:800}
 
.body{display:flex;min-height:calc(100vh - 90px)}
.sidebar{width:96px;border-right:1px solid var(--line);padding:20px 12px;display:flex;flex-direction:column;gap:10px}
.navbtn{border:1px solid transparent;background:none;color:var(--dim);padding:14px 10px;border-radius:18px;
  cursor:pointer;transition:.2s;display:flex;flex-direction:column;align-items:center;gap:7px;font-size:12px;font-family:inherit}
.navbtn:hover{background:rgba(255,255,255,.04);color:white}
.navbtn.on{background:linear-gradient(135deg,rgba(52,211,153,.18),rgba(45,212,191,.08));color:white;border:1px solid rgba(52,211,153,.18)}
.content{flex:1;padding:26px;min-width:0;animation:fade .35s ease}
@keyframes fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.stack{display:flex;flex-direction:column;gap:22px}
.pagehead{display:flex;justify-content:space-between;align-items:center;gap:20px}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:22px}
 
.card{background:var(--panel);border:1px solid var(--line);border-radius:24px;padding:22px;backdrop-filter:blur(18px)}
.cardhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.cardtitle{font-size:18px}
.glasscard{background:linear-gradient(135deg,rgba(52,211,153,.08),rgba(255,255,255,.03))}
.accent{border-color:rgba(52,211,153,.2)}
 
.day-ring{display:flex;align-items:center;gap:12px}
.big{font-family:'Sora';font-size:24px;font-weight:700;line-height:1}
.ring{transform:rotate(-90deg)}
.ring .r-bg{fill:none;stroke:rgba(255,255,255,.1);stroke-width:8}
.ring .r-fg{fill:none;stroke:var(--em);stroke-width:8;stroke-linecap:round;transition:stroke-dashoffset .6s ease}
 
.task-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}
.task-card{position:relative;padding:18px;border-radius:20px;border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.03);cursor:pointer;transition:.25s;text-align:left;color:white;font-family:inherit;
  min-height:140px;display:flex;flex-direction:column;justify-content:space-between}
.task-card:hover{transform:translateY(-4px);border-color:var(--c)}
.task-card.done{opacity:.6}.task-card.done h4{text-decoration:line-through}
.tc-top{display:flex;justify-content:space-between}
.tc-time{font-size:13px;color:var(--dim)}.task-card h4{font-size:16px;margin:8px 0}
.check{position:absolute;bottom:16px;right:16px;color:#34d399}
 
.goals{display:flex;flex-direction:column;gap:16px}
.goalhead{display:flex;justify-content:space-between;font-size:13px;color:var(--dim);margin-bottom:7px}
.track{width:100%;height:10px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden}
.fill{height:100%;border-radius:999px;transition:width .6s ease}
.resumen{display:flex;flex-direction:column;gap:9px;line-height:1.4;font-size:14px}
.resumen .warn{color:#fbbf24}
.mini-stats{display:flex;gap:30px;margin-top:18px;padding-top:16px;border-top:1px solid var(--line)}
.cta-row{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
.chips{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.chip{padding:7px 13px;border-radius:11px;background:rgba(0,0,0,.25);border:1px solid var(--line);font-size:13px}
 
.filters{display:flex;gap:9px;flex-wrap:wrap}
.fchip{padding:9px 16px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid var(--line);
  color:var(--dim);cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;transition:.18s}
.fchip:hover{color:var(--txt)}
.fchip.on{background:rgba(52,211,153,.16);color:var(--em);border-color:rgba(52,211,153,.35)}
 
.cal{overflow:auto}
.cal-mobile{display:none}
.dayswitch{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.dayswitch-label{text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px}
.today-pill{font-size:11px;color:#34d399;background:rgba(52,211,153,.14);border:1px solid rgba(52,211,153,.25);padding:2px 10px;border-radius:10px}
.daylist{display:flex;flex-direction:column;gap:10px}
.dayrow{display:flex;align-items:center;gap:14px;padding:15px;border-radius:16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-left:3px solid var(--c);cursor:pointer;text-align:left;color:#eafff6;font-family:inherit;width:100%}
.dayrow.done{opacity:.55}.dayrow.done .dayrow-title{text-decoration:line-through}
.dayrow-time{font-size:14px;font-weight:700;color:var(--c);min-width:48px}
.dayrow-main{flex:1;display:flex;flex-direction:column;gap:3px;min-width:0}
.dayrow-title{font-size:15px;font-weight:700}
.dayrow-check{color:#34d399;flex-shrink:0}
.cal-head,.cal-row{display:grid;grid-template-columns:90px repeat(7,1fr)}
.cal-day,.cal-time,.cal-cell{border:1px solid rgba(255,255,255,.05)}
.cal-day{padding:14px;text-align:center;font-weight:700;background:rgba(255,255,255,.03)}
.cal-day.today{color:#34d399}
.cal-time{padding:14px;color:var(--dim);font-size:13px}
.cal-cell{min-height:84px;padding:8px}
.cal-ev{width:100%;border:none;padding:10px;border-radius:12px;background:rgba(52,211,153,.15);color:white;
  cursor:pointer;margin-bottom:6px;border-left:4px solid var(--c);text-align:left;font-family:inherit}
.cal-ev.done{opacity:.5;text-decoration:line-through}
.weeknav{display:flex;align-items:center;gap:12px;font-size:14px;color:var(--dim)}
 
.tasklist{display:flex;flex-direction:column;gap:14px}
.taskrow{display:flex;align-items:center;gap:16px;padding:18px;border-radius:20px;background:rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.06);border-left:3px solid var(--c);transition:.25s}
.taskrow:hover{transform:translateY(-2px);border-color:rgba(52,211,153,.25);background:rgba(255,255,255,.05)}
.taskrow.done{opacity:.6}.taskrow.done .rowtitle{text-decoration:line-through}
.rowcheck{width:36px;height:36px;border-radius:12px;border:1.5px solid var(--c);cursor:pointer;display:grid;
  place-items:center;background:rgba(52,211,153,.12);color:#34d399;flex-shrink:0}
.taskrow.done .rowcheck{background:var(--c);color:#03130d}
.rowmain{display:flex;flex-direction:column;gap:4px;flex:1;text-align:left;min-width:0}
.rowtitle{font-size:15px;font-weight:700}
.rowmeta{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dim)}
.rowedit{width:36px;height:36px;border:none;border-radius:10px;background:rgba(255,255,255,.05);color:#eafff6;
  cursor:pointer;transition:.2s;display:grid;place-items:center;flex-shrink:0}
.rowedit:hover{background:rgba(52,211,153,.15);color:#34d399}
.rowdel{width:36px;height:36px;border:none;border-radius:12px;cursor:pointer;background:rgba(255,255,255,.04);
  color:#ff7b7b;display:grid;place-items:center;flex-shrink:0}
.rowdel:hover{background:rgba(248,113,113,.15)}
 
.hablist{display:flex;flex-direction:column;gap:14px}
.habrow{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px;border-radius:20px;
  background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);transition:.25s}
.habrow:hover{border-color:rgba(52,211,153,.2);background:rgba(255,255,255,.05)}
.hableft{display:flex;align-items:center;gap:14px;min-width:0}
.habicon{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:rgba(52,211,153,.12);color:#34d399;flex-shrink:0}
.habname{font-weight:700}
.habrow .sm{display:flex;align-items:center;gap:4px;margin-top:2px}
.habweek{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}
.dot{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.05);
  color:rgba(255,255,255,.45);font-size:11px;font-weight:700}
.dot.fill{background:#34d399;color:#03130d}
.dot.today{outline:2px solid rgba(52,211,153,.6);outline-offset:1px}
.habtoggle{width:46px;height:46px;border:none;border-radius:14px;cursor:pointer;background:rgba(255,255,255,.06);
  color:white;transition:.2s;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.habtoggle.on{background:#34d399;color:#03130d}
 
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.kpi{border:1px solid var(--line);border-radius:20px;background:rgba(0,0,0,.25);padding:18px}
.kpival{font-family:'Sora';font-size:30px;font-weight:700;margin:6px 0;color:var(--em)}
.chart{width:100%}
 
.addbar{display:flex;gap:12px;flex-wrap:wrap}
.inp{height:48px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.06);
  color:#eafff6;padding:0 14px;outline:none;font-size:14px;font-family:inherit;transition:.2s;appearance:none}
.inp:focus{border-color:#34d399;box-shadow:0 0 0 4px rgba(52,211,153,.12)}
.grow{flex:1;min-width:180px}
select.inp{cursor:pointer}select.inp option{background:#06231a;color:#eafff6}
 
button{font-family:inherit}
.primary{display:flex;align-items:center;justify-content:center;gap:10px;border:none;cursor:pointer;padding:14px 20px;
  border-radius:18px;background:linear-gradient(135deg,#34d399,#10b981);color:#03130d;font-weight:800;font-family:'Sora',sans-serif;transition:.25s}
.primary:hover{transform:translateY(-2px);box-shadow:0 20px 40px rgba(52,211,153,.22)}
.primary.sm{padding:12px 16px;border-radius:14px;font-size:14px}
.primary.lg{padding:18px 26px;border-radius:22px;font-size:16px}
.ghostbtn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:var(--txt);
  padding:10px 16px;border-radius:12px;cursor:pointer;font-family:inherit;font-size:13px;transition:.2s}
.ghostbtn:hover{color:#34d399}
.iconbtn{width:44px;height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);
  color:#eafff6;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.25s}
.iconbtn:hover{background:rgba(255,255,255,.09);transform:translateY(-2px)}
.iconbtn.lg{width:58px;height:58px;border-radius:18px}
 
.focuswrap{display:flex;flex-direction:column;align-items:center;gap:30px;padding:30px}
.modeswitch{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
.mbtn{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:var(--txt);border-radius:18px;
  padding:14px 20px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:.25s;font-weight:700;font-family:inherit}
.mbtn span{color:var(--dim);font-size:13px}
.mbtn:hover{transform:translateY(-2px);background:rgba(255,255,255,.08)}
.mbtn.on{background:rgba(52,211,153,.14);border-color:rgba(52,211,153,.35);color:#34d399}
.timer{width:300px;height:300px;position:relative;display:grid;place-items:center}
.timer-svg{width:100%;height:100%;transform:rotate(-90deg)}
.t-bg{fill:none;stroke:rgba(255,255,255,.06);stroke-width:10}
.t-fg{fill:none;stroke:#34d399;stroke-width:10;stroke-linecap:round;transition:stroke-dashoffset 1s linear}
.timer.live .t-fg{filter:drop-shadow(0 0 14px rgba(52,211,153,.6))}
.timer-inner{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.timer-time{font-size:60px;font-family:'Sora',sans-serif;font-weight:800;letter-spacing:-.05em}
.timer-ctrl{display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:center}
.sessioncount{text-align:center;min-width:80px}
 
@media(max-width:980px){
  .two-col,.kpis{grid-template-columns:1fr}
  .body{flex-direction:column}
  .sidebar{width:100%;flex-direction:row;overflow:auto;border-right:none;border-bottom:1px solid var(--line)}
  .navbtn span{display:none}
  .topbar{flex-wrap:wrap}.searchwrap{display:none}
  .content{padding:18px}
  .timer{width:260px;height:260px}.timer-time{font-size:48px}
}
@media(max-width:560px){
  .kpis{grid-template-columns:1fr 1fr}
  .tos{padding:8px}
  .habrow{flex-wrap:wrap;justify-content:flex-start;gap:12px}
  .hableft{width:100%;order:1}
  .habweek{order:3;width:100%;justify-content:space-between;margin-left:0;gap:5px}
  .habtoggle{order:2;margin-left:auto}
  .habrow .rowdel{order:2}
  .dot{width:34px;height:34px;flex:1;max-width:42px}
  .habname{font-size:15px}
  .pagehead{flex-direction:column;align-items:flex-start;gap:10px}
  .h2{font-size:22px}
  .addbar{flex-direction:column}
  .addbar .inp,.addbar .grow,.addbar .primary{width:100%}
  .task-grid{grid-template-columns:1fr 1fr}
  .modeswitch{width:100%}
  .timer-time{font-size:44px}
  .cal-desktop{display:none}
  .cal-mobile{display:block}
}
`}</style>
  );
}
 