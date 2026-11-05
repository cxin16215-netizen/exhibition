(() => {
  const form = document.querySelector('.filters');
  const search = document.querySelector('#search');
  const entries = [...document.querySelectorAll('.entry')];
  const tabs = [...document.querySelectorAll('[data-filter]')];
  if (!form || !search || !entries.length) return;
  const requested = new URLSearchParams(location.search).get('project');
  let project = ['forge', 'wool', 'corn'].includes(requested) ? requested : 'all';
  // A single-project page should never be blank because of a stale query string.
  if (!tabs.length) project = 'all';
  const controls = document.createElement('div');
  controls.className = 'portfolio-controls';
  for (const [label, open] of [['展开当前记录', true], ['收起当前记录', false]]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => entries.filter(entry => !entry.hidden).forEach(entry => { entry.open = open; }));
    controls.append(button);
  }
  form.after(controls);
  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    entries.forEach(entry => {
      const show = (project === 'all' || entry.dataset.project === project) && entry.textContent.toLocaleLowerCase().includes(query);
      entry.hidden = !show;
      if (show) count++;
    });
    tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.filter === project)));
    document.querySelector('#count').textContent = `显示 ${count} / ${entries.length} 条记录`;
    document.querySelector('#empty').hidden = count !== 0;
  }
  form.addEventListener('submit', event => event.preventDefault());
  search.addEventListener('input', render);
  tabs.forEach(tab => tab.addEventListener('click', () => {
    project = tab.dataset.filter;
    const url = new URL(location.href);
    if (project === 'all') url.searchParams.delete('project');
    else url.searchParams.set('project', project);
    history.replaceState(null, '', url);
    render();
  }));
  function revealAnchor() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target?.classList.contains('entry')) return;
    if (project !== 'all' && target.dataset.project !== project) project = target.dataset.project;
    const url = new URL(location.href);
    if (project === 'all') url.searchParams.delete('project');
    else url.searchParams.set('project', project);
    history.replaceState(null, '', url);
    search.value = '';
    target.open = true;
    render();
    requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant' }));
  }
  window.addEventListener('hashchange', revealAnchor);
  render();
  revealAnchor();
})();
