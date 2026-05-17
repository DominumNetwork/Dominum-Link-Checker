import './style.css';

const BASE_URL = 'https://live.glseries.net/api/v1';
const BASE_URL_BACKUP = 'https://live-glseries.global.ssl.fastly.net/api/v1';

const API_TOKEN = 'gl_534191c3cff620e89ee4d65c560756e8fc356f9838c41f80';
const API_TOKEN_BACKUP = 'gl_89ca8cd4cbc993339422a47326819838b9ecefae968658ae';

const FILTERS_DATA = [
  { key: 'fortiguard', name: 'FortiGuard' },
  { key: 'lightspeed', name: 'Lightspeed' },
  { key: 'paloalto', name: 'Palo Alto' },
  { key: 'blocksiweb', name: 'Blocksi Web' },
  { key: 'blocksiai', name: 'Blocksi AI' },
  { key: 'blocksiguardian', name: 'Blocksi Guardian' },
  { key: 'linewize', name: 'Linewize' },
  { key: 'cisco', name: 'Cisco Umbrella' },
  { key: 'securly', name: 'Securly' },
  { key: 'goguardian', name: 'GoGuardian' },
  { key: 'goguardianv2', name: 'GoGuardian V2' },
  { key: 'goguardianai', name: 'GoGuardian AI' },
  { key: 'lanschool', name: 'LanSchool' },
  { key: 'lanschoolair', name: 'LanSchool Air' },
  { key: 'contentkeeper', name: 'ContentKeeper' },
  { key: 'aristotle', name: 'AristotleK12' },
  { key: 'senso', name: 'Senso Cloud' },
  { key: 'deledao', name: 'Deledao' },
  { key: 'iboss', name: 'iBoss' },
  { key: 'barracuda', name: 'Barracuda' },
  { key: 'dnsfilter', name: 'DNSFilter' },
  { key: 'qustodio', name: 'Qustodio' },
  { key: 'sophos', name: 'Sophos' },
  { key: 'zscaler', name: 'Zscaler' },
  { key: 'gaggle', name: 'Gaggle' },
  { key: 'smoothwall', name: 'Smoothwall' },
  { key: 'safedns', name: 'SafeDNS' },
  { key: 'ruckus', name: 'Ruckus' },
  { key: 'unifi', name: 'Unifi' },
  { key: 'webroot', name: 'Webroot' },
  { key: 'nextdns', name: 'NextDNS' },
  { key: 'netsweeper', name: 'Netsweeper' },
  { key: 'hapara', name: 'Hapara' },
  { key: 'forcepoint', name: 'ForcePoint' },
  { key: 'cleanbrowsing', name: 'CleanBrowsing' },
  { key: 'adguard', name: 'AdGuard' },
  { key: 'googlesafebrowsing', name: 'Google Safe Browsing' },
  { key: 'opendns', name: 'OpenDNS' },
  { key: 'watchguard', name: 'WatchGuard' },
  { key: 'cloudflareintel', name: 'Cloudflare Intel' },
  { key: 'cloudflarefamily', name: 'Cloudflare Family' },
  { key: 'quad9', name: 'Quad9' },
  { key: 'trellix', name: 'Trellix' },
  { key: 'controld', name: 'Control D' },
  { key: 'dragonflyai', name: 'Dragonfly AI' },
  { key: 'norton', name: 'Norton' },
  { key: 'kaspersky', name: 'Kaspersky' },
  { key: 'ciracs', name: 'CIRA CS' },
  { key: 'safesurfer', name: 'SafeSurfer' },
  { key: 'mrworldwide', name: 'Mr. Worldwide' }
];

let availableFilters = [...FILTERS_DATA];
let selectedFilters = new Set();
let isAllSelected = true;

async function checkUrlsBatch(urls, filtersList) {
  const chunks = [];
  for (let i = 0; i < urls.length; i += 3) {
    chunks.push(urls.slice(i, i + 3));
  }

  const allResults = {};
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const urlParam = chunk.join(',');
    let filterParam = filtersList.join(',');
    
    updateStatus(`Checking batch ${i + 1} of ${chunks.length}...`, i, chunks.length);
    
    let endpoint = '/multi';
    if (!filterParam || isAllSelected) {
      filterParam = ''; 
      endpoint = '/bulk';
    }
    
    const url = `${BASE_URL}${endpoint}?token=${API_TOKEN}&url=${urlParam}${filterParam ? '&filters=' + filterParam : ''}`;
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    
    try {
      let data = null;
      let lastError = null;

      outer:
      for (const base of [BASE_URL, BASE_URL_BACKUP]) {
        for (const token of [API_TOKEN, API_TOKEN_BACKUP]) {
          const tokenUrl = `${base}${endpoint}?token=${token}&url=${urlParam}${filterParam ? '&filters=' + filterParam : ''}`;
          const tokenProxyUrl = `/api/proxy?url=${encodeURIComponent(tokenUrl)}`;
          try {
            const response = await fetch(tokenProxyUrl);
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `HTTP ${response.status}`);
            }
            const json = await response.json();
            if (!json.success) throw new Error(json.error || 'Unknown error');
            data = json;
            break outer;
          } catch (e) {
            console.warn(`Failed with base=${base} token=${token}, trying next...`, e);
            lastError = e;
          }
        }
      }

      if (!data) throw lastError;

      for (const key of Object.keys(data.results || {})) {
        allResults[key] = data.results[key];
      }
    } catch (e) {
      console.error("Batch error for chunk", chunk, e);
    }
  }

  updateStatus('Complete', chunks.length, chunks.length);
  return { results: allResults };
}

