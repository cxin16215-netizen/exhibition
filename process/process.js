(() => {
  const form = document.querySelector('.filters');
  const search = document.querySelector('#search');
  const entries = [...document.querySelectorAll('.entry')];
  const tabs = [...document.querySelectorAll('[data-filter]')];
  const requested = new URLSearchParams(location.search).get('project');
  let project = ['forge', 'wool'].includes(requested) ? requested : 'all';
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
    const id = decodeURIComponent(location.hash.slice(1));
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
