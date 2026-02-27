(() => {
  const STORAGE_KEYS = {
    BIG_ROCKS: 'vibe_big_rocks',
    TINY_TASKS: 'vibe_tiny_tasks',
  };

  const bigRockInput = document.getElementById('big-rock-input');
  const bigRockNoteInput = document.getElementById('big-rock-note-input');
  const tinyTaskInput = document.getElementById('tiny-task-input');

  const bigRocksListEl = document.getElementById('big-rocks-list');
  const bigRocksEmptyEl = document.getElementById('big-rocks-empty');
  const collapseAllBtn = document.getElementById('collapse-all-big-rocks');

  const tinyTasksListEl = document.getElementById('tiny-tasks-list');
  const tinyEmptyEl = document.getElementById('tiny-empty');
  const clearCompletedTinyBtn = document.getElementById('clear-completed-tiny');

  let bigRocks = loadFromStorage(STORAGE_KEYS.BIG_ROCKS, []);
  let tinyTasks = loadFromStorage(STORAGE_KEYS.TINY_TASKS, []);

  function loadFromStorage(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return fallback;
      return parsed;
    } catch {
      return fallback;
    }
  }

  function saveToStorage(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }

  function generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function render() {
    renderBigRocks();
    renderTinyTasks();
  }

  function renderBigRocks() {
    bigRocksListEl.innerHTML = '';

    if (!bigRocks.length) {
      bigRocksEmptyEl.classList.remove('hidden');
    } else {
      bigRocksEmptyEl.classList.add('hidden');
    }

    bigRocks.forEach((rock) => {
      const total = rock.subtasks?.length || 0;
      const completed = rock.subtasks?.filter((s) => s.done).length || 0;
      const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

      const container = document.createElement('article');
      container.className =
        'group rounded-2xl border border-slate-800/90 bg-slate-900/70 px-4 py-3.5 hover:border-slate-500/70 transition-colors';

      const header = document.createElement('div');
      header.className = 'flex items-start justify-between gap-3';

      const titleWrap = document.createElement('button');
      titleWrap.type = 'button';
      titleWrap.className =
        'flex-1 text-left flex flex-col gap-1 focus:outline-none';
      titleWrap.addEventListener('click', () => toggleRockCollapsed(rock.id));

      const titleRow = document.createElement('div');
      titleRow.className = 'flex items-center gap-2';

      const caret = document.createElement('span');
      caret.className =
        'inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-700/80 text-[10px] text-slate-400 transition-transform';
      caret.textContent = rock.collapsed ? '›' : '⌄';

      const title = document.createElement('div');
      title.className = 'text-sm font-medium text-slate-50 line-clamp-1';
      title.textContent = rock.title;

      titleRow.appendChild(caret);
      titleRow.appendChild(title);

      titleWrap.appendChild(titleRow);

      if (rock.note && rock.note.trim()) {
        const note = document.createElement('p');
        note.className = 'text-xs text-slate-400 line-clamp-2';
        note.textContent = rock.note;
        titleWrap.appendChild(note);
      }

      header.appendChild(titleWrap);

      const actions = document.createElement('div');
      actions.className =
        'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className =
        'rounded-full px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800/90';
      editBtn.textContent = '编辑';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        promptEditRock(rock.id);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className =
        'rounded-full px-2 py-1 text-[11px] text-slate-400 hover:bg-red-500/10 hover:text-red-300';
      deleteBtn.textContent = '删除';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteRock(rock.id);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      header.appendChild(actions);

      container.appendChild(header);

      const progressWrap = document.createElement('div');
      progressWrap.className = 'mt-3 flex items-center gap-2 text-[11px]';

      const barTrack = document.createElement('div');
      barTrack.className =
        'relative flex-1 h-1.5 rounded-full bg-slate-800/90 overflow-hidden';

      const barFill = document.createElement('div');
      barFill.className =
        'absolute inset-y-0 left-0 rounded-full bg-emerald-400/90 transition-[width] duration-200 ease-out';
      barFill.style.width = `${progress}%`;

      barTrack.appendChild(barFill);

      const progressLabel = document.createElement('div');
      progressLabel.className = 'flex items-center gap-1 text-slate-400';
      progressLabel.textContent =
        total === 0 ? '等待拆解' : `${completed}/${total} · ${progress}%`;

      progressWrap.appendChild(barTrack);
      progressWrap.appendChild(progressLabel);

      container.appendChild(progressWrap);

      const body = document.createElement('div');
      body.className = rock.collapsed
        ? 'hidden'
        : 'mt-3.5 border-t border-slate-800/80 pt-3 flex flex-col gap-2.5';

      const subtasksList = document.createElement('div');
      subtasksList.className = 'flex flex-col gap-1.5';

      (rock.subtasks || []).forEach((sub) => {
        const row = document.createElement('div');
        row.className =
          'group/sub flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-800/60';

        const left = document.createElement('button');
        left.type = 'button';
        left.className = 'flex items-center gap-2 flex-1 text-left';
        left.addEventListener('click', () =>
          toggleSubtaskDone(rock.id, sub.id)
        );

        const checkbox = document.createElement('span');
        checkbox.className =
          'flex h-4.5 w-4.5 items-center justify-center rounded-md border border-slate-600/90 text-[10px] text-slate-200';
        checkbox.textContent = sub.done ? '✓' : '';
        if (sub.done) {
          checkbox.classList.add('bg-emerald-400', 'border-emerald-400', 'text-slate-950');
        }

        const text = document.createElement('span');
        text.className =
          'text-xs text-slate-200 break-words' +
          (sub.done ? ' line-through text-slate-500' : '');
        text.textContent = sub.text;

        left.appendChild(checkbox);
        left.appendChild(text);

        const subActions = document.createElement('div');
        subActions.className =
          'flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity';

        const editSubBtn = document.createElement('button');
        editSubBtn.type = 'button';
        editSubBtn.className =
          'rounded-full px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800';
        editSubBtn.textContent = '编辑';
        editSubBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          promptEditSubtask(rock.id, sub.id);
        });

        const deleteSubBtn = document.createElement('button');
        deleteSubBtn.type = 'button';
        deleteSubBtn.className =
          'rounded-full px-2 py-0.5 text-[10px] text-slate-400 hover:bg-red-500/10 hover:text-red-300';
        deleteSubBtn.textContent = '删除';
        deleteSubBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteSubtask(rock.id, sub.id);
        });

        subActions.appendChild(editSubBtn);
        subActions.appendChild(deleteSubBtn);

        row.appendChild(left);
        row.appendChild(subActions);

        subtasksList.appendChild(row);
      });

      const newSubWrap = document.createElement('div');
      newSubWrap.className =
        'mt-1 flex items-center gap-2 rounded-xl border border-dashed border-slate-800/90 px-2 py-1.5';

      const plus = document.createElement('span');
      plus.className =
        'inline-flex h-4.5 w-4.5 items-center justify-center rounded-md border border-slate-700/80 text-[10px] text-slate-400';
      plus.textContent = '+';

      const subInput = document.createElement('input');
      subInput.type = 'text';
      subInput.placeholder = '为这个方向添加一个下一步（回车添加）';
      subInput.className =
        'flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none';
      subInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const value = subInput.value.trim();
          if (!value) return;
          addSubtask(rock.id, value);
          subInput.value = '';
        }
      });

      newSubWrap.appendChild(plus);
      newSubWrap.appendChild(subInput);

      body.appendChild(subtasksList);
      body.appendChild(newSubWrap);

      container.appendChild(body);

      bigRocksListEl.appendChild(container);
    });
  }

  function renderTinyTasks() {
    tinyTasksListEl.innerHTML = '';

    if (!tinyTasks.length) {
      tinyEmptyEl.classList.remove('hidden');
    } else {
      tinyEmptyEl.classList.add('hidden');
    }

    tinyTasks.forEach((task) => {
      const row = document.createElement('div');
      row.className =
        'group flex items-center justify-between gap-2 rounded-2xl px-2.5 py-1.5 hover:bg-slate-900/80';

      const left = document.createElement('button');
      left.type = 'button';
      left.className = 'flex items-center gap-2 flex-1 text-left';
      left.addEventListener('click', () => toggleTinyDone(task.id));

      const checkbox = document.createElement('span');
      checkbox.className =
        'flex h-4.5 w-4.5 items-center justify-center rounded-md border border-slate-600/90 text-[10px] text-slate-200';
      checkbox.textContent = task.done ? '✓' : '';
      if (task.done) {
        checkbox.classList.add('bg-emerald-400', 'border-emerald-400', 'text-slate-950');
      }

      const text = document.createElement('span');
      text.className =
        'text-xs text-slate-200 break-words' +
        (task.done ? ' line-through text-slate-500' : '');
      text.textContent = task.text;

      left.appendChild(checkbox);
      left.appendChild(text);

      const actions = document.createElement('div');
      actions.className =
        'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className =
        'rounded-full px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800';
      editBtn.textContent = '编辑';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        promptEditTiny(task.id);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className =
        'rounded-full px-2 py-0.5 text-[10px] text-slate-400 hover:bg-red-500/10 hover:text-red-300';
      deleteBtn.textContent = '删除';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTiny(task.id);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      row.appendChild(left);
      row.appendChild(actions);

      tinyTasksListEl.appendChild(row);
    });
  }

  function addBigRock(title, note) {
    const trimmed = title.trim();
    if (!trimmed) return;
    bigRocks.unshift({
      id: generateId(),
      title: trimmed,
      note: (note || '').trim(),
      subtasks: [],
      collapsed: false,
    });
    saveToStorage(STORAGE_KEYS.BIG_ROCKS, bigRocks);
    renderBigRocks();
  }

  function deleteRock(id) {
    bigRocks = bigRocks.filter((r) => r.id !== id);
    saveToStorage(STORAGE_KEYS.BIG_ROCKS, bigRocks);
    renderBigRocks();
  }

  function toggleRockCollapsed(id) {
    bigRocks = bigRocks.map((r) =>
      r.id === id ? { ...r, collapsed: !r.collapsed } : r
    );
    saveToStorage(STORAGE_KEYS.BIG_ROCKS, bigRocks);
    renderBigRocks();
  }

  function promptEditRock(id) {
    const rock = bigRocks.find((r) => r.id === id);
    if (!rock) return;

    const newTitle = window.prompt('编辑大块任务标题：', rock.title);
    if (newTitle === null) return;
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) return;

    const newNote = window.prompt('编辑描述（可留空）：', rock.note || '');
    if (newNote === null) return;

    bigRocks = bigRocks.map((r) =>
      r.id === id
        ? {
            ...r,
            title: trimmedTitle,
            note: newNote.trim(),
          }
        : r
    );
    saveToStorage(STORAGE_KEYS.BIG_ROCKS, bigRocks);
    renderBigRocks();
  }

  function addSubtask(rockId, text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    bigRocks = bigRocks.map((r) =>
      r.id === rockId
        ? {
            ...r,
            subtasks: [
              ...(r.subtasks || []),
              { id: generateId(), text: trimmed, done: false },
            ],
          }
        : r
    );
    saveToStorage(STORAGE_KEYS.BIG_ROCKS, bigRocks);
    renderBigRocks();
  }

  function deleteSubtask(rockId, subId) {
    bigRocks = bigRocks.map((r) =>
      r.id === rockId
        ? {
            ...r,
            subtasks: (r.subtasks || []).filter((s) => s.id !== subId),
          }
        : r
    );
    saveToStorage(STORAGE_KEYS.BIG_ROCKS, bigRocks);
    renderBigRocks();
  }

  function toggleSubtaskDone(rockId, subId) {
    bigRocks = bigRocks.map((r) =>
      r.id === rockId
        ? {
            ...r,
            subtasks: (r.subtasks || []).map((s) =>
              s.id === subId ? { ...s, done: !s.done } : s
            ),
          }
        : r
    );
    saveToStorage(STORAGE_KEYS.BIG_ROCKS, bigRocks);
    renderBigRocks();
  }

  function promptEditSubtask(rockId, subId) {
    const rock = bigRocks.find((r) => r.id === rockId);
    if (!rock) return;
    const sub = (rock.subtasks || []).find((s) => s.id === subId);
    if (!sub) return;
    const next = window.prompt('编辑子任务：', sub.text);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed) return;

    bigRocks = bigRocks.map((r) =>
      r.id === rockId
        ? {
            ...r,
            subtasks: (r.subtasks || []).map((s) =>
              s.id === subId ? { ...s, text: trimmed } : s
            ),
          }
        : r
    );
    saveToStorage(STORAGE_KEYS.BIG_ROCKS, bigRocks);
    renderBigRocks();
  }

  function addTinyTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    tinyTasks.unshift({
      id: generateId(),
      text: trimmed,
      done: false,
    });
    saveToStorage(STORAGE_KEYS.TINY_TASKS, tinyTasks);
    renderTinyTasks();
  }

  function deleteTiny(id) {
    tinyTasks = tinyTasks.filter((t) => t.id !== id);
    saveToStorage(STORAGE_KEYS.TINY_TASKS, tinyTasks);
    renderTinyTasks();
  }

  function toggleTinyDone(id) {
    tinyTasks = tinyTasks.map((t) =>
      t.id === id ? { ...t, done: !t.done } : t
    );
    saveToStorage(STORAGE_KEYS.TINY_TASKS, tinyTasks);
    renderTinyTasks();
  }

  function promptEditTiny(id) {
    const task = tinyTasks.find((t) => t.id === id);
    if (!task) return;
    const next = window.prompt('编辑琐碎事项：', task.text);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed) return;

    tinyTasks = tinyTasks.map((t) =>
      t.id === id ? { ...t, text: trimmed } : t
    );
    saveToStorage(STORAGE_KEYS.TINY_TASKS, tinyTasks);
    renderTinyTasks();
  }

  function clearCompletedTiny() {
    tinyTasks = tinyTasks.filter((t) => !t.done);
    saveToStorage(STORAGE_KEYS.TINY_TASKS, tinyTasks);
    renderTinyTasks();
  }

  function collapseAllBigRocks() {
    const allCollapsed = bigRocks.every((r) => r.collapsed);
    bigRocks = bigRocks.map((r) => ({
      ...r,
      collapsed: !allCollapsed,
    }));
    saveToStorage(STORAGE_KEYS.BIG_ROCKS, bigRocks);
    renderBigRocks();
  }

  function bindEvents() {
    bigRockInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addBigRock(bigRockInput.value, bigRockNoteInput?.value || '');
        bigRockInput.value = '';
        if (bigRockNoteInput) bigRockNoteInput.value = '';
      }
    });

    bigRockNoteInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addBigRock(bigRockInput?.value || '', bigRockNoteInput.value);
        if (bigRockInput) bigRockInput.value = '';
        bigRockNoteInput.value = '';
      }
    });

    tinyTaskInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addTinyTask(tinyTaskInput.value);
        tinyTaskInput.value = '';
      }
    });

    clearCompletedTinyBtn?.addEventListener('click', () => {
      clearCompletedTiny();
    });

    collapseAllBtn?.addEventListener('click', () => {
      collapseAllBigRocks();
    });
  }

  bindEvents();
  render();
})();

