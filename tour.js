// Opt-in guided tour for first-time visitors (19 Oct 2026).
// First visit: a small welcome card offers the tour; the choice is remembered in localStorage.
// The header "Tour" button replays it at any time. No external libraries.
(function () {
  'use strict';
  var STORE_KEY = 'climateStateTour';
  // Step text lives in i18n/en-GB.json (tour.stepN.title / tour.stepN.text).
  var steps = [
    { target: null, key: 'tour.step1' },
    { target: 'section.controls', key: 'tour.step2' },
    { target: 'section.metrics > article:nth-of-type(1)', key: 'tour.step3' },
    { target: 'section.metrics > article:nth-of-type(2)', key: 'tour.step4' },
    { target: 'article.likelihood-card', key: 'tour.step5' },
    { target: '#warmingPlot', key: 'tour.step6' },
    { target: '#heatPlot', key: 'tour.step7' },
    { target: 'article.density-card', key: 'tour.step8' },
    { target: 'section.lower-grid', key: 'tour.step9' }
  ];
  function t(key, vars) { return window.I18N ? window.I18N.t(key, vars) : key; }

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
    pop.querySelector('.tour-count').textContent = t('tour.count', { i: i + 1, n: steps.length });
    pop.querySelector('.tour-title').textContent = t(step.key + '.title');
    pop.querySelector('.tour-text').innerHTML = t(step.key + '.text');
    pop.querySelector('.tour-back').disabled = i === 0;
    pop.querySelector('.tour-next').textContent = i === steps.length - 1 ? t('tour.finish') : t('tour.next');
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
      '<div class="tour-actions"><button type="button" class="tour-skip">' + t('tour.skip') + '</button><span>' +
      '<button type="button" class="tour-back">' + t('tour.back') + '</button><button type="button" class="tour-next">' + t('tour.next') + '</button></span></div>';
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
    card.innerHTML = '<h2 id="tourWelcomeTitle">' + t('tour.welcomeTitle') + '</h2>' +
      '<p>' + t('tour.welcomeText') + '</p>' +
      '<div class="tour-actions"><button type="button" class="tour-no">' + t('tour.welcomeNo') + '</button>' +
      '<button type="button" class="tour-yes">' + t('tour.welcomeYes') + '</button></div>';
    document.body.appendChild(card);
    card.querySelector('.tour-no').addEventListener('click', function () { remember('dismissed'); card.remove(); });
    card.querySelector('.tour-yes').addEventListener('click', function () { start(); });
  }

  function addHeaderButton() {
    var paper = document.querySelector('header .paper-link');
    if (!paper || document.getElementById('tourButton')) return;
    var wrap = paper.closest('.header-actions');
    if (!wrap) { wrap = el('div', 'header-actions'); paper.parentNode.insertBefore(wrap, paper); }
    var button = el('button', 'paper-link tour-button', t('tour.button'));
    button.id = 'tourButton';
    button.type = 'button';
    button.setAttribute('aria-label', t('tour.buttonAria'));
    button.addEventListener('click', start);
    wrap.appendChild(button);
    wrap.appendChild(paper);
  }

  function init() {
    addHeaderButton();
    if (!remembered()) setTimeout(showWelcome, 900);
  }

  // Wait for the chosen language before drawing any text.
  var whenReady = window.I18N ? window.I18N.ready : Promise.resolve();
  whenReady.then(function () {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  });
  window.climateStateTour = { start: start };
})();
