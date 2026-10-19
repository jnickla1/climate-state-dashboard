/* One temporary within-member ribbon; never an ensemble envelope. */
'use strict';
window.MemberRibbon=(()=>{
  const node=id=>document.getElementById(id),cache=new Map();
  const state={revision:0,key:null,context:null,pinned:null,drawn:null,timer:null,lastPlotClick:0};
  const defaultText='Hover or tap a smoothed member to show its approximate 95% calibrated uncertainty.';
  const ribbonTraces=()=>[
    {type:'scatter',mode:'lines',x:[],y:[],line:{width:0},visible:false,hoverinfo:'skip',showlegend:false,connectgaps:false,name:'Selected member lower range'},
    {type:'scatter',mode:'lines',x:[],y:[],line:{width:0},fill:'tonexty',fillcolor:'rgba(255,220,70,.30)',visible:false,hoverinfo:'skip',showlegend:false,connectgaps:false,name:'Selected member 95% range'},
    {type:'scatter',mode:'lines',x:[],y:[],line:{color:'#ae8500',width:1.8},visible:false,hoverinfo:'text',showlegend:false,connectgaps:false,name:'Selected smoothed member'}
  ];
  function ribbonValues(center,se,indices){
    return {center:indices.map(i=>Number.isFinite(center[i])?center[i]:null),
      lower:indices.map(i=>Number.isFinite(center[i])&&Number.isFinite(se[i])&&se[i]>=0?center[i]-1.96*se[i]:null),
      upper:indices.map(i=>Number.isFinite(center[i])&&Number.isFinite(se[i])&&se[i]>=0?center[i]+1.96*se[i]:null)};
  }
  async function uncertainty(data){
    const key=data.baseline+'_'+data.goal;
    if(!cache.has(key))cache.set(key,(async()=>{
      const response=await fetch('assets/data/'+key+'_member_uncertainty.json?v=20261019-supp');
      if(!response.ok)throw Error('Matching uncertainty export is unavailable.');
      const value=await response.json();
      if(value.source_sha256!==data.metadata.source_sha256||JSON.stringify(value.years)!==JSON.stringify(data.years))throw Error('Uncertainty export does not match the displayed dataset.');
      return value;
    })().catch(error=>{cache.delete(key);throw error;}));
    return cache.get(key);
  }
  function clear(){
    clearTimeout(state.timer);state.pinned=null;state.drawn=null;
    node('inspectMember').value='';node('clearMember').disabled=true;node('ribbonStatus').textContent=defaultText;
    if(state.context)Plotly.restyle(state.context.plot,{visible:false},state.context.slots);
  }
  function show(member,pin=false){
    const ctx=state.context;if(!ctx?.se||!Number.isInteger(member)||!ctx.md.current[member])return;
    clearTimeout(state.timer);if(pin)state.pinned=member;
    node('inspectMember').value=String(member);node('clearMember').disabled=false;
    node('ribbonStatus').textContent='Member '+member+(state.pinned!==null?' selected':' hovered')+' · yellow: approximate 95% calibrated uncertainty (±1.96 SE), excluding spread across members.';
    if(state.drawn===member)return;
    state.drawn=member;const values=ribbonValues(ctx.md.current[member],ctx.se[member],ctx.indices);
    Plotly.restyle(ctx.plot,{x:[ctx.years,ctx.years,ctx.years],y:[values.lower,values.upper,values.center],visible:[true,true,true],meta:[{},{},{ensembleMember:member}],hovertemplate:['','','Year %{x}<br>Selected member '+member+': %{y:.3f}°C<extra></extra>']},ctx.slots);
  }
  function memberFrom(event){
    const value=event.points?.find(p=>Number.isInteger(p.data?.meta?.ensembleMember))?.data.meta.ensembleMember;
    return Number.isInteger(value)?value:null;
  }
  function bind(plot){
    if(plot._memberRibbonBound)return;plot._memberRibbonBound=true;
    plot.on('plotly_hover',event=>{if(!state.context?.se||state.pinned!==null)return;const member=memberFrom(event);if(member!==null)show(member);});
    plot.on('plotly_unhover',()=>{if(state.pinned===null){clearTimeout(state.timer);state.timer=setTimeout(clear,120);}});
    plot.on('plotly_click',event=>{
      state.lastPlotClick=performance.now();if(!state.context?.se)return;
      const member=memberFrom(event);if(member===null||state.pinned===member)clear();else show(member,true);
    });
    plot.addEventListener('click',()=>{if(performance.now()-state.lastPlotClick>100&&state.pinned!==null)clear();});
    plot.addEventListener('pointerleave',()=>{if(state.pinned===null){clearTimeout(state.timer);state.timer=setTimeout(clear,120);}});
    document.addEventListener('pointerdown',event=>{if(state.pinned!==null&&!plot.contains(event.target)&&!node('memberRibbonControls').contains(event.target))clear();});
  }
  function prepare(data,md){
    clearTimeout(state.timer);const key=data.baseline+'_'+data.goal+'_'+node('method').value+'_'+node('background').value;
    if(state.key!==key){state.pinned=null;state.drawn=null;}state.key=key;state.context=null;state.drawn=null;
    return ++state.revision;
  }
  async function attach(revision,plot,data,md,indices,start){
    if(revision!==state.revision)return;bind(plot);
    if(node('background').value!=='smoothed')return;
    const ctx={plot,md,indices,years:indices.map(i=>data.years[i]),slots:[start,start+1,start+2],se:null};state.context=ctx;
    const select=node('inspectMember');select.replaceChildren();const initial=document.createElement('option');initial.value='';initial.textContent='Hover / tap a line, or choose';select.append(initial);
    for(let member=0;member<md.current.length;member++){const option=document.createElement('option');option.value=String(member);option.textContent='Member '+member;select.append(option);}select.disabled=true;
    node('ribbonStatus').textContent='Loading calibrated member uncertainty…';node('clearMember').disabled=true;
    try{
      const value=await uncertainty(data);if(revision!==state.revision)return;
      ctx.se=value.methods[node('method').value]?.current_se;
      if(!Array.isArray(ctx.se)||ctx.se.length!==md.current.length)throw Error('Selected method uncertainty is unavailable.');
      select.disabled=false;node('ribbonStatus').textContent=defaultText;
      if(state.pinned!==null)show(state.pinned,true);
    }catch(error){if(revision===state.revision)node('ribbonStatus').textContent=error.message;}
  }
  function updateHint(smoothed,interactive){
    node('memberRibbonControls').hidden=!smoothed||!interactive;
    node('uncertaintyHintText').textContent=smoothed?'Hover or tap a smoothed line to see its uncertainty in pale yellow. Only the selected member gets a ribbon.':'Try “Smoothed ensemble (selected method)” under Temperature series, then hover or tap a line to explore its uncertainty.';
    node('trySmoothed').hidden=smoothed&&interactive;node('trySmoothed').textContent=interactive?'Try smoothed lines':'Try interactive uncertainty';
  }
  node('inspectMember').addEventListener('change',event=>event.target.value===''?clear():show(Number(event.target.value),true));
  node('clearMember').addEventListener('click',clear);
  node('trySmoothed').addEventListener('click',()=>{node('background').value='smoothed';node('interactiveButton').click();node('background').dispatchEvent(new Event('change',{bubbles:true}));});
  node('dismissUncertaintyHint').addEventListener('click',()=>{node('uncertaintyHint').hidden=true;try{sessionStorage.setItem('climateMemberHintDismissed','1');}catch{}});
  try{node('uncertaintyHint').hidden=sessionStorage.getItem('climateMemberHintDismissed')==='1';}catch{}
  return {ribbonTraces,ribbonValues,prepare,attach,updateHint};
})();
