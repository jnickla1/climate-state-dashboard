// Loaded only after opening the optional panel.
const cache = new Map();
let revision = 0;
const $ = id => document.getElementById(id);
const t = (key, vars) => window.I18N ? window.I18N.t(key, vars) : key;

export async function renderRateHistory(data, method, showCurrent, layout, config) {
  const token = ++revision, key = data.baseline + '_' + data.goal;
  $('rateHistoryStatus').textContent = t('rates.loading');
  try {
    if (!cache.has(key)) {
      const response = await fetch('assets/data/' + key + '_rate_history.json?v=20261020-seeds');
      if (!response.ok) throw new Error(t('rates.loadError'));
      cache.set(key, await response.json());
    }
    const rates = cache.get(key);
    if (token !== revision || $('rateHistoryPanel').hidden) return;
    if (rates.source_sha256 !== data.metadata.source_sha256 || JSON.stringify(rates.years) !== JSON.stringify(data.years)) {
      throw new Error(t('rates.mismatch'));
    }
    const selected = rates.methods[method];
    if (!selected) throw new Error(t('rates.unavailable'));
    const shown = rates.years.map((y,i) => y >= 1965 ? i : null).filter(i => i !== null);
    const years = shown.map(i => rates.years[i]);
    const name = window.methodLabel ? window.methodLabel(method, data.methods[method]) : data.methods[method].label;
    const traces = [
      {x:years,y:shown.map(i=>rates.benchmark[i]),mode:'lines',line:{color:'#172be1',width:3},connectgaps:false,name:t('plot.benchmarkName'),hovertemplate:t('rates.benchmarkHover')+'<extra></extra>'},
      {x:years,y:shown.map(i=>selected.retrospective[i]),mode:'lines',line:{color:'#d6332b',width:2.5},connectgaps:false,name:t('rates.retrospectiveName',{method:name}),hovertemplate:t('rates.retrospectiveHover',{method:name})+'<extra></extra>'}
    ];
    if(showCurrent)traces.push({x:years,y:shown.map(i=>selected.current[i]),mode:'lines',line:{color:'#d6332b',width:1.5,dash:'dot'},opacity:.35,connectgaps:false,name:t('rates.currentName',{method:name}),hovertemplate:t('rates.currentHover')+'<extra></extra>'});
    await Plotly.react('rateHistoryPlot', traces, {...layout,showlegend:true,uirevision:key+'_'+method,margin:{l:67,r:25,t:18,b:82},legend:{itemclick:false,itemdoubleclick:false,orientation:'h',x:0,y:-.25,font:{size:10}},xaxis:{range:[1964.5,2026],tickvals:[1965,1975,1985,1995,2005,2015,2025],minor:{tickvals:[1970,1980,1990,2000,2010,2020],ticks:'outside',ticklen:3,showgrid:false},ticks:'outside',ticklabelstandoff:10,title:{text:t('axis.year'),standoff:10},showgrid:false},yaxis:{title:{text:t('rates.yaxis'),standoff:10},gridcolor:'#ecf0ec',zerolinecolor:'#bbc6be'}},config);
    if (token !== revision || $('rateHistoryPanel').hidden) return;
    $('rateHistoryStatus').textContent = [t('rates.status.main'), showCurrent ? t('rates.status.current') : '', data.goal === 'anthro' ? t('rates.status.anthro') : '', t('rates.status.tail')].filter(Boolean).join(' ');
  } catch (error) {
    if (token === revision && !$('rateHistoryPanel').hidden) {
      Plotly.purge('rateHistoryPlot');
      $('rateHistoryStatus').textContent = error.message;
    }
  }
}

export function cancelRateHistory() { revision++; }
