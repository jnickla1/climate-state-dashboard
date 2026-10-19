// Loaded only after opening the optional panel.
const cache = new Map();
let revision = 0;
const $ = id => document.getElementById(id);

export async function renderRateHistory(data, method, showCurrent, layout, config) {
  const token = ++revision, key = data.baseline + '_' + data.goal;
  $('rateHistoryStatus').textContent = 'Loading rate history…';
  try {
    if (!cache.has(key)) {
      const response = await fetch('assets/data/' + key + '_rate_history.json?v=20261019-supp');
      if (!response.ok) throw new Error('Could not load rate history.');
      cache.set(key, await response.json());
    }
    const rates = cache.get(key);
    if (token !== revision || $('rateHistoryPanel').hidden) return;
    if (rates.source_sha256 !== data.metadata.source_sha256 || JSON.stringify(rates.years) !== JSON.stringify(data.years)) {
      throw new Error('Rate history does not match the displayed dataset. Refresh the page or rebuild the exports.');
    }
    const selected = rates.methods[method];
    if (!selected) throw new Error('Rate history is unavailable for this method.');
    const shown = rates.years.map((y,i) => y >= 1965 ? i : null).filter(i => i !== null);
    const years = shown.map(i => rates.years[i]);
    const name = data.methods[method].label;
    const redLabel = 'retrospective';
    const traces = [
      {x:years,y:shown.map(i=>rates.benchmark[i]),mode:'lines',line:{color:'#172be1',width:3},connectgaps:false,name:'Centered-mean benchmark',hovertemplate:'Year %{x}<br>Benchmark %{y:.4f}°C/decade<extra></extra>'},
      {x:years,y:shown.map(i=>selected.retrospective[i]),mode:'lines',line:{color:'#d6332b',width:2.5},connectgaps:false,name:name+' · '+redLabel,hovertemplate:'Year %{x}<br>'+name+' %{y:.4f}°C/decade<extra></extra>'}
    ];
    if(showCurrent)traces.push({x:years,y:shown.map(i=>selected.current[i]),mode:'lines',line:{color:'#d6332b',width:1.5,dash:'dot'},opacity:.35,connectgaps:false,name:name+' · annual current outputs',hovertemplate:'Year %{x}<br>Annual-current rate %{y:.4f}°C/decade<extra></extra>'});
    await Plotly.react('rateHistoryPlot', traces, {...layout,showlegend:true,uirevision:key+'_'+method,margin:{l:67,r:25,t:18,b:82},legend:{itemclick:false,itemdoubleclick:false,orientation:'h',x:0,y:-.25,font:{size:10}},xaxis:{range:[1964.5,2026],tickvals:[1965,1975,1985,1995,2005,2015,2025],minor:{tickvals:[1970,1980,1990,2000,2010,2020],ticks:'outside',ticklen:3,showgrid:false},ticks:'outside',ticklabelstandoff:10,title:{text:'Year',standoff:10},showgrid:false},yaxis:{title:{text:'Warming rate (°C/decade)',standoff:10},gridcolor:'#ecf0ec',zerolinecolor:'#bbc6be'}},config);
    if (token !== revision || $('rateHistoryPanel').hidden) return;
    $('rateHistoryStatus').textContent = 'Blue: the benchmark’s OLS slope through 11 centered 10-year means (year − 5 to year + 5), available through 2015. Red: trailing 15-year quadratic endpoint rate '+'from retrospective estimates revised using the full record; its 2025 endpoint matches the headline. '+(showCurrent?'Faint dotted red: the same fit to annual current outputs, which may differ from the headline. ':'')+(data.goal==='anthro'?' The blue benchmark represents realized observations.':'')+' GWI uses the existing current-output retrospective proxy. No uncertainty ribbons are shown.';
  } catch (error) {
    if (token === revision && !$('rateHistoryPanel').hidden) {
      Plotly.purge('rateHistoryPlot');
      $('rateHistoryStatus').textContent = error.message;
    }
  }
}

export function cancelRateHistory() { revision++; }