function updateStatus(text, current, total) {
  const statusContainer = document.getElementById('statusContainer');
  const statusText = document.getElementById('statusText');
  const statusCount = document.getElementById('statusCount');
  const statusProgress = document.getElementById('statusProgress');
  
  statusContainer.classList.remove('hidden');
  statusText.textContent = text;
  statusCount.textContent = `${current} / ${total}`;
  statusProgress.style.width = `${(current / total) * 100}%`;
}

function showError(msg) {
  const errorContainer = document.getElementById('errorContainer');
  const errorText = document.getElementById('errorText');
  errorContainer.classList.remove('hidden');
  errorText.textContent = msg;
}

function hideAlerts() {
  document.getElementById('errorContainer').classList.add('hidden');
  document.getElementById('statusContainer').classList.add('hidden');
}

async function init() {
  const filterDropdownBtn = document.getElementById('filterDropdownBtn');
  const filterDropdownMenu = document.getElementById('filterDropdownMenu');
  const checkAllFilters = document.getElementById('checkAllFilters');
  const filterListContainer = document.getElementById('filterListContainer');
  const filterDropdownText = document.getElementById('filterDropdownText');

  filterDropdownBtn.addEventListener('click', () => {
    filterDropdownMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!filterDropdownBtn.contains(e.target) && !filterDropdownMenu.contains(e.target)) {
      filterDropdownMenu.classList.add('hidden');
    }
  });

  try {
    filterListContainer.innerHTML = '';
    
    availableFilters.forEach(f => {
      const label = document.createElement('label');
      label.className = 'flex items-center p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors group';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = f.key;
      checkbox.className = 'filter-item-check w-4 h-4 text-blue-500 bg-slate-900 border-slate-600 rounded focus:ring-blue-500 focus:ring-offset-0 mr-3 cursor-pointer';
      checkbox.checked = true;
      selectedFilters.add(f.key);

      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          selectedFilters.add(f.key);
        } else {
          selectedFilters.delete(f.key);
        }
        updateDropdownState();
      });

      const span = document.createElement('span');
      span.className = 'font-medium text-slate-300 group-hover:text-white transition-colors text-sm';
      span.textContent = f.name;

      label.appendChild(checkbox);
      label.appendChild(span);
      filterListContainer.appendChild(label);
    });

    checkAllFilters.addEventListener('change', (e) => {
      const checked = e.target.checked;
      document.querySelectorAll('.filter-item-check').forEach(cb => {
        cb.checked = checked;
      });
      if (checked) {
        availableFilters.forEach(f => selectedFilters.add(f.key));
      } else {
        selectedFilters.clear();
      }
      updateDropdownState();
    });

  } catch (error) {
    filterListContainer.innerHTML = `<div class="p-4 text-red-400 text-sm">Failed to load filters: ${error.message}</div>`;
  }

  function updateDropdownState() {
    isAllSelected = selectedFilters.size === availableFilters.length;
    checkAllFilters.checked = isAllSelected;
    
    if (isAllSelected) {
      filterDropdownText.textContent = 'All Filters';
    } else if (selectedFilters.size === 0) {
      filterDropdownText.textContent = 'No filters selected';
    } else {
      filterDropdownText.textContent = `${selectedFilters.size} filter${selectedFilters.size > 1 ? 's' : ''} selected`;
    }
  }

  document.getElementById('checkBtn').addEventListener('click', async () => {
    hideAlerts();
    const urlsText = document.getElementById('urlInput').value;
    const urls = urlsText.split('\n').map(u => u.trim()).filter(Boolean);
    
    if (urls.length === 0) {
      showError('Please enter at least one URL to check.');
      return;
    }

    if (selectedFilters.size === 0 && !isAllSelected) {
      showError('Please select at least one filter.');
      return;
    }

    const checkBtn = document.getElementById('checkBtn');
    checkBtn.disabled = true;
    checkBtn.innerHTML = '<svg class="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Scanning...';

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    document.getElementById('resultsCountBadge').classList.add('hidden');

    try {
      const data = await checkUrlsBatch(urls, Array.from(selectedFilters));
      renderResults(data.results);
      
      const urlCount = Object.keys(data.results || {}).length;
      if (urlCount > 0) {
        document.getElementById('resultsCountBadge').textContent = `${urlCount} URL${urlCount > 1 ? 's' : ''} Scanned`;
        document.getElementById('resultsCountBadge').classList.remove('hidden');
      } else {
        showError('No results returned. Ensure your API token is valid.');
      }
    } catch (e) {
      showError(`Scan Failed: ${e.message}`);
      document.getElementById('statusContainer').classList.add('hidden');
    } finally {
      checkBtn.disabled = false;
      checkBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg><span>Scan URLs</span>';
      setTimeout(() => document.getElementById('statusContainer').classList.add('hidden'), 2000);
    }
  });
}

