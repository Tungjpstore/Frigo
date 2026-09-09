// Run inside the managed Vite browser; see docs/ai/T06B_E2E.md.
import { plannerCopy } from '../../src/web/features/planner/copy.ts';
import { budgetStatusLabel } from '../../src/web/features/planner/presentation.ts';

const prefix = '/api/v1/meal-planning/plans';
const evidenceKey = 't06b-browser-evidence';
let keyboardTrigger;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const text = () => document.querySelector('main')?.textContent || '';
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function until(predicate, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await sleep(25);
  }
  throw new Error(`Timed out: ${message}`);
}
function button(label, root = document) {
  const found = [...root.querySelectorAll('button')].find((node) => node.textContent.trim() === label);
  assert(found && !found.disabled, `Enabled button: ${label}`);
  return found;
}
function activate(node) { node.scrollIntoView({ block: 'center' }); node.focus(); node.click(); }
function fill(node, value) {
  const prototype = node instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, value);
  node.dispatchEvent(new Event(node instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
}
async function link(selector) {
  const node = document.querySelector(selector);
  assert(node, `Link exists: ${selector}`);
  activate(node);
  await sleep(150);
}
function mobile(label) {
  assert(innerWidth === 375 || innerWidth === 390, `Set a required viewport before ${label}`);
  assert(document.documentElement.scrollWidth <= innerWidth, `No horizontal overflow: ${label}`);
  const dialog = document.querySelector('dialog[open], [role="alertdialog"]');
  if (dialog) {
    const bounds = dialog.getBoundingClientRect();
    assert(bounds.left >= 0 && bounds.right <= innerWidth, `Dialog fits: ${label}`);
  }
  for (const control of document.querySelectorAll('main button, main input, main select')) {
    if (control.closest('fieldset:disabled')) continue;
    assert(control.getAttribute('aria-label') || control.textContent.trim() || control.labels?.length,
      `Accessible control name: ${control.outerHTML.slice(0, 180)}`);
  }
}
async function guardPreview() {
  assert(['127.0.0.1', 'localhost'].includes(location.hostname), 'Only run on the isolated local preview');
  const response = await fetch('/__preview/state', { method: 'POST' });
  assert(response.ok, 'Synthetic preview controls required');
  return response.json();
}

export async function happy(locale = 'en') {
  const initialStock = await guardPreview();
  const t = plannerCopy[locale];
  const passed = [];
  const check = (name, condition = true) => { assert(condition, name); passed.push(name); };
  await until(() => document.querySelector('a[href="/planner/new"]'), 'empty planner');
  fill(document.querySelector('select[aria-label="Language"]'), locale);
  await until(() => text().includes(t.empty), 'localized empty state');
  check('no-current-plan generation state');
  await link('a[href="/planner/new"]');
  mobile('setup');

  const nativeFetch = window.fetch;
  const requests = [];
  window.fetch = async (...args) => {
    const response = await nativeFetch(...args);
    const url = String(args[0]);
    if (url.includes(prefix) && args[1]?.method === 'POST') {
      requests.push({ url, body: JSON.parse(args[1].body), status: response.status, data: await response.clone().json() });
    }
    return response;
  };
  try {
    activate(button(t.generate));
    await until(() => document.querySelector('[data-testid="plan-revision"]'), 'generated week');
    const plan = requests.find((item) => item.url.endsWith('/plans')).data;
    const id = plan.id;
    check('real seven-day plan', document.querySelectorAll('[data-testid="planned-meal"]').length === 7);
    check('create submits scheduling intent only', !('result' in requests[0].body) && !('householdId' in requests[0].body));
    mobile('week'); check('weekly mobile structure and labeled controls');
    await link(`a[href="/planner/${id}/shopping"]`);
    activate(button(t.optimize));
    await until(() => document.querySelector('[data-testid="shopping-result"]'), 'revision 1 shopping');
    await link(`a[href="/planner/${id}"]`);
    await link('a[href*="/meal/"]');
    await until(() => text().includes(t.nutrition), 'meal detail');
    check('meal detail unknown nutrition and separate inventory annotation', text().includes(t.cookedNote));
    mobile('meal and feedback'); check('meal mobile structure');
    const trigger = button(t.swap);
    activate(trigger);
    await until(() => document.querySelector('dialog[open] li button'), 'swap alternatives');
    check('labeled modal and focus entry', document.querySelector('dialog').contains(document.activeElement) && !!document.querySelector('#swap-title'));
    mobile('swap'); check('swap mobile fit');
    activate(document.querySelector('dialog button[aria-label]'));
    await until(() => !document.querySelector('dialog'), 'cancel swap');
    check('close returns focus without mutation', document.activeElement === trigger && !requests.some((item) => item.url.endsWith('/swap')));
    activate(trigger);
    await until(() => document.querySelector('dialog li button'), 'reopened swap');
    const replacementTitle = document.querySelector('dialog li span').textContent;
    activate(document.querySelector('dialog li button'));
    await until(() => !document.querySelector('dialog') && text().includes(t.swapped), 'swap applied');
    const swap = requests.find((item) => item.url.endsWith('/swap'));
    check('swap sends revision and returns full authoritative replacement', swap.body.revision === 1 && swap.data.revision === 2 && swap.data.result.meals.length === 7);
    check('swapped recipe rendered', document.querySelector('main h2').textContent === replacementTitle);
    activate(button(t.swapped));
    await until(() => text().includes(`${t.feedbackSaved}: ${t.swapped}`), 'swap feedback');
    check('swapped feedback receipt');
    activate(button(t.explain));
    await until(() => text().includes(t.fallback), 'AI fallback');
    check('AI disabled leaves grounded explanation usable', requests.find((item) => item.url.endsWith('/explanation')).data.source === 'deterministic');
    activate(button(t.cooked));
    await until(() => text().includes(`${t.feedbackSaved}: ${t.cooked}`), 'cooked receipt');
    check('cooked explicitly does not mutate inventory', requests.filter((item) => item.url.endsWith('/feedback')).every((item) => item.data.inventoryMutated === false));
    for (const type of ['liked', 'disliked', 'skipped']) {
      activate(button(t[type]));
      await until(() => text().includes(`${t.feedbackSaved}: ${t[type]}`), `${type} receipt`);
      check(`${type} feedback receipt`);
    }
    await link(`a[href="/planner/${id}/shopping"]`);
    check('old shopping cache removed after swap', !document.querySelector('[data-testid="shopping-result"]'));
    await link(`a[href="/planner/${id}"]`);
    activate(button(t.regenerate));
    await until(() => document.querySelector('[role="alertdialog"]'), 'regenerate confirmation');
    check('regenerate confirmation focus', document.querySelector('[role="alertdialog"]').contains(document.activeElement));
    mobile('regenerate confirmation');
    activate(button(t.confirm, document.querySelector('[role="alertdialog"]')));
    await until(() => document.querySelector('[data-testid="plan-revision"]')?.textContent === '3', 'revision 3');
    check('regenerate full revision', requests.find((item) => item.url.endsWith('/regenerate')).data.result.meals.length === 7);
    await link(`a[href="/planner/${id}/shopping"]`);
    fill(document.querySelector('form select'), 'JPY');
    fill(document.querySelector('input[inputmode="decimal"]'), '5000');
    await sleep(50);
    activate(button(t.optimize));
    await until(() => document.querySelector('[data-testid="shopping-result"]'), 'shopping response');
    const shopping = requests.filter((item) => item.url.endsWith('/shopping')).at(-1);
    check('shopping uses new authoritative revision', shopping.body.revision === 3 && shopping.data.planRevision === 3);
    check('real unknown price count and no false total', shopping.data.result.cost.unknownCostItemCount > 0 && text().includes(t.unknownPrices) && !text().includes(t.completeTotal));
    check('unknown budget remains unknown', document.querySelector('[data-testid="budget-status"]').textContent === budgetStatusLabel('unknown', locale));
    check('surplus not certain waste', text().includes(t.wasteNote));
    mobile('shopping and budget'); check('shopping mobile structure');
    activate(document.querySelector('[data-testid="shopping-result"] input[type="checkbox"]'));
    const afterStock = await guardPreview();
    check('generation swap shopping cooked do not mutate real stock', JSON.stringify(initialStock.inventory) === JSON.stringify(afterStock.inventory));
    await nativeFetch('/__preview/stale-inventory', { method: 'POST' });
    activate(button(t.optimize));
    await until(() => text().includes(t.staleTitle), 'stale revalidation banner');
    check('stale recovery useful not raw conflict', !text().includes('409 Conflict') && !document.querySelector('[data-testid="shopping-result"]'));
    mobile('stale'); check('stale mobile structure');
    await link(`a[href="/planner/${id}"]`);
    activate(button(t.regenerate));
    await until(() => document.querySelector('[role="alertdialog"]'), 'stale regenerate confirmation');
    activate(button(t.confirm, document.querySelector('[role="alertdialog"]')));
    await until(() => document.querySelector('[data-testid="plan-revision"]')?.textContent === '4', 'revalidated revision');
    check('explicit stale regeneration restores current revision');
    await link(`a[href="/planner/${id}/shopping"]`);
    check('old shopping cache removed after regeneration', !document.querySelector('[data-testid="shopping-result"]'));
    sessionStorage.setItem(evidenceKey, JSON.stringify({ id, revision: 4, locale, passed }));
    return { suite: 'real-worker-happy-uncertainty-stale', locale, viewport: innerWidth, tests: passed.length, passed };
  } finally { window.fetch = nativeFetch; }
}

export async function restored() {
  await guardPreview();
  const evidence = JSON.parse(sessionStorage.getItem(evidenceKey));
  await until(() => location.pathname === `/planner/${evidence.id}` && document.querySelector('[data-testid="plan-revision"]'), 'current-plan redirect after reload');
  assert(document.querySelector('[data-testid="plan-revision"]').textContent === String(evidence.revision), 'Newest revision restored');
  mobile('restored week');
  return { suite: 'reload-restoration', tests: 2, passed: ['private current plan restored after real navigation', 'latest revision restored'] };
}

export async function revisionConflict() {
  await guardPreview();
  const evidence = JSON.parse(sessionStorage.getItem(evidenceKey));
  const t = plannerCopy[evidence.locale];
  await link(`a[href="/planner/${evidence.id}"]`);
  const response = await fetch(`${prefix}/${evidence.id}/regenerate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: evidence.revision }),
  });
  assert(response.ok, 'Concurrent actor regenerated server plan');
  const next = await response.json();
  activate(button(t.regenerate));
  await until(() => document.querySelector('[role="alertdialog"]'), 'conflict confirmation');
  activate(button(t.confirm, document.querySelector('[role="alertdialog"]')));
  await until(() => document.querySelector('[data-testid="plan-revision"]')?.textContent === String(next.revision) && text().includes(t.updated), '409 recovers latest plan');
  assert(!text().includes('409 Conflict'), 'Conflict is localized');
  mobile('revision recovery');
  sessionStorage.setItem(evidenceKey, JSON.stringify({ ...evidence, revision: next.revision }));
  return { suite: 'real-revision-conflict', tests: 2, passed: ['stale mutation rejected and latest revision recovered', 'localized recovery with mobile fit'] };
}

export async function alternativesConflict() {
  await guardPreview();
  const evidence = JSON.parse(sessionStorage.getItem(evidenceKey));
  const t = plannerCopy[evidence.locale];
  await link('a[href*="/meal/"]');
  const response = await fetch(`${prefix}/${evidence.id}/regenerate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: evidence.revision }),
  });
  assert(response.ok, 'Concurrent actor advanced plan before alternative lookup');
  const next = await response.json();
  activate(button(t.swap));
  await until(() => document.querySelector('dialog [role="alert"]'), 'alternatives revision conflict');
  activate(button(t.retry, document.querySelector('dialog')));
  await until(() => !document.querySelector('dialog'), 'retry refreshes plan instead of repeating stale alternatives');
  activate(button(t.swap));
  await until(() => document.querySelector('dialog li button'), 'alternatives for latest revision');
  assert(!document.querySelector('dialog [role="alert"]'), 'Latest alternatives recovered');
  activate(document.querySelector('dialog button[aria-label]'));
  await link(`a[href="/planner/${evidence.id}"]`);
  assert(document.querySelector('[data-testid="plan-revision"]').textContent === String(next.revision), 'Refreshed full plan');
  sessionStorage.setItem(evidenceKey, JSON.stringify({ ...evidence, revision: next.revision }));
  return { suite: 'alternatives-revision-conflict', tests: 2, passed: ['alternatives retry refreshes authoritative revision', 'latest alternatives load without a swap'] };
}

