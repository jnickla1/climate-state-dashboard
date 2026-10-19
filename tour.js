// Opt-in guided tour for first-time visitors (19 Oct 2026).
// First visit: a small welcome card offers the tour; the choice is remembered in localStorage.
// The header "Tour" button replays it at any time. No external libraries.
(function () {
  'use strict';
  var STORE_KEY = 'climateStateTour';
  var steps = [
    { target: null, title: 'Welcome to the climate state dashboard',
      text: 'This page estimates the world’s long-term warming: the underlying level, not any single hot or cold year. It combines several estimation methods from Thorne et al. with 100 versions of the observed temperature record, so every number comes with an uncertainty range.' },
    { target: 'section.controls', title: 'Choose what to look at',
      text: '<b>Warming:</b> “Realized” is total long-term warming; “Anthropogenic” is the human-caused part. <b>Baseline:</b> warming relative to 1850–1900 (pre-industrial) or to 1981–2010. <b>Method:</b> the PIVW combination is the paper’s recommended blend of methods; you can also view each method on its own.' },
    { target: 'section.metrics > article:nth-of-type(1)', title: 'Current warming level',
      text: 'The estimated long-term warming in 2025. The 95% range gives the values the true level very likely lies between.' },
    { target: 'section.metrics > article:nth-of-type(2)', title: 'How fast it is rising',
      text: 'The current rate of long-term warming, in °C per decade, with its 95% range. “Explore rates over time” shows how this rate has changed historically.' },
    { target: 'article.likelihood-card', title: 'Has 1.5 °C already been passed?',
      text: 'The probability that long-term warming is already above 1.5 °C, described with the IPCC likelihood scale (for example, “very unlikely” means 0–10%).' },
    { target: '#warmingPlot', title: 'Warming levels and crossing times',
      text: 'Grey lines are the 100 versions of the observed temperature record. Blue marks when the 20-year average actually crossed 0.5 °C and 1.0 °C; red shows when the selected method placed each crossing. Hover for values, drag to zoom, and double-click to reset.' },
    { target: '#heatPlot', title: 'Exceedance probabilities',
      text: 'For each warming level and year, the green shading shows the probability that the level had been exceeded. Darker green means more certain.' },
    { target: 'article.density-card', title: 'When was each level crossed?',
      text: 'Bars show in which year the ensemble members first crossed each level; curves show the selected method’s own estimate. Turn on “Magnify 1.5°C panel” to see the small probabilities near 1.5 °C.' },
    { target: 'section.lower-grid', title: 'Data, references and more help',
      text: 'Download the data and figures behind every view, and follow the links to each method’s papers. “How to read this dashboard” at the bottom of the page explains the definitions and caveats. Replay this tour anytime with the <b>Tour</b> button at the top.' }
  ];

  function remember(value) { try { window.localStorage.setItem(STORE_KEY, value); } catch (e) { /* storage unavailable */ } }
  function remembered() { try { return window.localStorage.getItem(STORE_KEY); } catch (e) { return null; } }

  var index = 0, ring = null, pop = null, active = false, lastFocus = null;

  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }

  function visible(node) {
    if (!node) return false;
    var r = node.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && node.offsetParent !== null;
  }

  function closeAll(markDone) {
    active = false;
    if (ring) { ring.remove(); ring = null; }
    if (pop) { pop.remove(); pop = null; }
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', place);
    window.removeEventListener('scroll', place, true);
    if (markDone) remember('done');
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }

  function onKey(ev) {
    if (!active) return;
    if (ev.key === 'Escape') { ev.preventDefault(); closeAll(true); }
    else if (ev.key === 'ArrowRight') { ev.preventDefault(); go(index + 1); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); go(index - 1); }
  }

  function place() {
    if (!active || !pop) return;
    var step = steps[index];
    var target = step.target ? document.querySelector(step.target) : null;
    var mobile = window.innerWidth < 760;
    pop.classList.toggle('tour-sheet', mobile);
    if (!visible(target)) {
      ring.style.display = 'none';
      pop.classList.add('tour-center');
      pop.style.top = pop.style.left = '';
      return;
    }
    pop.classList.remove('tour-center');
    var r = target.getBoundingClientRect(), pad = 6;
    ring.style.display = 'block';
    ring.style.top = (r.top - pad) + 'px';
    ring.style.left = (r.left - pad) + 'px';
    ring.style.width = (r.width + 2 * pad) + 'px';
    ring.style.height = (r.height + 2 * pad) + 'px';
    if (mobile) { pop.style.top = pop.style.left = ''; return; }
    var pw = pop.offsetWidth, ph = pop.offsetHeight, vw = window.innerWidth, vh = window.innerHeight, gap = 14;
    var top;
    if (r.bottom + gap + ph <= vh - 8) top = r.bottom + gap;            // below the target
    else if (r.top - gap - ph >= 8) top = r.top - gap - ph;            // above the target
    else top = Math.max(8, vh - ph - 16);                              // tall target: bottom of the view
    var left = Math.min(Math.max(8, r.left + r.width / 2 - pw / 2), vw - pw - 8);
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
  }

  function go(i) {
    if (i < 0) return;
    if (i >= steps.length) { closeAll(true); return; }
    index = i;
    var step = steps[i];
    pop.querySelector('.tour-count').textContent = (i + 1) + ' of ' + steps.length;
    pop.querySelector('.tour-title').textContent = step.title;
    pop.querySelector('.tour-text').innerHTML = step.text;
    pop.querySelector('.tour-back').disabled = i === 0;
    pop.querySelector('.tour-next').textContent = i === steps.length - 1 ? 'Finish' : 'Next';
    var target = step.target ? document.querySelector(step.target) : null;
    if (visible(target)) {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(place, 420);
    }
    place();
    pop.querySelector('.tour-title').focus();
  }

  function start() {
    closeAll(false);
    var welcome = document.getElementById('tourWelcome');
    if (welcome) welcome.remove();
    // The tour describes the interactive view; switch back to it if the figure view is showing.
    var imageView = document.getElementById('imageView'), interactiveButton = document.getElementById('interactiveButton');
    if (imageView && !imageView.hidden && interactiveButton) interactiveButton.click();
    lastFocus = document.activeElement;
    active = true;
    ring = el('div', 'tour-ring'); ring.setAttribute('aria-hidden', 'true');
    pop = el('div', 'tour-pop');
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-labelledby', 'tourTitle');
    pop.innerHTML = '<p class="tour-count"></p><h2 class="tour-title" id="tourTitle" tabindex="-1"></h2><p class="tour-text"></p>' +
      '<div class="tour-actions"><button type="button" class="tour-skip">Skip tour</button><span>' +
      '<button type="button" class="tour-back">Back</button><button type="button" class="tour-next">Next</button></span></div>';
    document.body.appendChild(ring);
    document.body.appendChild(pop);
    pop.querySelector('.tour-skip').addEventListener('click', function () { closeAll(true); });
    pop.querySelector('.tour-back').addEventListener('click', function () { go(index - 1); });
    pop.querySelector('.tour-next').addEventListener('click', function () { go(index + 1); });
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    go(0);
  }

  function showWelcome() {
    var card = el('aside', 'tour-welcome');
    card.id = 'tourWelcome';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-labelledby', 'tourWelcomeTitle');
    card.innerHTML = '<h2 id="tourWelcomeTitle">New to this dashboard?</h2>' +
      '<p>A one-minute tour explains what each panel shows and how to read it.</p>' +
      '<div class="tour-actions"><button type="button" class="tour-no">No thanks</button>' +
      '<button type="button" class="tour-yes">Take the 1-minute tour</button></div>';
    document.body.appendChild(card);
    card.querySelector('.tour-no').addEventListener('click', function () { remember('dismissed'); card.remove(); });
    card.querySelector('.tour-yes').addEventListener('click', function () { start(); });
  }

  function addHeaderButton() {
    var paper = document.querySelector('header .paper-link');
    if (!paper || document.getElementById('tourButton')) return;
    var wrap = el('div', 'header-actions');
    paper.parentNode.insertBefore(wrap, paper);
    var button = el('button', 'paper-link tour-button', 'Tour');
    button.id = 'tourButton';
    button.type = 'button';
    button.setAttribute('aria-label', 'Start the guided tour of this dashboard');
    button.addEventListener('click', start);
    wrap.appendChild(button);
    wrap.appendChild(paper);
  }

  function init() {
    addHeaderButton();
    if (!remembered()) setTimeout(showWelcome, 900);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.climateStateTour = { start: start };
})();