function renderResults(results) {
  const resultsDiv = document.getElementById('results');
  
  if (Object.keys(results).length === 0) {
    resultsDiv.innerHTML = `
      <div class="flex flex-col items-center justify-center p-12 text-slate-500 border border-slate-800/50 border-dashed rounded-2xl bg-slate-900/20">
        <p class="font-medium text-sm">No valid responses to display.</p>
      </div>`;
    return;
  }
  
  Object.keys(results).forEach(url => {
    const resArray = results[url] || [];
    const totalFilters = resArray.length;
    const blockedCount = resArray.filter(r => r.blocked).length;
    
    let badgeColor = 'bg-green-500/10 text-green-400 border-green-500/20';
    let summaryText = 'All Clear';
    if (blockedCount > 0) {
      if (blockedCount === totalFilters) {
        badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
        summaryText = 'Blocked Everywhere';
      } else {
        badgeColor = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
        summaryText = `Blocked on ${blockedCount}/${totalFilters}`;
      }
    }
    
    const uniqueId = Math.random().toString(36).substr(2, 9);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all';
    
    let html = `
      <button class="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors focus:outline-none group text-left" id="btn-${uniqueId}">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${blockedCount > 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}">
            ${blockedCount > 0 ? '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>' : '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>'}
          </div>
          <div>
            <h3 class="font-bold text-slate-200 text-lg group-hover:text-blue-400 transition-colors truncate max-w-[200px] sm:max-w-xs md:max-w-md">${url}</h3>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs font-semibold px-2 py-0.5 rounded border ${badgeColor}">${summaryText}</span>
              <span class="text-xs text-slate-500 font-mono">${resArray.reduce((acc, curr) => acc + (curr.responseTime || 0), 0)}ms total</span>
            </div>
          </div>
        </div>
        <div class="p-2 bg-slate-800/80 rounded-full group-hover:bg-slate-700 transition-colors text-slate-400 group-hover:text-slate-200 transform duration-200" id="icon-${uniqueId}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </button>
      <div id="content-${uniqueId}" class="hidden border-t border-slate-800/50 bg-[#131317]/50 p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    `;
    
    resArray.forEach(res => {
      const isBlocked = res.blocked;
      html += `
        <div class="p-3 rounded-lg border flex flex-col justify-between ${isBlocked ? 'bg-red-500/5 border-red-500/20 shadow-[inset_0_0_10px_rgba(239,68,68,0.05)]' : 'bg-green-500/5 border-green-500/20 shadow-[inset_0_0_10px_rgba(34,197,94,0.05)]'} relative overflow-hidden group/card hover:border-slate-600 transition-colors">
          <div class="flex justify-between items-start mb-2">
            <span class="font-bold text-sm tracking-tight text-slate-200">${res.name}</span>
            <span class="${isBlocked ? 'text-red-400 bg-red-400/10' : 'text-green-400 bg-green-400/10'} text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wider ring-1 ring-inset ${isBlocked ? 'ring-red-400/20' : 'ring-green-400/20'}">${isBlocked ? 'Blocked' : 'Allowed'}</span>
          </div>
          <div class="flex items-center justify-between mt-auto pt-2 border-t border-slate-800/30">
            <span class="text-xs font-semibold text-slate-500 truncate max-w-[120px]" title="${res.category || 'Unknown Filter Category'}">${res.category || 'Standard'}</span>
            <span class="text-xs font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded opacity-70"><span class="text-blue-400/70">${res.responseTime || 0}</span>ms</span>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
    
    wrapper.innerHTML = html;
    
    wrapper.querySelector(`#btn-${uniqueId}`).addEventListener('click', () => {
      const content = wrapper.querySelector(`#content-${uniqueId}`);
      const icon = wrapper.querySelector(`#icon-${uniqueId}`);
      content.classList.toggle('hidden');
      if (content.classList.contains('hidden')) {
        icon.classList.remove('rotate-180');
      } else {
        icon.classList.add('rotate-180');
      }
    });

    resultsDiv.appendChild(wrapper);
  });
}

init();