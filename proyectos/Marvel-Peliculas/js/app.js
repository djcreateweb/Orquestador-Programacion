/* ================================================================
   MCU TRACKER — LÓGICA DE LA APLICACIÓN (js/app.js)
   Extraído del <script> inline de index.html (reestructura 2026-07-23)
   e incorpora el rediseño de Resúmenes/Plataforma (media-cards) y del
   selector de nota (escala con relleno + bottom sheet).

   Orden de carga obligatorio (index.html):
     js/images-posters.js  → POSTERS_LOCAL, HERO_LOCAL
     js/data.js            → DATA, XMEN_DATA, PRESET_VISTO
     js/app.js             → este fichero

   Contratos intocables (CLAUDE.md): keys de localStorage, identidad
   por campo `t`, orden de TAB_IDS, buildXmen() tras buildChecklist(),
   .rating con position:relative y sin overflow:hidden en .item/.grid.
   ================================================================ */
(function(){
'use strict';

/* Nota: la pestaña "Plataforma" no mantiene una tabla de disponibilidad
   (caduca demasiado rápido); abre una búsqueda de Google por título. */

const KEY="mcu_checklist_v3";
const RATINGS_KEY="mcu_ratings_v1";
const TICK='<svg viewBox="0 0 24 24"><polyline points="4 12 10 18 20 6"/></svg>';
const CLOCK='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
let state={};
let ratings={};

window.mcuGetSnapshot=function(){
  const seen=Object.keys(state).filter(function(t){ return !!state[t]; });
  const total=typeof TRACKED_ITEMS!=='undefined' ? TRACKED_ITEMS.length : 0;
  return {
    seen:seen,
    ratings:Object.assign({},ratings),
    progressPercent:total ? Math.round(seen.length/total*100) : 0
  };
};

function notifyLocalChange(){
  const snapshot=window.mcuGetSnapshot();
  window.dispatchEvent(new CustomEvent('mcu-local-change',{detail:{
    seen:snapshot.seen,
    ratings:snapshot.ratings,
    progressPercent:snapshot.progressPercent
  }}));
}

/* ============ HELPERS ============ */
function posterOf(it){ return POSTERS_LOCAL[it.t] || null; }
function googleUrl(it){ return 'https://www.google.com/search?q='+encodeURIComponent(it.q||it.t); }
function youtubeUrl(it){ return 'https://www.youtube.com/results?search_query='+encodeURIComponent('resumen '+it.t+' Marvel'); }
function whereToWatchUrl(it){ return 'https://www.google.com/search?q='+encodeURIComponent(it.t+' dónde ver online plataforma'); }
function typeLabel(type){ return type==='film'?'Película':type==='serie'?'Serie':'Especial'; }
function durationLabel(it){
  if(!it.m) return '';
  const h=Math.floor(it.m/60), min=it.m%60;
  const txt = h===0 ? min+' min' : (min===0 ? h+' h' : h+' h '+min+' min');
  return (it.est?'≈ ':'')+txt;
}
function buildDurationEl(it){
  const dur=durationLabel(it);
  if(!dur) return null;
  const el=document.createElement('span');
  el.className='duration';
  el.title='Duración total'+(it.est?' (estimada)':'');
  el.innerHTML=CLOCK;
  el.appendChild(document.createTextNode(dur));
  return el;
}

function load(){
  try{ state=JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){ state={}; }
  if(!localStorage.getItem(KEY)){ PRESET_VISTO.forEach(t=>state[t]=true); save(); }
}
function save(){
  localStorage.setItem(KEY,JSON.stringify(state));
  notifyLocalChange();
}

function loadRatings(){
  try{ ratings=JSON.parse(localStorage.getItem(RATINGS_KEY))||{}; }catch(e){ ratings={}; }
}
function saveRatings(){
  localStorage.setItem(RATINGS_KEY,JSON.stringify(ratings));
  notifyLocalChange();
}
function setRating(t,val){
  if(val===''){ delete ratings[t]; }else{ ratings[t]=Number(val); }
  saveRatings();
  syncMediaRating(t); // refleja la nota en las tarjetas de Resúmenes/Plataforma
  applyFilters();
}

/* ============ ÍNDICES AUXILIARES ============ */
const ALL_PHASES = DATA.concat(XMEN_DATA);
const TRACKED_ITEMS = ALL_PHASES.reduce((acc,ph)=>acc.concat(ph.items),[]); // MCU + X-Men: progreso global
const titleToPhase = new Map();
ALL_PHASES.forEach(ph=>ph.items.forEach(it=>titleToPhase.set(it.t,ph.phase)));
const itemRefs = new Map();   // título -> { row, check }
const phaseRefs = new Map();  // nombre de fase -> { items, totalPh, pctEl, countEl, fillEl }
const mediaRefs = new Map();  // título -> [tarjetas .media-card en Resúmenes/Plataforma]

/* ============ CONSTRUCCIÓN DE PÓSTER (con onerror + lazy) ============ */
function buildPosterEl(it){
  const poster=document.createElement('div');
  poster.className='poster';
  poster.style.setProperty('--type-tint','var(--'+it.type+'-tint)');
  const url=posterOf(it);
  if(url){
    const img=document.createElement('img');
    img.src=url;
    img.alt=''; // decorativo: el título ya está en texto junto al póster
    img.loading='lazy';
    img.decoding='async';
    img.onerror=function(){ this.remove(); }; // si falla, queda visible el tinte de tipo de fondo
    poster.appendChild(img);
  }
  return poster;
}

/* ============ NOTA v3: disparador + escala 0–10 con relleno ============
   Patrón ARIA "Collapsible Dropdown Listbox" (W3C APG), heredado de la
   v2 sin cambios de contrato: mismo role=listbox, opciones con
   data-value ''|'0'..'10' y misma KEY mcu_ratings_v1. Novedades v3:
   - Cabecera con el título dentro del popover/sheet.
   - Efecto "medidor": las opciones numéricas hasta la activa reciben
     .is-fill (lo pinta el CSS como barra degradada lila→azul).
   - En escritorio la escala es una sola fila (flechas ↑↓ = ±1);
     en el sheet móvil la rejilla es de 4 columnas (flechas ↑↓ = ±4). */
const STAR_ICON = '<path d="M12 2.6 14.9 8.9 21.8 9.7 16.6 14.4 18.1 21.2 12 17.6 5.9 21.2 7.4 14.4 2.2 9.7 9.1 8.9Z" fill="currentColor"/>';
const CHEVRON_ICON = '<polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';

let ratingSeq = 0;
let activeRatingCtx = null; // única instancia de popover abierta a la vez (singleton)

function triggerAriaLabel(title,val){
  return 'Nota para «'+title+'»: '+(val===''?'sin nota':val+' sobre 10')+'. Abrir selector de 0 a 10.';
}

function currentSelectedIndex(ctx){
  const i = ctx.optionEls.findIndex(function(o){ return o.dataset.value === ctx.currentValue; });
  return i === -1 ? 0 : i;
}

function setActiveOption(ctx,idx){
  idx = Math.max(0, Math.min(ctx.optionEls.length - 1, idx)); // clamp, sin wrap
  ctx.activeIndex = idx;
  ctx.optionEls.forEach(function(o,i){
    o.classList.toggle('is-active', i === idx);
    // Relleno del "medidor": solo opciones numéricas (índice ≥1) hasta la
    // activa, y solo si la activa es numérica (la opción "Sin nota" vacía).
    o.classList.toggle('is-fill', idx >= 1 && i >= 1 && i <= idx);
  });
  ctx.popoverEl.setAttribute('aria-activedescendant', ctx.optionEls[idx].id);
}

/* ---- Modo "bottom sheet" en móvil (<900px) — se evalúa EN CADA
   apertura (nunca se cachea) para que un cambio de orientación/ventana
   entre dos aperturas se respete siempre. ---- */
const isMobileSheet = () => window.matchMedia('(max-width:899px)').matches;

let ratingScrimEl = null; // único <div class="rating-scrim"> reutilizado, creado bajo demanda en <body>
function getRatingScrim(){
  if(!ratingScrimEl){
    ratingScrimEl = document.createElement('div');
    ratingScrimEl.className = 'rating-scrim';
    ratingScrimEl.hidden = true;
    ratingScrimEl.setAttribute('aria-hidden','true');
    document.body.appendChild(ratingScrimEl);
  }
  return ratingScrimEl;
}

function openPopover(ctx){
  if(activeRatingCtx && activeRatingCtx !== ctx) closePopover(activeRatingCtx,{restoreFocus:false});

  const sheetMode = isMobileSheet(); // evaluado aquí, en cada apertura
  ctx.popoverEl.classList.remove('rating__popover--up'); // reset antes de medir
  ctx.popoverEl.classList.toggle('rating__popover--sheet', sheetMode);
  ctx.popoverEl.hidden = false;

  if(sheetMode){
    // <900px: bottom sheet — SIN medición/reposición up-down; scrim propio
    // + bloqueo de scroll del body.
    const scrim = getRatingScrim();
    scrim.hidden = false;
    scrim.onclick = function(){ closePopover(ctx,{restoreFocus:false}); };
    requestAnimationFrame(function(){ scrim.classList.add('is-open'); });
    document.body.classList.add('sheet-open');
  } else {
    // ≥900px: popover anclado con medición up/down.
    const trigRect = ctx.triggerEl.getBoundingClientRect();
    const popRect  = ctx.popoverEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - trigRect.bottom;
    if(spaceBelow < popRect.height + 12){
      ctx.popoverEl.classList.add('rating__popover--up'); // no cabe debajo → abre hacia arriba
    }
  }

  ctx.triggerEl.setAttribute('aria-expanded','true');
  setActiveOption(ctx, currentSelectedIndex(ctx));
  requestAnimationFrame(function(){ ctx.popoverEl.classList.add('is-open'); });
  ctx.popoverEl.focus({preventScroll:true});

  ctx.onOutside = function(e){ if(!ctx.wrapperEl.contains(e.target)) closePopover(ctx,{restoreFocus:false}); };
  document.addEventListener('pointerdown', ctx.onOutside);
  activeRatingCtx = ctx;
}

function closePopover(ctx, opts){
  if(ctx.popoverEl.hidden) return; // ya cerrado: evita doble cierre (scrim + onOutside)
  const restoreFocus = opts && ('restoreFocus' in opts) ? opts.restoreFocus : true;
  ctx.popoverEl.classList.remove('is-open');
  ctx.popoverEl.hidden = true;
  ctx.popoverEl.classList.remove('rating__popover--sheet');
  ctx.triggerEl.setAttribute('aria-expanded','false');
  if(ctx.onOutside){ document.removeEventListener('pointerdown', ctx.onOutside); ctx.onOutside = null; }
  if(activeRatingCtx === ctx) activeRatingCtx = null;

  // Limpieza del sheet SIEMPRE que exista (scrim + bloqueo de scroll),
  // sin depender del ancho actual: si el viewport cruzó el breakpoint
  // con el sheet abierto, igual queda todo recogido.
  if(ratingScrimEl){
    ratingScrimEl.classList.remove('is-open');
    ratingScrimEl.hidden = true;
    ratingScrimEl.onclick = null;
  }
  document.body.classList.remove('sheet-open');

  if(restoreFocus) ctx.triggerEl.focus();
}

function commitOption(ctx,idx){
  const optEl  = ctx.optionEls[idx];
  const rawVal = optEl.dataset.value;                              // '' o '0'..'10'
  const newVal = (rawVal === ctx.currentValue && rawVal !== '') ? '' : rawVal; // reelegir el mismo número = borrar

  setRating(ctx.it.t, newVal);           // función existente, sin cambios de firma
  ctx.currentValue = newVal;
  ctx.wrapperEl.dataset.rating = newVal;
  ctx.optionEls.forEach(function(o){ o.setAttribute('aria-selected', String(o.dataset.value === newVal)); });
  ctx.valueEl.textContent = newVal === '' ? '–' : newVal;
  ctx.triggerEl.setAttribute('aria-label', triggerAriaLabel(ctx.it.t, newVal));

  closePopover(ctx,{restoreFocus:true});
}

function wireRatingEvents(ctx){
  ctx.wrapperEl.addEventListener('click', function(e){ e.stopPropagation(); }); // defensivo

  ctx.triggerEl.addEventListener('click', function(){
    ctx.popoverEl.hidden ? openPopover(ctx) : closePopover(ctx,{restoreFocus:false});
  });
  ctx.triggerEl.addEventListener('keydown', function(e){
    if(['ArrowDown','ArrowUp','Enter',' '].indexOf(e.key)!==-1 && ctx.popoverEl.hidden){
      e.preventDefault(); openPopover(ctx);
    }
  });

  ctx.optionEls.forEach(function(optEl,idx){
    optEl.addEventListener('pointerenter', function(){ setActiveOption(ctx, idx); }); // preview visual, no confirma
    optEl.addEventListener('click', function(){ commitOption(ctx, idx); });           // un toque = confirma y cierra
  });

  ctx.popoverEl.addEventListener('keydown', function(e){
    // Salto vertical según layout real: sheet móvil = rejilla de 4
    // columnas; popover escritorio = fila única (↑↓ equivalen a ±1).
    const COLS = ctx.popoverEl.classList.contains('rating__popover--sheet') ? 4 : 1;
    const last = ctx.optionEls.length - 1;
    switch(e.key){
      case 'ArrowRight': e.preventDefault(); setActiveOption(ctx, ctx.activeIndex + 1); break;
      case 'ArrowLeft':  e.preventDefault(); setActiveOption(ctx, ctx.activeIndex - 1); break;
      case 'ArrowDown':  e.preventDefault(); setActiveOption(ctx, ctx.activeIndex + COLS); break;
      case 'ArrowUp':    e.preventDefault(); setActiveOption(ctx, ctx.activeIndex - COLS); break;
      case 'Home':       e.preventDefault(); setActiveOption(ctx, 0); break;
      case 'End':        e.preventDefault(); setActiveOption(ctx, last); break;
      case 'Enter':
      case ' ':          e.preventDefault(); commitOption(ctx, ctx.activeIndex); break;
      case 'Escape':     e.preventDefault(); closePopover(ctx,{restoreFocus:true}); break;
      case 'Tab':
        if(ctx.popoverEl.classList.contains('rating__popover--sheet')){
          e.preventDefault(); // modo sheet: atrapa el foco dentro — no hay más focables que el propio popover
        } else {
          closePopover(ctx,{restoreFocus:false}); // escritorio: el tab sigue su curso normal
        }
        break;
    }
  });
}

function buildRatingControl(it){
  const seq = ratingSeq++;
  const currentValue = ratings[it.t] != null ? String(ratings[it.t]) : '';

  const wrapperEl = document.createElement('div');
  wrapperEl.className = 'rating';
  wrapperEl.dataset.rating = currentValue;
  wrapperEl.dataset.key = it.t;

  const triggerEl = document.createElement('button');
  triggerEl.type = 'button';
  triggerEl.className = 'rating__trigger';
  triggerEl.id = 'rating-trigger-'+seq;
  triggerEl.setAttribute('aria-haspopup','listbox');
  triggerEl.setAttribute('aria-expanded','false');
  triggerEl.setAttribute('aria-controls','rating-listbox-'+seq);

  const starWrap = document.createElement('span');
  starWrap.innerHTML = '<svg class="rating__star" viewBox="0 0 24 24" width="11" height="11" aria-hidden="true" focusable="false">'+STAR_ICON+'</svg>';

  const valueEl = document.createElement('span');
  valueEl.className = 'rating__value';
  valueEl.textContent = currentValue === '' ? '–' : currentValue;

  const chevronWrap = document.createElement('span');
  chevronWrap.innerHTML = '<svg class="rating__chevron" viewBox="0 0 24 24" width="9" height="9" aria-hidden="true" focusable="false">'+CHEVRON_ICON+'</svg>';

  triggerEl.append(starWrap.firstElementChild, valueEl, chevronWrap.firstElementChild);
  triggerEl.setAttribute('aria-label', triggerAriaLabel(it.t, currentValue));

  const popoverEl = document.createElement('div');
  popoverEl.className = 'rating__popover';
  popoverEl.setAttribute('role','listbox');
  popoverEl.id = 'rating-listbox-'+seq;
  popoverEl.tabIndex = -1;
  popoverEl.setAttribute('aria-label','Nota para «'+it.t+'», de 0 a 10');
  popoverEl.setAttribute('aria-activedescendant','');
  popoverEl.hidden = true;

  // Cabecera contextual (decorativa para AT: el listbox ya lleva aria-label)
  const headEl = document.createElement('div');
  headEl.className = 'rating__head';
  headEl.setAttribute('aria-hidden','true');
  headEl.innerHTML = '<span class="rating__head-label">Tu nota</span>';
  const headTitle = document.createElement('span');
  headTitle.className = 'rating__head-title';
  headTitle.textContent = it.t;
  headEl.appendChild(headTitle);

  const gridEl = document.createElement('div');
  gridEl.className = 'rating__grid';

  const optionEls = [];
  const clearEl = document.createElement('div');
  clearEl.className = 'rating__option rating__option--clear';
  clearEl.setAttribute('role','option');
  clearEl.id = 'rating-opt-'+seq+'-clear';
  clearEl.dataset.value = '';
  clearEl.innerHTML = '<span aria-hidden="true">–</span> Sin nota';
  gridEl.appendChild(clearEl); optionEls.push(clearEl);

  for(let n=0;n<=10;n++){
    const optEl=document.createElement('div');
    optEl.className='rating__option';
    optEl.setAttribute('role','option');
    optEl.id='rating-opt-'+seq+'-'+n;
    optEl.dataset.value=String(n);
    optEl.textContent=String(n);
    gridEl.appendChild(optEl); optionEls.push(optEl);
  }
  optionEls.forEach(function(o){ o.setAttribute('aria-selected', String(o.dataset.value === currentValue)); });

  popoverEl.append(headEl, gridEl);
  wrapperEl.append(triggerEl, popoverEl);

  const ctx = { it:it, seq:seq, wrapperEl:wrapperEl, triggerEl:triggerEl, valueEl:valueEl, popoverEl:popoverEl, optionEls:optionEls, currentValue:currentValue, activeIndex:0, onOutside:null };
  wireRatingEvents(ctx);
  return wrapperEl;
}

/* ============ CHECKLIST ============ */
function buildItemRow(it){
  const isDone=!!state[it.t];
  const row=document.createElement('div');
  row.className='item type-'+it.type+(isDone?' done':'');
  row.style.setProperty('--type-tint','var(--'+it.type+'-tint)');
  row.style.setProperty('--type-border','var(--'+it.type+')');

  const poster=buildPosterEl(it);
  const check=document.createElement('div');
  check.className='check';
  check.setAttribute('role','checkbox');
  check.setAttribute('aria-checked',String(isDone));
  check.setAttribute('tabindex','0');
  check.title='Marcar como vista';
  check.innerHTML=TICK;
  poster.appendChild(check);

  const meta=document.createElement('div');
  meta.className='meta';
  meta.title='Buscar en Google';
  const titleEl=document.createElement('div'); titleEl.className='title'; titleEl.textContent=it.t;
  const dateEl=document.createElement('div'); dateEl.className='date'; dateEl.textContent=it.d;
  meta.append(titleEl,dateEl);

  const tag=document.createElement('span');
  tag.className='tag '+it.type;
  tag.textContent=typeLabel(it.type);

  row.append(poster,meta);
  const durEl=buildDurationEl(it);
  if(durEl) row.append(durEl);
  row.append(tag,buildRatingControl(it));

  const toggle=()=>toggleItem(it.t);
  check.addEventListener('click',(e)=>{ e.stopPropagation(); toggle(); });
  check.addEventListener('keydown',(e)=>{ if(e.key===' '||e.key==='Enter'){ e.preventDefault(); toggle(); } });
  meta.addEventListener('click',()=>window.open(googleUrl(it),'_blank','noopener'));

  itemRefs.set(it.t,{row,check});
  return row;
}

function buildPhase(ph){
  const sec=document.createElement('div');
  sec.className='phase';
  sec.id=slugifyPhase(ph.phase); // ancla del salto rápido (#fase-1…)

  const head=document.createElement('div');
  head.className='phase-head';
  const h2=document.createElement('h2'); h2.textContent=ph.phase;
  const years=document.createElement('span'); years.className='years'; years.textContent=ph.years;
  const pctEl=document.createElement('span'); pctEl.className='phase-pct'; pctEl.textContent='0%';
  const countEl=document.createElement('span'); countEl.className='count';
  const countB=document.createElement('b'); countB.textContent='0';
  countEl.append(countB,document.createTextNode(' / '+ph.items.length));
  head.append(h2,years);
  const totalMin=ph.items.reduce(function(acc,i){ return acc+(i.m||0); },0);
  if(totalMin){
    const phDur=document.createElement('span');
    phDur.className='phase-duration';
    phDur.title='Metraje total de la fase';
    phDur.innerHTML=CLOCK;
    phDur.appendChild(document.createTextNode('≈ '+Math.round(totalMin/60)+' h'));
    head.append(phDur);
  }

  // Insignia "Completada" (visible vía CSS cuando la fase llega al 100%)
  const doneChip=document.createElement('span');
  doneChip.className='phase-complete';
  doneChip.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="4 12 10 18 20 6"/></svg>Completada';
  head.append(doneChip);

  // Marcar/quitar la fase entera de una vez (toggle reversible, sin confirm)
  const markBtn=document.createElement('button');
  markBtn.type='button';
  markBtn.className='phase-mark';
  markBtn.textContent='Marcar todo';
  markBtn.setAttribute('aria-label','Marcar o quitar todos los títulos de '+ph.phase);
  markBtn.addEventListener('click',function(){
    const allSeen=ph.items.every(function(it){ return !!state[it.t]; });
    ph.items.forEach(function(it){ state[it.t]=!allSeen; });
    save();
    ph.items.forEach(function(it){ updateItemUI(it.t); });
    updatePhaseUI(ph.phase);
    updateGlobalUI();
    applyFilters();
  });

  head.append(pctEl,countEl,markBtn);

  const track=document.createElement('div'); track.className='phase-progress-track';
  const fill=document.createElement('div'); fill.className='phase-progress-fill'; fill.style.width='0%';
  track.appendChild(fill);

  const grid=document.createElement('div'); grid.className='grid';
  ph.items.forEach(it=>grid.appendChild(buildItemRow(it)));

  sec.append(head,track,grid);
  phaseRefs.set(ph.phase,{items:ph.items,totalPh:ph.items.length,pctEl,countEl:countB,fillEl:fill,sec:sec,markBtn:markBtn});
  return sec;
}

function buildChecklist(){
  const list=document.getElementById('checklistList');
  list.innerHTML='';
  itemRefs.clear();
  phaseRefs.clear();
  DATA.forEach(ph=>list.appendChild(buildPhase(ph)));
}

/* ============ SAGA X-MEN (pestaña "X-Men") ============
   Reutiliza buildPhase/buildItemRow: mismas filas con tick, duración,
   tag y nota. Debe ejecutarse DESPUÉS de buildChecklist, que limpia
   itemRefs/phaseRefs. */
function buildXmen(){
  const cont=document.getElementById('xmenList');
  cont.innerHTML='';
  XMEN_DATA.forEach(ph=>cont.appendChild(buildPhase(ph)));
}

/* ============ RESÚMENES + PLATAFORMA: "estantería" de pósters ============
   Rediseño 2026-07-23: cada título es una tarjeta-póster (.media-card)
   donde TODA la tarjeta es un único <a> (mejor táctil y accesible que
   la fila anterior con CTA aparte). kind = 'youtube' (Resúmenes) o
   'google' (Plataforma); cambia URL, chip e iconografía por CSS. */
const PLAY_ICON='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const SEARCH_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3" stroke-linecap="round"/></svg>';

function buildMediaCard(it, kind){
  const isYt = kind==='youtube';
  const url  = isYt ? youtubeUrl(it) : whereToWatchUrl(it);

  const card=document.createElement('a');
  card.className='media-card media-card--'+kind+(state[it.t]?' is-done':'');
  card.href=url;
  card.target='_blank';
  card.rel='noopener';
  card.style.setProperty('--type-tint','var(--'+it.type+'-tint)');
  card.setAttribute('aria-label', isYt
    ? 'Ver resumen de «'+it.t+'» en YouTube'
    : 'Buscar dónde ver «'+it.t+'» en España');

  const art=document.createElement('span');
  art.className='media-card__art';
  const src=posterOf(it);
  if(src){
    const img=document.createElement('img');
    img.src=src;
    img.alt='';
    img.loading='lazy';
    img.decoding='async';
    img.onerror=function(){ this.remove(); }; // queda el tinte de tipo como fondo
    art.appendChild(img);
  }

  // Velo de hover/focus con el icono grande de la acción
  const veil=document.createElement('span');
  veil.className='media-card__veil';
  veil.innerHTML=isYt?PLAY_ICON:SEARCH_ICON;
  art.appendChild(veil);

  // Insignia "visto" (se sincroniza en updateItemUI vía mediaRefs)
  const seen=document.createElement('span');
  seen.className='media-card__seen';
  seen.title='Ya vista';
  seen.innerHTML=TICK;
  art.appendChild(seen);

  // Tu nota, si existe (se sincroniza en syncMediaRating vía setRating)
  if(ratings[it.t]!=null){
    const notaEl=document.createElement('span');
    notaEl.className='media-card__nota';
    notaEl.title='Tu nota';
    notaEl.textContent='★ '+ratings[it.t];
    art.appendChild(notaEl);
  }

  const body=document.createElement('span');
  body.className='media-card__body';
  const titleEl=document.createElement('span'); titleEl.className='media-card__title'; titleEl.textContent=it.t;
  const metaEl=document.createElement('span'); metaEl.className='media-card__meta';
  metaEl.textContent=it.d+' · '+typeLabel(it.type);
  body.append(titleEl,metaEl);

  const chip=document.createElement('span');
  chip.className='media-card__chip';
  chip.innerHTML=(isYt?PLAY_ICON:SEARCH_ICON)+'<span>'+(isYt?'Resumen':'Dónde verla')+'</span>';

  card.append(art,body,chip);

  const list = mediaRefs.get(it.t) || [];
  list.push(card);
  mediaRefs.set(it.t, list);
  return card;
}

function buildMediaShelf(containerId, kind){
  const cont=document.getElementById(containerId);
  cont.innerHTML='';
  const firstXmenTitle=XMEN_DATA[0].items[0].t;
  TRACKED_ITEMS.forEach((it,idx)=>{
    if(idx===0){
      const divTop=document.createElement('div');
      divTop.className='list-divider';
      divTop.textContent='Universo Marvel';
      cont.appendChild(divTop);
    }
    if(it.t===firstXmenTitle){
      const divXmen=document.createElement('div');
      divXmen.className='list-divider';
      divXmen.textContent='Saga X-Men';
      cont.appendChild(divXmen);
    }
    cont.appendChild(buildMediaCard(it,kind));
  });
}

/* Refleja (o retira) la insignia "★ nota" en las tarjetas de ambas
   estanterías. La llama setRating() en cada cambio; en reconstrucciones
   completas la insignia la pinta directamente buildMediaCard. */
function syncMediaRating(t){
  const cards=mediaRefs.get(t);
  if(!cards) return;
  const val=ratings[t];
  cards.forEach(function(card){
    let badge=card.querySelector('.media-card__nota');
    if(val==null){ if(badge) badge.remove(); return; }
    if(!badge){
      badge=document.createElement('span');
      badge.className='media-card__nota';
      badge.title='Tu nota';
      const art=card.querySelector('.media-card__art');
      if(art) art.appendChild(badge);
    }
    badge.textContent='★ '+val;
  });
}

function buildResumenes(){
  mediaRefs.clear(); // primera de las dos estanterías: resetea las refs de ambas
  buildMediaShelf('resumenesList','youtube');
}

function buildPlataforma(){
  buildMediaShelf('plataformaList','google');
}

/* ============ ACTUALIZACIONES PUNTUALES (sin reconstruir el DOM) ============ */
function updateItemUI(t){
  const isDone=!!state[t];
  const ref=itemRefs.get(t);
  if(ref){
    ref.row.classList.toggle('done',isDone);
    ref.check.setAttribute('aria-checked',String(isDone));
  }
  const cards=mediaRefs.get(t);
  if(cards) cards.forEach(c=>c.classList.toggle('is-done',isDone));
}

function updatePhaseUI(phaseName){
  const ref=phaseRefs.get(phaseName);
  if(!ref) return;
  const seen=ref.items.filter(i=>state[i.t]).length;
  const pct= ref.totalPh ? Math.round(seen/ref.totalPh*100) : 0;
  ref.pctEl.textContent=pct+'%';
  ref.countEl.textContent=String(seen);
  ref.fillEl.style.width=pct+'%';
  const complete = ref.totalPh>0 && seen===ref.totalPh;
  if(ref.sec) ref.sec.classList.toggle('is-complete',complete);
  if(ref.markBtn) ref.markBtn.textContent = complete ? 'Quitar todo' : 'Marcar todo';
}

const RING_CIRCUMFERENCE=125.7;
function updateGlobalUI(){
  const total=TRACKED_ITEMS.length;
  const done=TRACKED_ITEMS.filter(it=>state[it.t]).length;
  const left=total-done;
  const pct= total ? Math.round(done/total*100) : 0;

  document.getElementById('statDone').textContent=done;
  document.getElementById('statLeft').textContent=left;
  document.getElementById('statTotal').textContent=total;
  document.getElementById('pctLabel').textContent=pct+'% completado';
  document.getElementById('miniFill').style.width=pct+'%';

  document.getElementById('heroPct').textContent=pct+'%';
  document.getElementById('heroCount').textContent=done+' / '+total+' títulos';
  const ring=document.getElementById('heroRingProgress');
  if(ring) ring.style.strokeDashoffset=String(RING_CIRCUMFERENCE*(1-pct/100));

  // Tira de tiempo: horas de metraje vistas vs. restantes
  const minTotal=TRACKED_ITEMS.reduce(function(a,it){ return a+(it.m||0); },0);
  const minSeen=TRACKED_ITEMS.reduce(function(a,it){ return a+(state[it.t]?(it.m||0):0); },0);
  const timeSeenEl=document.getElementById('timeSeen');
  const timeLeftEl=document.getElementById('timeLeft');
  const timeFillEl=document.getElementById('timeFill');
  if(timeSeenEl&&timeLeftEl&&timeFillEl){
    timeSeenEl.textContent='≈ '+Math.round(minSeen/60)+' h vistas';
    timeLeftEl.textContent= left===0 ? 'multiverso completo' : 'quedan ≈ '+Math.round((minTotal-minSeen)/60)+' h';
    timeFillEl.style.width=(minTotal?Math.round(minSeen/minTotal*100):0)+'%';
  }

  // CTA del hero según el estado de la maratón
  const heroCtaEl=document.getElementById('heroCta');
  if(heroCtaEl){
    heroCtaEl.textContent = left===0 ? 'Multiverso completado' : (done>0 ? 'Continuar maratón' : 'Empezar recorrido');
  }
}

function refreshAllUI(){
  ALL_PHASES.forEach(ph=>{
    ph.items.forEach(it=>updateItemUI(it.t));
    updatePhaseUI(ph.phase);
  });
  updateGlobalUI();
  applyFilters(); // p. ej. tras importar/restablecer, el filtro de estado sigue siendo coherente
}

function toggleItem(t){
  state[t]=!state[t];
  save();
  updateItemUI(t);
  const ref=itemRefs.get(t);
  if(ref){
    // Micro-pop del tick SOLO en interacción directa (nunca al cargar
    // ni al usar "Marcar todo", que sería una lluvia de 15 animaciones)
    ref.row.classList.remove('pop');
    void ref.row.offsetWidth; // reinicia la animación si se pulsa dos veces seguidas
    ref.row.classList.add('pop');
    setTimeout(function(){ ref.row.classList.remove('pop'); },500);
  }
  updatePhaseUI(titleToPhase.get(t));
  updateGlobalUI();
  applyFilters(); // con el filtro "Pendientes"/"Vistos" activo, la fila cambia de lista al marcarla
}

/* ============ FILTROS DEL CHECKLIST (solo visuales) ============
   Ocultan filas (.is-filtered-out) y fases vacías sin tocar state,
   ratings ni los contadores de progreso. Solo afectan a las fases de
   DATA (la pestaña X-Men, con 19 items, no lleva filtros). */
const filterState={q:'',type:'all',estado:'all',rating:'all'};

function normalizeText(s){
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

function applyFilters(){
  const q=normalizeText(filterState.q.trim());
  let anyVisible=false;
  DATA.forEach(function(ph){
    let visible=0;
    ph.items.forEach(function(it){
      const ref=itemRefs.get(it.t);
      if(!ref) return;
      const matchQ=!q || normalizeText(it.t).indexOf(q)!==-1;
      const matchT=filterState.type==='all' || it.type===filterState.type;
      const isSeen=!!state[it.t];
      const matchE=filterState.estado==='all' || (filterState.estado==='visto' ? isSeen : !isSeen);
      const currentRating=ratings[it.t];
      const hasRating=currentRating!==undefined && currentRating!==null && currentRating!=='';
      const matchR=filterState.rating==='all'
        || (filterState.rating==='rated' && hasRating)
        || (filterState.rating==='unrated' && !hasRating)
        || (!isNaN(Number(filterState.rating)) && hasRating && Number(currentRating)>=Number(filterState.rating));
      const show=matchQ&&matchT&&matchE&&matchR;
      ref.row.classList.toggle('is-filtered-out',!show);
      if(show) visible++;
    });
    const pref=phaseRefs.get(ph.phase);
    if(pref&&pref.sec) pref.sec.classList.toggle('is-filtered-out',visible===0);
    if(visible>0) anyVisible=true;
  });
  const emptyEl=document.getElementById('filterEmpty');
  if(emptyEl) emptyEl.hidden=anyVisible;
}

function setupFilters(){
  const input=document.getElementById('filterSearch');
  const bar=document.querySelector('.filterbar');
  if(!input||!bar) return;
  input.addEventListener('input',function(){
    filterState.q=input.value;
    applyFilters();
  });
  const ratingSelect=document.getElementById('filterRating');
  if(ratingSelect){
    ratingSelect.addEventListener('change',function(){
      filterState.rating=ratingSelect.value;
      applyFilters();
    });
  }
  bar.querySelectorAll('.fchip').forEach(function(chip){
    chip.addEventListener('click',function(){
      if(chip.dataset.ftype!==undefined){ filterState.type=chip.dataset.ftype; }
      else{ filterState.estado=chip.dataset.festado; }
      chip.parentElement.querySelectorAll('.fchip').forEach(function(s){
        const active=s===chip;
        s.classList.toggle('active',active);
        s.setAttribute('aria-pressed',String(active));
      });
      applyFilters();
    });
  });
}

/* ============ FIRESTORE: cargar un perfil remoto sin perder el modo local ============ */
function setupCloudSync(){
  window.addEventListener('mcu-cloud-load',function(event){
    const data=event.detail||{};
    if(!Array.isArray(data.seen) || !data.ratings || typeof data.ratings!=='object') return;
    state={};
    data.seen.forEach(function(t){ if(typeof t==='string') state[t]=true; });
    ratings={};
    Object.keys(data.ratings).forEach(function(t){
      const n=Number(data.ratings[t]);
      if(Number.isFinite(n) && n>=0 && n<=10) ratings[t]=Math.round(n);
    });
    localStorage.setItem(KEY,JSON.stringify(state));
    localStorage.setItem(RATINGS_KEY,JSON.stringify(ratings));
    buildChecklist();
    buildXmen();
    buildResumenes();
    buildPlataforma();
    refreshAllUI();
  });
}

/* ============ SALTO RÁPIDO DE FASES (checklist) ============ */
function slugifyPhase(name){
  return 'fase-'+normalizeText(name).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function buildPhaseJump(){
  const nav=document.getElementById('phaseJump');
  if(!nav) return;
  nav.innerHTML='';
  DATA.forEach(function(ph){
    const a=document.createElement('a');
    a.className='fchip';
    a.href='#'+slugifyPhase(ph.phase);
    a.textContent=ph.phase;
    nav.appendChild(a);
  });
}

/* ============ FILTRO DE ESTADO EN LAS ESTANTERÍAS ============
   Puramente CSS-driven: el chip activo fija data-mfilter en la
   .media-grid del panel y las reglas ocultan .media-card según
   .is-done (que updateItemUI mantiene al día). */
function setupShelfFilters(){
  document.querySelectorAll('.shelf-filter').forEach(function(group){
    const panel=group.closest('.tab-panel');
    const grid=panel?panel.querySelector('.media-grid'):null;
    if(!grid) return;
    group.querySelectorAll('.fchip').forEach(function(chip){
      chip.addEventListener('click',function(){
        grid.dataset.mfilter=chip.dataset.mfilter;
        group.querySelectorAll('.fchip').forEach(function(s){
          const active=s===chip;
          s.classList.toggle('active',active);
          s.setAttribute('aria-pressed',String(active));
        });
      });
    });
  });
}

/* ============ «CONTINUAR MARATÓN»: salta al primer pendiente ============ */
function setupContinue(){
  const btn=document.getElementById('heroContinue');
  if(!btn) return;
  const XMEN_PHASE=XMEN_DATA[0].phase;
  btn.addEventListener('click',function(e){
    const next=TRACKED_ITEMS.find(function(it){ return !state[it.t]; });
    if(!next) return; // todo visto: se queda la navegación normal a #checklist
    e.preventDefault();
    const tab = titleToPhase.get(next.t)===XMEN_PHASE ? 'xmen' : 'checklist';
    activateTab(tab);
    if(location.hash.slice(1)!==tab) location.hash=tab;
    const ref=itemRefs.get(next.t);
    if(!ref) return;
    const smooth=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
    setTimeout(function(){
      ref.row.scrollIntoView({behavior:smooth,block:'center'});
      ref.row.classList.add('is-flash');
      setTimeout(function(){ ref.row.classList.remove('is-flash'); },2400);
    },90);
  });
}

/* ============ BOTÓN VOLVER-ARRIBA ============ */
function setupToTop(){
  const btn=document.getElementById('toTop');
  if(!btn) return;
  let shown=false;
  window.addEventListener('scroll',function(){
    const show=window.scrollY>700;
    if(show!==shown){ shown=show; btn.classList.toggle('is-show',show); }
  },{passive:true});
  btn.addEventListener('click',function(){
    const smooth=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
    window.scrollTo({top:0,behavior:smooth});
  });
}

/* ============ HERO: imagen de fondo vía custom property ============
   La URL se convierte a ABSOLUTA antes de meterla en --hero-img: una
   url() relativa dentro de una custom property se resuelve contra la
   hoja de estilos que la consume (css/styles.css), no contra el
   documento, y apuntaría a css/assets/... (inexistente). Este era el
   motivo de que el hero saliera sin fotografía. */
function setupHeroBg(){
  const media=document.getElementById('heroMedia');
  if(media && typeof HERO_LOCAL!=='undefined' && HERO_LOCAL){
    const abs=new URL(HERO_LOCAL, document.baseURI).href;
    media.style.setProperty('--hero-img','url("'+abs+'")');
  }
}

/* Pared ambiental con posters locales: decorativa, no altera el contenido
   ni las referencias de títulos que usa el tracker. */
function setupPosterWall(){
  const wall=document.getElementById('posterWall');
  if(!wall || typeof POSTERS_LOCAL==='undefined') return;
  const titles=[
    'Iron Man','Los Vengadores','Iron Man 3','Thor: Ragnarok',
    'Black Panther','Vengadores: Infinity War','Vengadores: Endgame',
    'WandaVision','Loki (Temporada 1)','Doctor Strange',
    'Guardianes de la Galaxia','Spider-Man: No Way Home','Deadpool',
    'Logan','X-Men','X-Men \'97','Agatha All Along','The Marvels',
    'Moon Knight','Ironheart','Thunderbolts*','Daredevil: Born Again (Temporada 1)',
    'Capitana Marvel','Guardianes de la Galaxia Vol. 3'
  ];
  titles.forEach(function(title,idx){
    const src=POSTERS_LOCAL[title];
    if(!src) return;
    const img=document.createElement('img');
    img.src=src;
    img.alt='';
    img.loading='lazy';
    img.decoding='async';
    img.style.transform='translateY('+(idx%3*7)+'px)';
    img.addEventListener('error',function(){ img.remove(); });
    wall.appendChild(img);
  });
}

/* ============ SINCRONIZAR: exportar/importar progreso sin servidor ============
   El código es SYNC_PREFIX + base64 de JSON {v:1, seen:[títulos vistos],
   ratings:{título:nota}}. base64 vía unescape/encodeURIComponent para
   soportar los acentos de los títulos (btoa solo acepta Latin-1).
   Importar SUSTITUYE (no fusiona) el progreso local, previa confirmación,
   y reconstruye la UI respetando el orden de contratos (CLAUDE.md):
   buildChecklist → buildXmen → buildResumenes → buildPlataforma. */
const SYNC_PREFIX='MCU1.';

function exportCode(){
  const seen=Object.keys(state).filter(function(t){ return state[t]; });
  const payload={v:1,seen:seen,ratings:ratings};
  return SYNC_PREFIX+btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function parseImportCode(raw){
  const txt=(raw||'').trim();
  if(!txt) return {error:'Pega un código primero.'};
  if(txt.indexOf(SYNC_PREFIX)!==0) return {error:'Esto no parece un código del tracker (debe empezar por '+SYNC_PREFIX+').'};
  try{
    const json=decodeURIComponent(escape(atob(txt.slice(SYNC_PREFIX.length))));
    const data=JSON.parse(json);
    const ratingsOk = data && typeof data.ratings==='object' && data.ratings!==null && !Array.isArray(data.ratings);
    if(!data || data.v!==1 || !Array.isArray(data.seen) || !ratingsOk){
      return {error:'El código está incompleto o dañado.'};
    }
    return {data:data};
  }catch(e){
    return {error:'No se pudo leer el código. Comprueba que esté copiado entero, sin cortes.'};
  }
}

function applyImport(data){
  state={};
  data.seen.forEach(function(t){ if(typeof t==='string') state[t]=true; });
  ratings={};
  Object.keys(data.ratings).forEach(function(t){
    const n=Number(data.ratings[t]);
    if(Number.isFinite(n) && n>=0 && n<=10) ratings[t]=Math.round(n);
  });
  save();
  saveRatings();
  buildChecklist();
  buildXmen();
  buildResumenes();
  buildPlataforma();
  refreshAllUI();
}

function setupSync(){
  const openBtn=document.getElementById('syncBtn');
  const modal=document.getElementById('syncModal');
  const scrim=document.getElementById('syncScrim');
  if(!openBtn||!modal||!scrim) return;
  const exportTa=document.getElementById('syncExport');
  const importTa=document.getElementById('syncImport');
  const copyBtn=document.getElementById('syncCopy');
  const applyBtn=document.getElementById('syncApply');
  const closeBtn=document.getElementById('syncClose');
  const msgEl=document.getElementById('syncMsg');

  function setMsg(text,ok){
    msgEl.textContent=text||'';
    msgEl.classList.toggle('is-ok',!!ok);
  }
  function openModal(){
    exportTa.value=exportCode(); // siempre fresco: refleja el estado actual
    importTa.value='';
    setMsg('');
    modal.hidden=false; scrim.hidden=false;
    requestAnimationFrame(function(){ modal.classList.add('is-open'); scrim.classList.add('is-open'); });
    document.body.classList.add('modal-open');
    exportTa.focus(); exportTa.select();
  }
  function closeModal(){
    modal.classList.remove('is-open'); scrim.classList.remove('is-open');
    modal.hidden=true; scrim.hidden=true;
    document.body.classList.remove('modal-open');
    openBtn.focus();
  }

  openBtn.addEventListener('click',openModal);
  closeBtn.addEventListener('click',closeModal);
  scrim.addEventListener('click',closeModal);
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape' && !modal.hidden) closeModal();
  });

  copyBtn.addEventListener('click',function(){
    exportTa.focus();
    exportTa.select();
    exportTa.setSelectionRange(0, exportTa.value.length);
    const done=function(){ setMsg('Código copiado. Pégalo en «Sincronizar» del otro dispositivo.',true); };
    // navigator.clipboard puede no estar disponible en file:// — fallback a execCommand sobre la selección
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(exportTa.value).then(done,function(){ document.execCommand('copy'); done(); });
    }else{
      document.execCommand('copy'); done();
    }
  });

  applyBtn.addEventListener('click',function(){
    const res=parseImportCode(importTa.value);
    if(res.error){ setMsg(res.error,false); return; }
    if(!confirm('Esto sustituirá el progreso y las notas guardados en este dispositivo por los del código. ¿Continuar?')) return;
    applyImport(res.data);
    const seenCount=Object.keys(state).length;
    const ratingCount=Object.keys(ratings).length;
    setMsg('Importado: '+seenCount+' títulos vistos y '+ratingCount+' notas.',true);
    exportTa.value=exportCode();
  });
}

/* ============ TABS: routing por hash + teclado (patrón ARIA tabs) ============ */
const TAB_IDS=['checklist','xmen','resumenes','plataforma'];

function tabNameFromHash(){
  const h=(location.hash||'').slice(1).trim().toLowerCase();
  return TAB_IDS.indexOf(h)!==-1 ? h : 'checklist';
}

function activateTab(name){
  if(TAB_IDS.indexOf(name)===-1) name='checklist';
  TAB_IDS.forEach(id=>{
    const btn=document.getElementById('tab-'+id);
    const panel=document.getElementById('panel-'+id);
    if(!btn||!panel) return;
    const active = id===name;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-selected',String(active));
    btn.tabIndex = active?0:-1;
    panel.classList.toggle('active',active);
    panel.hidden = !active;
  });
}

function setupTabs(){
  const tablist=document.querySelector('.tabs-inner');
  if(!tablist) return;
  const buttons=Array.prototype.slice.call(tablist.querySelectorAll('.tab'));

  buttons.forEach(btn=>{
    btn.addEventListener('click',()=>{
      const name=btn.dataset.tab;
      activateTab(name);
      if(location.hash.slice(1)!==name) location.hash=name;
    });
  });

  tablist.addEventListener('keydown',(e)=>{
    const nav={ArrowLeft:-1,ArrowRight:1};
    let idx=TAB_IDS.indexOf(tabNameFromHash());
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
      idx=(idx+nav[e.key]+TAB_IDS.length)%TAB_IDS.length;
    }else if(e.key==='Home'){
      idx=0;
    }else if(e.key==='End'){
      idx=TAB_IDS.length-1;
    }else{
      return;
    }
    e.preventDefault();
    const name=TAB_IDS[idx];
    activateTab(name);
    if(location.hash.slice(1)!==name) location.hash=name;
    const btn=document.getElementById('tab-'+name);
    if(btn) btn.focus();
  });

  window.addEventListener('hashchange',()=>activateTab(tabNameFromHash()));
  activateTab(tabNameFromHash());
}

/* ============ BOOTSTRAP ============ */
document.getElementById('resetBtn').addEventListener('click',()=>{
  if(confirm('¿Restablecer todo el progreso?')){
    state={};
    save();
    refreshAllUI();
  }
});

load();
loadRatings();
buildChecklist();
buildXmen();
buildResumenes();
buildPlataforma();
buildPhaseJump();
refreshAllUI();
setupHeroBg();
setupPosterWall();
setupTabs();
setupSync();
setupFilters();
setupShelfFilters();
setupContinue();
setupToTop();
setupCloudSync();

})();