export async function keyboardDialog() {
  await guardPreview();
  const { locale } = JSON.parse(sessionStorage.getItem(evidenceKey));
  await link('a[href*="/meal/"]');
  keyboardTrigger = button(plannerCopy[locale].swap);
  activate(keyboardTrigger);
  await until(() => document.querySelector('dialog li button'), 'keyboard alternatives');
  assert(document.querySelector('dialog').contains(document.activeElement), 'Dialog focus entry');
  mobile('keyboard dialog');
  return 'Ready for native Shift+Tab, Tab and Escape';
}

export function keyboardContained() {
  assert(document.querySelector('dialog[open]')?.contains(document.activeElement), 'Native keyboard focus stays inside modal');
  return true;
}

export async function keyboardClosed() {
  await until(() => !document.querySelector('dialog'), 'native Escape closes dialog');
  assert(document.activeElement === keyboardTrigger, 'Escape restores trigger focus');
  return { suite: 'native-keyboard', tests: 3, passed: ['focus enters modal', 'Tab and Shift+Tab contained', 'Escape closes and restores focus'] };
}

// Response substitutions below exercise frontend uncertainty/errors only, not engine behavior.
export async function presentationFailures() {
  await guardPreview();
  const evidence = JSON.parse(sessionStorage.getItem(evidenceKey));
  const t = plannerCopy[evidence.locale];
  const passed = [];
  const nativeFetch = window.fetch;
  let mode = 'mixed';
  let shoppingCalls = 0;
  window.fetch = async (...args) => {
    if (String(args[0]).endsWith('/shopping')) {
      shoppingCalls++;
      if (mode === 'limited') return new Response(JSON.stringify({ error: 'RATE_LIMITED', message: 'Too many requests' }), { status: 429, headers: { 'content-type': 'application/json' } });
      const response = await nativeFetch(...args);
      const dto = await response.json();
      assert(response.ok, 'Real shopping base DTO required');
      dto.result.cost = { ...dto.result.cost, status: 'partial', knownCost: { currency: 'JPY', minorAmount: '4820' }, totalCost: null, unknownCostItemCount: 2 };
      dto.result.budget.status = 'unknown';
      return new Response(JSON.stringify(dto), { headers: { 'content-type': 'application/json' } });
    }
    return nativeFetch(...args);
  };
  try {
    await link(`a[href="/planner/${evidence.id}/shopping"]`);
    fill(document.querySelector('form select'), 'JPY');
    await sleep(50);
    activate(button(t.optimize));
    await until(() => document.querySelector('[data-testid="shopping-result"]'), 'mixed-price fixture');
    const result = document.querySelector('[data-testid="shopping-result"]').textContent;
    assert(result.includes(new Intl.NumberFormat(evidence.locale).format(4820)) && result.includes(`2 ${t.unknownPrices}`) && !result.includes(t.completeTotal), 'Known subtotal is not false exact total');
    passed.push('mixed JPY known subtotal and two unknown items');
    assert(document.querySelector('[data-testid="budget-status"]').textContent === budgetStatusLabel('unknown', evidence.locale), 'Unknown budget');
    passed.push('mixed prices retain unknown budget');
    mobile('mixed-price shopping'); passed.push('mixed-price mobile fit');
    mode = 'limited';
    activate(button(t.optimize));
    await until(() => document.querySelector('[role="alert"]'), '429 UI');
    assert(!text().includes('429') && !document.querySelector('[data-testid="shopping-result"]'), '429 has useful copy, hides obsolete result');
    passed.push('rate limit useful UI');
    const atLimit = shoppingCalls;
    await sleep(500);
    assert(shoppingCalls === atLimit, 'No automatic expensive retry');
    passed.push('rate limit no retry loop');
    return { suite: 'frontend-response-fixtures', tests: passed.length, passed };
  } finally { window.fetch = nativeFetch; }
}
