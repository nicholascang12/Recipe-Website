const RECIPES = [
  { id: 'r1', title: 'Garlic Lemon Chicken Pasta', minutes: 20, vegetarian: false, ingredients: ['chicken', 'pasta', 'garlic', 'lemon', 'olive oil', 'parsley'], image: 'https://picsum.photos/seed/pasta/800/600' },
  { id: 'r2', title: 'Veggie Stir-Fry', minutes: 18, vegetarian: true, ingredients: ['broccoli', 'carrot', 'bell pepper', 'soy sauce', 'garlic', 'ginger'], image: 'https://picsum.photos/seed/stirfry/800/600' },
  { id: 'r3', title: 'Avocado Toast Deluxe', minutes: 10, vegetarian: true, ingredients: ['bread', 'avocado', 'lemon', 'chili flakes'], image: 'https://picsum.photos/seed/avotoast/800/600' },
  { id: 'r4', title: 'Salmon & Rice Bowl', minutes: 25, vegetarian: false, ingredients: ['salmon', 'rice', 'soy sauce', 'sesame', 'scallion'], image: 'https://picsum.photos/seed/salmon/800/600' },
  { id: 'r5', title: 'Tomato Basil Soup', minutes: 30, vegetarian: true, ingredients: ['tomato', 'basil', 'onion', 'garlic', 'cream'], image: 'https://picsum.photos/seed/soup/800/600' }
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LS_KEYS = { PLAN: 'rfmp.plan.v1', FAVS: 'rfmp.favs.v1' };

const getPlan = () => JSON.parse(localStorage.getItem(LS_KEYS.PLAN) || 'null') || Object.fromEntries(DAYS.map(d => [d, null]));
const setPlan = plan => localStorage.setItem(LS_KEYS.PLAN, JSON.stringify(plan));
const getFavs = () => new Set(JSON.parse(localStorage.getItem(LS_KEYS.FAVS) || '[]'));
const setFavs = set => localStorage.setItem(LS_KEYS.FAVS, JSON.stringify([...set]));

const q = document.getElementById('q');
const filter = document.getElementById('filter');
const list = document.getElementById('list');
const favsEl = document.getElementById('favs');
const planTable = document.getElementById('planTable').querySelector('tbody');
const clearBtn = document.getElementById('clearData');

function renderRecipes() {
  const term = q.value.trim().toLowerCase();
  const mode = filter.value;
  const favs = getFavs();

  const items = RECIPES.filter(r => {
    const matchesText = !term || r.title.toLowerCase().includes(term) || r.ingredients.some(i => i.toLowerCase().includes(term));
    const matchesFilter = mode === 'all' || (mode === 'veg' && r.vegetarian) || (mode === 'quick' && r.minutes < 25);
    return matchesText && matchesFilter;
  });

  list.innerHTML = items.map(r => cardHTML(r, favs)).join('');
  items.forEach(r => attachCardHandlers(r.id));
}

function cardHTML(r, favs) {
  const favOn = favs.has(r.id);
  const tagTime = `<span class="tag">${r.minutes} min</span>`;
  const tagVeg = r.vegetarian ? '<span class="tag">Vegetarian</span>' : '';
  const dayOpts = ['<option value="">Add to day…</option>', ...DAYS.map(d => `<option value="${d}">${d}</option>`)].join('');
  return `
    <article class="card" id="card-${r.id}">
      <img src="${r.image}" alt="${r.title}" loading="lazy" />
      <div class="pad">
        <div class="title">${r.title}</div>
        <div class="muted">${r.ingredients.join(', ')}</div>
        <div class="tags">${tagTime}${tagVeg}</div>
        <div class="row">
          <select id="day-${r.id}">${dayOpts}</select>
          <div class="row">
            <button class="primary" id="add-${r.id}">Add</button>
            <button class="ghost" id="fav-${r.id}" aria-pressed="${favOn}" title="Toggle favorite">${favOn ? '★' : '☆'}</button>
          </div>
        </div>
      </div>
    </article>`;
}

function renderPlan() {
  const plan = getPlan();
  planTable.innerHTML = DAYS.map(d => {
    const rid = plan[d];
    const r = RECIPES.find(x => x.id === rid);
    const content = r ? `<span class="title">${r.title}</span><br><span class="muted">${r.ingredients.slice(0,3).join(', ')}...</span>` : '<span class="muted">Empty</span>';
    return `<tr>
      <th scope="row">${d}</th>
      <td>${content}</td>
      <td style="width:1%"><button data-day="${d}" class="ghost remove">Clear</button></td>
    </tr>`;
  }).join('');
  planTable.querySelectorAll('button.remove').forEach(btn => {
    btn.addEventListener('click', e => {
      const d = e.currentTarget.getAttribute('data-day');
      const plan = getPlan();
      plan[d] = null;
      setPlan(plan);
      renderPlan();
    });
  });
}

function renderFavs() {
  const favs = getFavs();
  if (favs.size === 0) { favsEl.innerHTML = '<span class="muted">No favorites yet.</span>'; return; }
  const rows = [...favs].map(id => {
    const r = RECIPES.find(x => x.id === id);
    if (!r) return '';
    return `<div class="row" style="justify-content:space-between; border-top:1px dashed #e5e7eb; padding:8px 0">
      <div><span class="title">${r.title}</span> <span class="pill">${r.minutes} min</span></div>
      <button class="ghost unfav" data-id="${id}">Remove</button>
    </div>`;
  }).join('');
  favsEl.innerHTML = rows;
  favsEl.querySelectorAll('.unfav').forEach(btn => btn.addEventListener('click', () => {
    const set = getFavs();
    set.delete(btn.getAttribute('data-id'));
    setFavs(set);
    renderRecipes();
    renderFavs();
  }));
}

function attachCardHandlers(id) {
  const addBtn = document.getElementById(`add-${id}`);
  const daySel = document.getElementById(`day-${id}`);
  const favBtn = document.getElementById(`fav-${id}`);

  addBtn?.addEventListener('click', () => {
    const day = daySel.value;
    if (!day) { daySel.focus(); return; }
    const plan = getPlan();
    plan[day] = id;
    setPlan(plan);
    daySel.value = '';
    renderPlan();
  });

  favBtn?.addEventListener('click', () => {
    const set = getFavs();
    if (set.has(id)) set.delete(id); else set.add(id);
    setFavs(set);
    renderRecipes();
    renderFavs();
  });
}

q.addEventListener('input', renderRecipes);
filter.addEventListener('change', renderRecipes);
clearBtn.addEventListener('click', () => {
  if (!confirm('Clear your saved Weekly Plan and Favorites?')) return;
  localStorage.removeItem(LS_KEYS.PLAN);
  localStorage.removeItem(LS_KEYS.FAVS);
  renderPlan();
  renderFavs();
  renderRecipes();
});

function initPlanTable() {
  planTable.innerHTML = DAYS.map(d => `<tr><th scope="row">${d}</th><td><span class="muted">Empty</span></td><td style="width:1%"></td></tr>`).join('');
}
initPlanTable();
renderRecipes();
renderPlan();
renderFavs();

window.addEventListener('storage', e => {
  if (e.key === LS_KEYS.PLAN) renderPlan();
  if (e.key === LS_KEYS.FAVS) { renderFavs(); renderRecipes(); }
});
