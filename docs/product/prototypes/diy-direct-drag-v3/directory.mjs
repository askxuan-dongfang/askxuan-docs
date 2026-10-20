// This small directory page reuses v2's example categories, without business requests.
export const directoryExamples = [
  { id: 'temple-1', kind: 'temple', name: '灵隐寺（示例）', belief: '汉传佛教', tradition: '禅宗', region: '大陆', tags: ['禅修', '静心'], services: ['祈福', '供灯'] },
  { id: 'temple-2', kind: 'temple', name: '普陀禅院（示例）', belief: '汉传佛教', tradition: '净土宗', region: '香港', tags: ['净心', '共修'], services: ['诵经', '祈福'] },
  { id: 'temple-3', kind: 'temple', name: '青城宫观（示例）', belief: '道教', tradition: '全真派', region: '大陆', tags: ['清修', '养生'], services: ['祈福', '供灯'] },
  { id: 'master-1', kind: 'master', name: '明觉法师（示例）', belief: '汉传佛教', tradition: '禅宗', region: '大陆', tags: ['禅修', '静心'], services: ['祈福', '诵经'] },
  { id: 'master-2', kind: 'master', name: '清和道长（示例）', belief: '道教', tradition: '正一派', region: '大陆', tags: ['清修', '民俗'], services: ['祈福', '供灯'] },
  { id: 'master-3', kind: 'master', name: '南音居士（示例）', belief: '汉传佛教', tradition: '净土宗', region: '台湾', tags: ['共修', '净心'], services: ['诵经'] },
];
export function matchDirectoryExamples({ kind, query = '', belief = '', tradition = '', region = '', service = '' }) {
  const words = query.normalize('NFKC').trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean);
  return directoryExamples.filter(item => item.kind === kind && (!belief || item.belief === belief) && (!tradition || item.tradition === tradition)
    && (!region || item.region === region) && (!service || item.services.includes(service))
    && words.every(word => [item.name, ...item.tags, ...item.services, item.region, item.belief, item.tradition].some(field => field.normalize('NFKC').toLocaleLowerCase().includes(word))));
}
export function setupDirectory({ modal }) {
  const $ = id => document.getElementById(id);
  const groups = {
    '汉传佛教': ['禅宗', '净土宗', '天台宗', '华严宗'],
    '藏传佛教': ['格鲁派', '宁玛派', '噶举派', '萨迦派'],
    '南传佛教': ['上座部传统'],
    '道教': ['全真派', '正一派'],
    '民间信仰': ['妈祖 / 天后', '关帝信俗', '城隍信俗', '王爷信俗', '福德正神', '保生大帝', '哪吒信俗', '洪圣信俗', '黄大仙信俗', '九皇爷信俗', '大伯公信俗', '拿督公信俗', '三山国王'],
  };
  const regions = ['', '大陆', '香港', '澳门', '台湾'];
  let kind = 'temple', belief = '', tradition = '', region = '', service = '';
  const queries = { temple: '', master: '' };
  let panel = '', trigger = null, swallowClick = false;
  function button(label, selected, action) {
    const node = document.createElement('button'); node.textContent = label;
    node.setAttribute('aria-pressed', String(selected)); node.onclick = action; return node;
  }
  function close(restoreFocus = false) {
    if (!panel) return;
    panel = ''; renderPanels();
    if (restoreFocus) trigger?.focus({ preventScroll: true });
  }
  function open(next, element, keyboard = false) {
    trigger = element; panel = panel === next && !keyboard ? '' : next; renderPanels();
    if (keyboard && panel) {
      const target = panel === 'region' ? $('directory-region-panel') : $('directory-tradition-panel');
      target.querySelector('button[aria-pressed="true"]')?.focus({ preventScroll: true });
    }
  }
  function renderPanels() {
    $('directory-region').setAttribute('aria-expanded', String(panel === 'region'));
    $('directory-region').setAttribute('aria-label', `地区筛选，${region || '全部地区'}`);
    $('directory-region-label').textContent = region || '地区';
    $('directory-region-panel').classList.toggle('hidden', panel !== 'region');
    $('directory-tradition-panel').classList.toggle('hidden', panel !== 'tradition');
    $('directory-types').querySelectorAll('[data-belief]').forEach(node => {
      node.setAttribute('aria-expanded', String(panel === 'tradition' && node.dataset.belief === belief));
      node.setAttribute('aria-pressed', String(node.dataset.belief === belief));
    });
    $('directory-region-panel').replaceChildren(...regions.map(value => button(value || '全部地区', value === region, () => {
      region = value; close(true); renderResults();
    })));
    $('directory-tradition-panel').replaceChildren(...(belief ? ['', ...groups[belief]].map(value => button(value || `全部${belief}`, value === tradition, () => {
      tradition = value; close(true); renderResults();
    })) : []));
  }
  function renderTypes() {
    $('directory-types').replaceChildren(...['', ...Object.keys(groups)].map(value => {
      const select = (event, keyboard = false) => {
        if (belief !== value) { tradition = ''; if (panel === 'tradition') panel = ''; }
        belief = value;
        if (!value) close(); else open('tradition', event.currentTarget, keyboard);
        renderPanels(); renderResults();
      };
      const node = button(value || '全部', value === belief, event => select(event));
      node.dataset.belief = value;
      if (value) {
        node.setAttribute('aria-haspopup', 'true'); node.setAttribute('aria-controls', 'directory-tradition-panel');
        node.onkeydown = event => { if (event.key === 'ArrowDown') { event.preventDefault(); select(event, true); } };
      }
      return node;
    }));
    renderPanels();
  }
  function renderServices() {
    $('directory-services').replaceChildren(...['', '祈福', '供灯', '诵经'].map(value => button(value || '全部', value === service, () => {
      service = value; renderServices(); renderResults();
    })));
  }
  function renderResults() {
    const results = matchDirectoryExamples({ kind, query: queries[kind], belief, tradition, region, service });
    $('directory-results').replaceChildren(...results.map(item => {
      const node = document.createElement('button'); node.className = 'directory-result';
      const title = document.createElement('strong'); title.textContent = item.name;
      const taxonomy = document.createElement('span'); taxonomy.textContent = [item.belief, item.tradition, ...item.tags].join(' · ');
      const filters = document.createElement('span'); filters.textContent = `${item.region} · ${item.services.join(' / ')}`;
      node.append(title, taxonomy, filters);
      node.onclick = () => modal('目录详情示意', '这是示例结果入口。浮层外点首先关闭浮层，再次点击才进入此示意；未打开真实寺院或师傅业务详情。');
      return node;
    }));
    if (!results.length) {
      const empty = document.createElement('p'); empty.className = 'review-note'; empty.setAttribute('role', 'status');
      empty.textContent = `没有符合关键词和当前筛选的${kind === 'temple' ? '寺院' : '师傅'}示例`; $('directory-results').append(empty);
    }
  }
  $('directory-search').oninput = event => { queries[kind] = event.target.value; renderResults(); };
  $('directory-region').onclick = event => open('region', event.currentTarget);
  $('directory-region').onkeydown = event => { if (event.key === 'ArrowDown') { event.preventDefault(); open('region', event.currentTarget, true); } };
  $('directory-anchor').addEventListener('focusout', event => {
    if (event.relatedTarget && !$('directory-anchor').contains(event.relatedTarget)) close();
  });
  document.addEventListener('pointerdown', event => {
    if (!panel || $('directory-anchor').contains(event.target)) return;
    event.preventDefault(); event.stopPropagation(); swallowClick = true; close(true);
  }, true);
  document.addEventListener('click', event => {
    if (!swallowClick) return;
    swallowClick = false; event.preventDefault(); event.stopPropagation();
  }, true);
  document.addEventListener('pointercancel', () => { swallowClick = false; }, true);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !panel) return;
    event.preventDefault(); event.stopPropagation(); close(true);
  });
  renderTypes(); renderServices(); renderResults();
  return { close, show(value) {
    kind = value;
    $('directory-search').value = queries[kind];
    const label = `搜索${kind === 'temple' ? '寺院' : '师傅'}名称、标签、服务或地区`;
    $('directory-search').placeholder = label; $('directory-search').setAttribute('aria-label', label);
    renderTypes(); renderServices(); renderResults();
  } };
}
