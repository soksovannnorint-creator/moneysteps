/* MoneySteps — script.js
 * Vanilla JS. Sections:
 *  1. Constants & data (budget fields, lessons, achievements)
 *  2. Helpers (DOM, money, dates)
 *  3. State, storage & validation
 *  4. Calculations (pure functions, no DOM)
 *  5. Rendering
 *  6. Actions & event handlers
 *  7. Init
 */
'use strict';

/* =====================================================================
 * 1. CONSTANTS & DATA
 * ===================================================================== */
const STORAGE_KEY = 'moneysteps.v1';
const SCHEMA_VERSION = 1;
const MAX_AMOUNT = 1000000000;

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)' },
  { code: 'SGD', label: 'Singapore Dollar (SGD)' },
  { code: 'INR', label: 'Indian Rupee (INR)' },
  { code: 'JPY', label: 'Japanese Yen (JPY)' },
  { code: 'KHR', label: 'Cambodian Riel (KHR)' }
];

// Economic snapshot researched on 25 Oct 2026 from the pages listed under each region.
// The app cannot fetch live data, so these figures are fixed until the snapshot is refreshed.
const ECONOMY = {
  asOf: '2026-10-25',
  regions: {
    USD: { name: 'United States', inflation: 3.7, inflationLabel: 'Consumer prices, September 2026', rateName: 'Federal funds target range', rate: '3.75%–4.00%', rateValue: 3.875, rateNote: 'Raised by 0.25 points on 16 Sep 2026.',
      sources: [{ title: 'US inflation rates', url: 'https://www.usinflationcalculator.com/inflation/current-inflation-rates/2/' }, { title: 'FOMC September 2026 decision', url: 'https://fedratecalc.com/fomc-meeting-schedule/september-2026/' }] },
    EUR: { name: 'Euro area', inflation: 3.8, inflationLabel: 'Consumer prices, September 2026', rateName: 'ECB deposit facility rate', rate: '2.50%', rateValue: 2.5, rateNote: 'Raised by 0.25 points on 10 Sep 2026.',
      sources: [{ title: 'Euro area inflation', url: 'https://tradingeconomics.com/euro-area/inflation-cpi' }, { title: 'ECB rate decision', url: 'https://beninwebtv.bj/en/eurozone-ecb-raises-rates-deposit-rate-increases-to-2-50/' }] },
    GBP: { name: 'United Kingdom', inflation: 3.5, inflationLabel: 'Consumer prices, September 2026', rateName: 'Bank of England Bank Rate', rate: '3.75%', rateValue: 3.75, rateNote: 'Held on 17 Sep 2026 in a 6–3 vote; three members wanted a rise.',
      sources: [{ title: 'UK September inflation', url: 'https://investinglive.com/news/uk-september-cpi-inflation-rises-to-3-5-reinforces-boe-november-rate-hike-expectations/' }, { title: 'Bank of England decision', url: 'https://www.mtsinsights.com/summaries/10990/' }] },
    AUD: { name: 'Australia', inflation: 4.0, inflationLabel: 'Consumer prices, August 2026 (monthly)', rateName: 'RBA cash rate', rate: '4.60%', rateValue: 4.6, rateNote: 'Raised by 0.25 points in September 2026.',
      sources: [{ title: 'Australian CPI and RBA rate', url: 'https://www.babypips.com/news/headline-australian-cpi-hits-4-0-but-aud-falls-as-rate-hike-pressure-eases-2026-09-30' }] },
    CAD: { name: 'Canada', inflation: 3.1, inflationLabel: 'Consumer prices, September 2026', rateName: 'Bank of Canada policy rate', rate: '2.25%', rateValue: 2.25, rateNote: 'Held on 2 Sep 2026.',
      sources: [{ title: 'Canada September inflation', url: 'https://investinglive.com/news/canada-september-cpi-3-1-y-y-vs-3-2-expected/' }, { title: 'Bank of Canada decision', url: 'https://www.mtsinsights.com/summaries/10747/' }] },
    SGD: { name: 'Singapore', inflation: 2.2, inflationLabel: 'Headline consumer prices, September 2026 (core 2.0%)', rateName: 'Policy rate', rate: 'None', rateValue: null, rateNote: 'The MAS manages policy through the exchange rate, so there is no policy interest rate to show.',
      sources: [{ title: 'Singapore inflation', url: 'https://tradingeconomics.com/singapore/inflation-cpi/news/585927' }] },
    INR: { name: 'India', inflation: 5.54, inflationLabel: 'Consumer prices, September 2026 (food 7.74%)', rateName: 'RBI repo rate', rate: '5.50%', rateValue: 5.5, rateNote: 'Raised by 0.25 points in October 2026, the first rise in nearly four years.',
      sources: [{ title: 'India September inflation and repo rate', url: 'https://www.kotakneo.com/news/market-news/india-cpi-inflation-september-2026-onion-food-prices/' }] },
    JPY: { name: 'Japan', inflation: 1.9, inflationLabel: 'Consumer prices, August 2026', rateName: 'Bank of Japan policy rate', rate: '1.25%', rateValue: 1.25, rateNote: 'Raised from 1.00% on 18 Sep 2026 in a 7–2 vote.',
      sources: [{ title: 'Bank of Japan rate decision', url: 'https://www.nationthailand.com/news/world/40071184' }, { title: 'Japan consumer prices', url: 'https://datatrack.trendforce.com/blog/content/64339/japan-q3-cpi-yoy-growth-remains-flat-at-19-sticky-inflation-boosts-boj-september-rate-hike-expectations' }] },
    KHR: { name: 'Cambodia', inflation: 5.32, inflationLabel: 'Consumer prices, September 2026 (up from 4.79% in August; core 3.00%)', rateName: 'Policy interest rate', rate: 'Not confirmed', rateValue: null, rateNote: 'I could not confirm a single policy interest rate for Cambodia. The National Bank of Cambodia mainly keeps the riel steady against the US dollar.',
      facts: [
        { label: 'Riel per US dollar', value: '≈ 4,084', note: 'National Bank of Cambodia official rate, late Oct 2026. The IMF expects it to stay broadly stable.' },
        { label: 'Food prices (yearly)', value: '5.31%', note: 'September 2026, up slightly from 5.20%.' },
        { label: 'Transport prices (monthly)', value: '≈ +8%', note: 'The transport index jumped from 124.3 to 134.3 between August and September 2026, so fuel and fares are the pressure point.' },
        { label: 'Inflation forecast, 2026 average', value: '5.6%', note: 'IMF, September 2026, up from 2.5% in 2025. It expects 3.1% in 2027.' },
        { label: 'Economic growth, 2026', value: '3.0%', note: 'IMF forecast, down from 5.3% in 2025. It expects 4.0% in 2027.' },
        { label: 'Bank lending growth, 2026', value: '3.5%', note: 'IMF forecast, down from 6.2% in 2025. Credit is growing more slowly.' }
      ],
      sources: [{ title: 'Trading Economics: Cambodia inflation', url: 'https://tradingeconomics.com/cambodia/inflation-cpi' }, { title: 'IMF 2026 Article IV consultation with Cambodia', url: 'https://www.imf.org/en/news/articles/2026/09/28/pr26307-cambodia-imf-executive-board-concludes-2026-article-iv-consultation' }, { title: 'National Bank of Cambodia exchange rate', url: 'https://www.nbc.gov.kh/english/economic_research/exchange_rate.php' }] }
  }
};
const regionKey = s => (s.profile.region && ECONOMY.regions[s.profile.region] ? s.profile.region : ECONOMY.regions[s.profile.currency] ? s.profile.currency : 'USD');

// Every budget input. "group" decides which fieldset it appears in.
const BUDGET_FIELDS = [
  { key: 'income', label: 'Monthly income', group: 'income', hint: 'Money you receive in a typical month after tax: salary, allowance, part-time work. If it varies, use a cautious average.' },
  { key: 'housing', label: 'Housing & utilities', group: 'essential', hint: 'Rent or board, utilities, internet, phone.' },
  { key: 'food', label: 'Food', group: 'essential', hint: 'Groceries and necessary meals.' },
  { key: 'transport', label: 'Transportation', group: 'essential', hint: 'Fares, fuel, repairs to get to work or study.' },
  { key: 'education', label: 'Education', group: 'essential', hint: 'Tuition, books, supplies, courses.' },
  { key: 'debt', label: 'Debt repayments', group: 'essential', hint: 'Required repayments on loans or credit.' },
  { key: 'otherEssential', label: 'Other essential expenses', group: 'essential', hint: 'Health, insurance, family support, other must-pays.' },
  { key: 'flexible', label: 'Flexible spending', group: 'flexible', hint: 'Eating out, entertainment, hobbies, shopping. The part you can adjust.' },
  { key: 'savings', label: 'Planned savings', group: 'savings', hint: 'Optional. Zero is fine; there is no required amount.' }
];

const FIELD_LABEL = Object.fromEntries(BUDGET_FIELDS.map(f => [f.key, f.label]));
const EXPENSE_KEYS = ['housing', 'food', 'transport', 'education', 'debt', 'otherEssential', 'flexible'];
// Daily expenses use the same categories as the budget, plus one for things you didn't plan for
const SPEND_CATS = [...EXPENSE_KEYS, 'other'];
// Custom categories are stored as { id, name } and referenced by expenses as "c:<id>"
function catLabel(k) {
  if (k === 'other') return 'Unplanned / other';
  if (typeof k === 'string' && k.startsWith('c:')) {
    const c = state.customCategories.find(x => 'c:' + x.id === k);
    return c ? c.name : 'Unplanned / other';
  }
  return FIELD_LABEL[k];
}
const allSpendCats = () => [...SPEND_CATS, ...state.customCategories.map(c => 'c:' + c.id)];
const MAX_EXPENSES = 5000;
const MAX_CUSTOM = 20;
const ESSENTIAL_KEYS = ['housing', 'food', 'transport', 'education', 'debt', 'otherEssential'];
// Order + chart styling for the allocation breakdown (class = colour, extra class = pattern)
const BREAKDOWN = [
  { key: 'housing', cls: 'c0' },
  { key: 'food', cls: 'c1 p-stripe' },
  { key: 'transport', cls: 'c2' },
  { key: 'education', cls: 'c3 p-dots' },
  { key: 'debt', cls: 'c5' },
  { key: 'otherEssential', cls: 'c6 p-stripe' },
  { key: 'flexible', cls: 'c4 p-dots' },
  { key: 'savings', cls: 'c7' }
];

const LEVELS = {
  strong: { label: 'A flexible starting point', icon: 'circle-check' },
  depends: { label: 'Reasonable in some situations', icon: 'scale-balanced' },
  rethink: { label: 'Worth a second look', icon: 'magnifying-glass' }
};

// Lesson text can use f(n) to format an amount in the user's currency.
const LESSONS = [
  {
    id: 'unexpected-expense',
    topic: 'Unexpected expense',
    title: 'The bicycle repair',
    situation: f => `You planned to save ${f(50)} this month, but your bicycle needs a ${f(30)} repair to get to work. What should you consider?`,
    options: [
      { text: 'Ignore the repair, even if you can’t get to work.', level: 'rethink',
        why: 'Skipping the repair protects your savings plan, but if the bike is how you earn money, the cost of missing work could be bigger than the repair.' },
      { text: 'Review your budget and adjust your savings or flexible spending if necessary.', level: 'strong',
        why: 'This is usually the most flexible place to start. You keep your income stream safe and choose what gives a little, such as saving ' + 'less this month or trimming flexible spending. The trade-off is a slower savings pace.' },
      { text: 'Borrow money immediately without checking the repayment terms.', level: 'rethink',
        why: 'Borrowing can be reasonable in a true emergency, but taking on a loan without knowing the cost can turn a small repair into a bigger problem. Check the terms first.' }
    ],
    takeaway: 'Plans are allowed to flex. What matters is deciding on purpose, and the best choice depends on your circumstances.'
  },
  {
    id: 'emergency-fund',
    topic: 'Emergency fund',
    title: 'Starting a safety buffer',
    situation: f => `You’ve just started a job. After essentials, about ${f(80)} is left each month. A friend says saving anything under 20% of income is pointless. What do you do?`,
    options: [
      { text: 'Start a small, regular amount into a separate buffer and increase it when you can.', level: 'strong',
        why: 'A small amount builds the habit and a cushion for surprises. The trade-off: it will take longer to reach a comfortable buffer, but starting is easier than waiting.' },
      { text: 'Wait until you can save the “proper” amount.', level: 'depends',
        why: 'If money is very tight, or you have urgent costs, waiting can be sensible. Just remember that rules of thumb aren’t requirements, and a small start can still help.' },
      { text: 'Put all of it into a risky investment hoping it grows fast.', level: 'rethink',
        why: 'Investments can fall in value, and an emergency fund needs to be there when you need it. Anything promising fast, certain growth deserves caution.' }
    ],
    takeaway: 'An emergency fund is a cushion, not a competition. Any amount you can set aside without strain counts.'
  },
  {
    id: 'needs-wants',
    topic: 'Needs vs wants',
    title: 'The sale and the winter coat',
    situation: f => `Your phone still works, but a new model is on sale for ${f(300)} and the deal ends tomorrow. You also need a warm coat for winter. Your flexible budget this month is ${f(120)}.`,
    options: [
      { text: 'Buy the phone now, because the sale won’t last.', level: 'rethink',
        why: 'Time-limited sales are designed to feel urgent. The phone costs far more than your flexible budget, and it isn’t a need right now, while the coat is.' },
      { text: 'Cover the coat first, then decide whether the phone can wait or be saved for.', level: 'strong',
        why: 'Putting a real need first keeps you safe and warm, and treating the phone as a savings goal lets you decide without the pressure of a deadline. You might miss this particular sale.' },
      { text: 'Skip both and put everything into savings.', level: 'depends',
        why: 'If your budget is very tight this can be a valid call. But a coat can be a genuine need, and going without can cost you in health or comfort. Savings matter, so does looking after yourself.' }
    ],
    takeaway: 'The line between needs and wants moves with your situation. It helps to name which is which before you spend.'
  },
  {
    id: 'suspicious-investment',
    topic: 'Suspicious promises',
    title: '“Guaranteed” returns',
    situation: () => 'A message from someone you barely know promises “guaranteed 30% returns every month, zero risk” if you transfer money to a personal account today.',
    options: [
      { text: 'Send a small “test” amount to see if it works.', level: 'rethink',
        why: 'Scams often pay a small amount back first to build trust, then ask for much more. Even a small test can be money you don’t get back.' },
      { text: 'Don’t send anything. Check whether the offer is licensed with an official regulator, and talk to someone you trust.', level: 'strong',
        why: 'Real investments carry risk, and nobody can guarantee high returns with zero risk. Pressure to act today is a warning sign. The trade-off is you may miss a rare real opportunity, but that is a far smaller risk than losing money.' },
      { text: 'Send money because a friend of a friend says they made a profit.', level: 'rethink',
        why: 'Stories from other people are easy to fake, and some people are earlier victims who are passing the scheme on without realising. Verify independently before trusting anyone with your money.' }
    ],
    takeaway: 'If an offer promises high returns with no risk, slow down. Taking time to check is always allowed.'
  },
  {
    id: 'future-purchase',
    topic: 'Future purchase',
    title: 'Planning for a laptop',
    situation: f => `You’d like a ${f(800)} laptop for study in 8 months. You’ve saved ${f(100)} so far, and the store offers “no payments for 12 months” if you buy today.`,
    options: [
      { text: 'Work out the monthly amount needed, compare it with your budget, then adjust the timeline or price if needed.', level: 'strong',
        why: 'Splitting the remaining amount over the months left shows whether the plan fits your real budget. If not, you can extend the date or lower the target. It takes patience, but you stay in control.' },
      { text: 'Take the “no payments” offer without reading the terms.', level: 'rethink',
        why: 'Deferred-payment offers can carry fees or high interest if the balance isn’t cleared in time. Read the terms and know exactly what you’ll owe and when.' },
      { text: 'Buy a cheaper refurbished laptop now if it meets your needs.', level: 'depends',
        why: 'If you need a working laptop soon, a good refurbished model can be a sensible compromise. Check the warranty and whether it truly meets your needs, and consider how it affects the rest of your budget.' }
    ],
    takeaway: 'Big purchases get easier when you break them into monthly steps and compare them to your own numbers.'
  }
];

const ACHIEVEMENTS = [
  { id: 'first-budget', title: 'First Budget Created', desc: 'Save your first monthly budget.', icon: 'wallet',
    check: s => s.budget.saved },
  { id: 'first-expense', title: 'First Expense Logged', desc: 'Record your first daily expense.', icon: 'receipt',
    check: s => s.stats.expensesLogged >= 1 },
  { id: 'budget-reviewed', title: 'Budget Reviewed', desc: 'Come back and save your budget again after reviewing it.', icon: 'clipboard-check',
    check: s => s.budget.saveCount >= 2 },
  { id: 'first-goal', title: 'First Savings Goal', desc: 'Create your first savings goal.', icon: 'bullseye',
    check: s => s.stats.goalsCreated >= 1 },
  { id: 'first-contribution', title: 'First Contribution', desc: 'Record money added to a goal.', icon: 'piggy-bank',
    check: s => s.stats.contributions >= 1 },
  { id: 'first-lesson', title: 'First Lesson Completed', desc: 'Complete one money lesson.', icon: 'lightbulb',
    check: s => Object.keys(s.lessons.completed).length >= 1 },
  { id: 'goal-reached', title: 'Goal Reached', desc: 'Fully fund a savings goal.', icon: 'flag-checkered',
    check: s => s.goals.some(g => g.target > 0 && g.saved >= g.target) },
  { id: 'all-lessons', title: 'Lesson Explorer', desc: 'Complete all five lessons.', icon: 'graduation-cap',
    check: s => Object.keys(s.lessons.completed).length >= LESSONS.length }
];

const VIEWS = {
  dashboard: 'Dashboard',
  budget: 'My Budget',
  spending: 'Daily Spending',
  goals: 'Savings Goals',
  insights: 'Insights',
  lessons: 'Money Lessons',
  progress: 'My Progress',
  settings: 'Settings'
};

/* =====================================================================
 * 2. HELPERS
 * ===================================================================== */
const $ = id => document.getElementById(id);

// Safe element builder: text is always added as text nodes, never as HTML.
function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : String(v));
  }
  kids.flat().forEach(c => {
    if (c === null || c === undefined || c === false) return;
    n.append(c.nodeType ? c : document.createTextNode(String(c)));
  });
  return n;
}
const icon = (name, extra = '') => el('i', { class: `fa-solid fa-${name} ${extra}`.trim(), 'aria-hidden': 'true' });
const setText = (id, t) => { $(id).textContent = t; };

const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);

function fmt(n) {
  const v = round2(num(n));
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency: state.profile.currency,
      minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2
    }).format(v);
  } catch (e) {
    return `${state.profile.currency} ${v.toFixed(2)}`;
  }
}

function currencySymbol(code) {
  try {
    const part = new Intl.NumberFormat(undefined, { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0).find(p => p.type === 'currency');
    return part ? part.value : code;
  } catch (e) { return code; }
}

const pad = n => String(n).padStart(2, '0');
const Dates = {
  today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; },
  toInput(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; },
  // Parse "YYYY-MM-DD" as a local date; returns null if the text isn't a real date.
  parse(str) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || ''));
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
  },
  daysUntil(str) {
    const d = Dates.parse(str);
    return d ? Math.round((d - Dates.today()) / 86400000) : null;
  },
  addMonths(date, n) {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + n);
    if (d.getDate() !== day) d.setDate(0); // clamp e.g. Jan 31 + 1 month
    return d;
  },
  show(d) { return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); },
  showIso(iso) { const d = new Date(iso); return isNaN(d) ? '' : Dates.show(d); }
};

const isIso = s => typeof s === 'string' && !isNaN(Date.parse(s));
const newId = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));

/* =====================================================================
 * 3. STATE, STORAGE & VALIDATION
 * ===================================================================== */
function defaultState() {
  const budget = { saved: false, saveCount: 0, savedAt: null };
  BUDGET_FIELDS.forEach(f => { budget[f.key] = 0; });
  return {
    version: SCHEMA_VERSION,
    profile: { name: '', currency: 'USD', region: '' },
    budget,
    goals: [],
    expenses: [],
    customCategories: [],
    lessons: { completed: {} },
    achievements: {},
    stats: { goalsCreated: 0, contributions: 0, expensesLogged: 0 }
  };
}

let state = defaultState();
let storageOk = true;
// UI-only state (not saved)
const ui = { lastCheck: null, lessonIndex: 0, selected: null, lessonError: '', goalEditingId: null, contributeId: null,
  spMonth: Dates.toInput(new Date()).slice(0, 7), editingExpenseId: null };

function validateAmount(raw, badInput) {
  if (badInput) return { error: 'Enter a valid number.' };
  const t = String(raw).trim();
  if (t === '') return { error: 'Enter an amount (use 0 if this doesn’t apply).' };
  const n = Number(t);
  if (!Number.isFinite(n)) return { error: 'Enter a valid number.' };
  if (n < 0) return { error: 'Amounts can’t be negative.' };
  if (n > MAX_AMOUNT) return { error: 'That amount is too large.' };
  return { value: round2(n) };
}

/* Turn untrusted data (localStorage or an imported file) into a clean state.
 * strict=true throws a readable Error on the first problem (used for imports).
 * strict=false repairs or drops bad pieces (used for localStorage). */
function sanitizeState(raw, strict) {
  const bad = msg => { if (strict) throw new Error(msg); };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('The data isn’t in the expected format.');
  const out = defaultState();

  const amount = (v, label, { min = 0 } = {}) => {
    const n = Number(v);
    if (typeof v === 'boolean' || v === null || !Number.isFinite(n) || n < min || n > MAX_AMOUNT) {
      bad(`${label} must be a number${min > 0 ? ' greater than 0' : ' of 0 or more'}.`);
      return min > 0 ? null : 0;
    }
    return round2(n);
  };

  if (raw.profile !== undefined) {
    if (typeof raw.profile !== 'object' || raw.profile === null) bad('Profile section is invalid.');
    else {
      if (typeof raw.profile.name === 'string') out.profile.name = raw.profile.name.trim().slice(0, 40);
      else if (raw.profile.name !== undefined) bad('Display name must be text.');
      if (CURRENCIES.some(c => c.code === raw.profile.currency)) out.profile.currency = raw.profile.currency;
      else if (raw.profile.currency !== undefined) bad('Currency isn’t supported.');
      if (typeof raw.profile.region === 'string' && ECONOMY.regions[raw.profile.region]) out.profile.region = raw.profile.region;
      else if (raw.profile.region !== undefined && raw.profile.region !== '') bad('Region isn’t supported.');
    }
  }

  if (raw.budget !== undefined) {
    if (typeof raw.budget !== 'object' || raw.budget === null) bad('Budget section is invalid.');
    else {
      BUDGET_FIELDS.forEach(f => {
        if (raw.budget[f.key] !== undefined) out.budget[f.key] = amount(raw.budget[f.key], FIELD_LABEL[f.key]);
      });
      out.budget.saved = raw.budget.saved === true;
      const sc = Math.floor(Number(raw.budget.saveCount));
      out.budget.saveCount = Number.isFinite(sc) && sc > 0 ? Math.min(sc, 100000) : (out.budget.saved ? 1 : 0);
      out.budget.savedAt = isIso(raw.budget.savedAt) ? raw.budget.savedAt : null;
    }
  }

  if (raw.goals !== undefined) {
    if (!Array.isArray(raw.goals)) bad('Goals must be a list.');
    else {
      const seen = new Set();
      raw.goals.slice(0, 200).forEach((g, i) => {
        const label = `Goal ${i + 1}`;
        try {
          if (!g || typeof g !== 'object') throw new Error(`${label} is invalid.`);
          const name = typeof g.name === 'string' ? g.name.trim().slice(0, 60) : '';
          if (!name) throw new Error(`${label} needs a name.`);
          const target = amount(g.target, `${label} target`, { min: 0.01 });
          const saved = amount(g.saved, `${label} saved amount`);
          if (target === null) throw new Error(`${label} target must be above 0.`);
          if (!Dates.parse(g.date)) throw new Error(`${label} has an invalid date.`);
          let id = typeof g.id === 'string' && g.id && !seen.has(g.id) ? g.id.slice(0, 80) : newId();
          seen.add(id);
          out.goals.push({
            id, name, target, saved, date: g.date,
            desc: typeof g.desc === 'string' ? g.desc.trim().slice(0, 200) : '',
            createdAt: isIso(g.createdAt) ? g.createdAt : new Date().toISOString()
          });
        } catch (e) { if (strict) throw e; }
      });
    }
  }

  if (raw.customCategories !== undefined) {
    if (!Array.isArray(raw.customCategories)) bad('Custom categories must be a list.');
    else {
      const seenC = new Set(), seenN = new Set();
      raw.customCategories.slice(0, MAX_CUSTOM).forEach((c, i) => {
        try {
          const name = c && typeof c.name === 'string' ? c.name.trim().replace(/\s+/g, ' ').slice(0, 30) : '';
          if (!name) throw new Error(`Custom category ${i + 1} needs a name.`);
          const id = typeof c.id === 'string' && c.id && !/[^\w-]/.test(c.id) && !seenC.has(c.id) ? c.id.slice(0, 80) : newId();
          if (seenN.has(name.toLowerCase())) throw new Error(`Custom category “${name}” appears twice.`);
          seenC.add(id); seenN.add(name.toLowerCase());
          out.customCategories.push({ id, name, type: c.type === 'need' ? 'need' : 'want' });
        } catch (e) { if (strict) throw e; }
      });
    }
  }

  if (raw.expenses !== undefined) {
    if (!Array.isArray(raw.expenses)) bad('Expenses must be a list.');
    else {
      const seenE = new Set();
      raw.expenses.slice(0, MAX_EXPENSES).forEach((x, i) => {
        try {
          if (!x || typeof x !== 'object') throw new Error(`Expense ${i + 1} is invalid.`);
          const amt = amount(x.amount, `Expense ${i + 1} amount`, { min: 0.01 });
          if (amt === null) throw new Error(`Expense ${i + 1} amount must be above 0.`);
          if (!Dates.parse(x.date)) throw new Error(`Expense ${i + 1} has an invalid date.`);
          let cat = x.category;
          const known = SPEND_CATS.includes(cat) || (typeof cat === 'string' && out.customCategories.some(c => 'c:' + c.id === cat));
          if (!known) {
            if (strict) throw new Error(`Expense ${i + 1} has an unknown category.`);
            cat = 'other'; // keep the money, drop the unknown label
          }
          const id = typeof x.id === 'string' && x.id && !seenE.has(x.id) ? x.id.slice(0, 80) : newId();
          seenE.add(id);
          out.expenses.push({
            id, date: x.date, amount: amt, category: cat,
            note: typeof x.note === 'string' ? x.note.trim().slice(0, 80) : '',
            createdAt: isIso(x.createdAt) ? x.createdAt : new Date().toISOString()
          });
        } catch (e) { if (strict) throw e; }
      });
    }
  }

  if (raw.lessons !== undefined) {
    const comp = raw.lessons && raw.lessons.completed;
    if (comp === undefined) { /* nothing saved yet */ }
    else if (typeof comp !== 'object' || comp === null || Array.isArray(comp)) bad('Lesson progress is invalid.');
    else {
      LESSONS.forEach(l => {
        const c = comp[l.id];
        if (c === undefined) return;
        const choice = c && Number.isInteger(c.choice) ? c.choice : -1;
        if (choice < 0 || choice >= l.options.length) { bad(`Lesson “${l.title}” has an invalid answer.`); return; }
        out.lessons.completed[l.id] = { choice, at: isIso(c.at) ? c.at : new Date().toISOString() };
      });
    }
  }

  if (raw.achievements !== undefined) {
    if (typeof raw.achievements !== 'object' || raw.achievements === null || Array.isArray(raw.achievements)) bad('Achievements are invalid.');
    else ACHIEVEMENTS.forEach(a => {
      if (isIso(raw.achievements[a.id])) out.achievements[a.id] = raw.achievements[a.id];
    });
  }

  if (raw.stats !== undefined && raw.stats && typeof raw.stats === 'object') {
    const gc = Math.floor(Number(raw.stats.goalsCreated)), cn = Math.floor(Number(raw.stats.contributions));
    out.stats.goalsCreated = Number.isFinite(gc) && gc > 0 ? Math.min(gc, 100000) : 0;
    out.stats.contributions = Number.isFinite(cn) && cn > 0 ? Math.min(cn, 100000) : 0;
    const ex = Math.floor(Number(raw.stats.expensesLogged));
    out.stats.expensesLogged = Number.isFinite(ex) && ex > 0 ? Math.min(ex, 1000000) : 0;
  }
  // Keep counters consistent with the data that exists
  out.stats.goalsCreated = Math.max(out.stats.goalsCreated, out.goals.length);
  out.stats.expensesLogged = Math.max(out.stats.expensesLogged, out.expenses.length);
  return out;
}

function loadState() {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return;
    state = sanitizeState(JSON.parse(text), false);
  } catch (e) {
    // Missing, corrupt or unreadable data: start fresh instead of crashing.
    if (e instanceof SyntaxError || /expected format/.test(e.message)) {
      try { localStorage.setItem(STORAGE_KEY + '.corrupt-backup', localStorage.getItem(STORAGE_KEY) || ''); } catch (_) { /* ignore */ }
      state = defaultState();
    } else if (e.name === 'SecurityError') {
      storageOk = false;
    }
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageOk = true;
  } catch (e) {
    storageOk = false;
  }
  $('storage-warning').hidden = storageOk;
}

/* =====================================================================
 * 4. CALCULATIONS (pure: no DOM)
 * ===================================================================== */
const Calc = {
  totalExpenses: b => round2(EXPENSE_KEYS.reduce((s, k) => s + num(b[k]), 0)),
  essentials: b => round2(ESSENTIAL_KEYS.reduce((s, k) => s + num(b[k]), 0)),
  // Remaining balance = Monthly income − Total planned expenses − Planned savings
  remaining: b => round2(num(b.income) - Calc.totalExpenses(b) - num(b.savings)),
  // Money that could realistically go to goals each month (planned savings + any unassigned money)
  savingCapacity(b) {
    if (!b.saved) return null;
    return round2(num(b.savings) + Math.max(0, Calc.remaining(b)));
  },
  goalRemaining: g => round2(Math.max(0, g.target - g.saved)),
  goalPct: g => (g.target > 0 ? Math.min(100, Math.floor((g.saved / g.target) * 100)) : 0),
  // Remaining amount = Target − Saved ; Monthly needed = Remaining ÷ months remaining (rounded up)
  goalPlan(g) {
    const remaining = Calc.goalRemaining(g);
    if (remaining <= 0) return { status: 'complete', remaining: 0 };
    const days = Dates.daysUntil(g.date);
    if (days === null) return { status: 'invalid', remaining };
    if (days < 0) return { status: 'overdue', remaining };
    if (days === 0) return { status: 'due-today', remaining };
    const months = Math.max(1, Math.ceil(days / 30.4375));
    return { status: 'active', remaining, months, monthly: round2(remaining / months) };
  },
  activeGoals: goals => goals.filter(g => Calc.goalRemaining(g) > 0),
  // Spending by category for one month ("YYYY-MM"), and helpers
  spentByCategory(expenses, month) {
    const o = {};
    SPEND_CATS.forEach(k => { o[k] = 0; });
    expenses.forEach(e => { if (e.date.slice(0, 7) === month) o[e.category] = round2((o[e.category] || 0) + e.amount); });
    return o;
  },
  sum: o => round2(Object.values(o).reduce((s, v) => s + v, 0)),
  spentOn: (expenses, day) => round2(expenses.filter(e => e.date === day).reduce((s, e) => s + e.amount, 0)),
  daysInMonth: m => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo, 0).getDate(); },
  totalSaved: goals => round2(goals.reduce((s, g) => s + g.saved, 0)),
  totalTarget: goals => round2(goals.reduce((s, g) => s + g.target, 0)),
  overallPct(goals) {
    const t = Calc.totalTarget(goals);
    if (t <= 0) return 0;
    return Math.min(100, Math.floor((goals.reduce((s, g) => s + Math.min(g.saved, g.target), 0) / t) * 100));
  },
  // Estimated completion if planned savings are split equally across active goals
  estimate(g, s) {
    if (!s.budget.saved || s.budget.savings <= 0) return null;
    const active = Calc.activeGoals(s.goals);
    if (!active.length) return null;
    const share = round2(s.budget.savings / active.length);
    if (share <= 0) return null;
    const months = Math.ceil(Calc.goalRemaining(g) / share);
    if (months > 1200) return null;
    return { share, months, date: Dates.addMonths(Dates.today(), months) };
  }
};

function nextSteps(s) {
  const steps = [];
  const rem = Calc.remaining(s.budget);
  const done = Object.keys(s.lessons.completed).length;
  if (!s.budget.saved) steps.push({ title: 'Create your money plan', text: 'Enter your income and expenses to see what’s left each month.', href: '#budget', label: 'Open My Budget' });
  else if (rem < 0) steps.push({ title: 'Review your plan', text: 'Your planned spending is higher than your income. Small tweaks to flexible spending or savings can help, and there’s no judgment either way.', href: '#budget', label: 'Adjust my budget' });
  if (s.budget.saved && !s.expenses.some(e => e.date.slice(0, 7) === Dates.toInput(new Date()).slice(0, 7))) steps.push({ title: 'Log what you spend', text: 'Add your spending as it happens to see how it compares with your plan.', href: '#spending', label: 'Log an expense' });
  if (!s.goals.length) steps.push({ title: 'Set your first savings goal', text: 'Choose something to work towards, big or small. You can change it any time.', href: '#goals', label: 'Create a goal' });
  const late = s.goals.find(g => Calc.goalPlan(g).status === 'overdue');
  if (late) steps.push({ title: `Revisit “${late.name}”`, text: 'The target date has passed. You can pick a new date or adjust the target.', href: '#goals', label: 'Edit goal' });
  if (done < LESSONS.length) steps.push({ title: done ? 'Continue your money lessons' : 'Try your first money lesson', text: `${LESSONS.length - done} scenario${LESSONS.length - done === 1 ? '' : 's'} left to explore.`, href: '#lessons', label: 'Open lessons' });
  if (Calc.activeGoals(s.goals).length) steps.push({ title: 'Record money you’ve set aside', text: 'Add what you’ve saved to a goal so your progress stays accurate.', href: '#goals', label: 'Go to goals' });
  if (s.budget.saved && rem >= 0) steps.push({ title: 'Review your budget this month', text: 'Life changes. A quick check keeps your plan realistic.', href: '#budget', label: 'Review budget' });
  return steps;
}

/* =====================================================================
 * 5. RENDERING
 * ===================================================================== */

/* ---------- Advisor: turns your budget, goals and expenses into suggestions (no DOM) ---------- */
const Advisor = {
  // Bills are needs. Flexible, unplanned and your own categories count as wants unless you mark them as needs.
  necessityOf(k, s) {
    if (ESSENTIAL_KEYS.includes(k)) return 'need';
    if (typeof k === 'string' && k.startsWith('c:')) { const c = s.customCategories.find(x => 'c:' + x.id === k); return c && c.type === 'need' ? 'need' : 'want'; }
    return 'want';
  },
  base(s) {
    const b = s.budget, month = currentMonth(), n = Calc.daysInMonth(month), elapsed = new Date().getDate();
    const by = Calc.spentByCategory(s.expenses, month);
    let needsSpent = 0, wantsSpent = 0;
    Object.keys(by).forEach(k => { if (Advisor.necessityOf(k, s) === 'need') needsSpent += by[k]; else wantsSpent += by[k]; });
    needsSpent = round2(needsSpent); wantsSpent = round2(wantsSpent);
    const hasBudget = b.saved, income = hasBudget ? num(b.income) : null;
    const needsPlan = Calc.essentials(b), wantsPlan = num(b.flexible), savings = num(b.savings);
    // Bills still due count as spent: free money = income − planned savings − the larger of planned/logged needs − wants logged
    const free = hasBudget ? round2(income - savings - Math.max(needsPlan, needsSpent) - wantsSpent) : null;
    return { month, n, elapsed, by, total: round2(needsSpent + wantsSpent), needsSpent, wantsSpent, hasBudget, income, needsPlan, wantsPlan, savings,
      rem: hasBudget ? Calc.remaining(b) : null, free, wantsLeft: hasBudget ? round2(wantsPlan - wantsSpent) : null };
  },
  analyze(s) {
    const a = Advisor.base(s), b = s.budget, F = [];
    const add = (level, id, title, text) => F.push({ level, id, title, text });
    const wantsTop = Object.entries(a.by).filter(([k, v]) => v > 0 && Advisor.necessityOf(k, s) === 'want').sort((x, y) => y[1] - x[1]).slice(0, 2);
    if (!a.hasBudget) {
      add('info', 'nobudget', 'Save a budget to get personal recommendations', 'Recommendations use your income, planned expenses and goals. Until then you can still log spending and use the “Should I spend on this?” check, with less detail.');
      a.findings = F; return a;
    }
    const income = a.income, rem = a.rem;
    // --- budget structure
    if (rem < 0) add('attention', 'overplan', `Your plan is ${fmt(-rem)} over your income`, `Planned expenses and savings add up to more than you earn. Common first steps are lowering flexible spending (now ${fmt(a.wantsPlan)}), reducing planned savings for a while, or checking whether any bill can be lowered.`);
    else if (rem === 0) add('good', 'assigned', 'Every dollar of your income has a job', `Your income is fully planned${a.savings > 0 ? `, including ${fmt(a.savings)} for savings` : ''}. If something unexpected comes up, flexible spending is the easiest place to adjust.`);
    else add('info', 'unassigned', `${fmt(rem)} a month has no job yet`, 'You could hold it as a buffer, put it toward a goal, or keep it as flexibility. Money without a purpose is easy to spend by accident, so it helps to choose.');
    if (income > 0 && a.needsPlan / income >= 0.7) {
      const big = ESSENTIAL_KEYS.map(k => [k, num(b[k])]).sort((x, y) => y[1] - x[1])[0];
      add('info', 'needsheavy', `Needs take ${Math.round((a.needsPlan / income) * 100)}% of your income`, `That leaves little room to adjust. The biggest lever is usually the size of the bills themselves${big && big[1] > 0 ? `, starting with ${catLabel(big[0])} (${fmt(big[1])})` : ''}, or your income. Saving may not be possible right now, and that’s okay.`);
    }
    if (b.debt > 0 && income > 0) add('info', 'debt', `Debt repayments are ${Math.round((b.debt / income) * 100)}% of your income`, 'Paying more than the minimum on debt with a high interest rate is often worth considering, but check the rate and any fees first. Your own numbers matter more than any rule of thumb.');

    // --- what you have actually logged this month
    if (a.total > 0) {
      const daysLeft = a.n - a.elapsed;
      if (a.free < 0) add('attention', 'nofree', 'Your money for this month is used up', `After bills, planned savings and the spending you’ve logged, you’re ${fmt(-a.free)} short for the rest of ${monthLabel(a.month)}. Pausing non-essential spending is the quickest fix.`);
      if (a.wantsPlan > 0 && a.wantsSpent > a.wantsPlan) {
        add('attention', 'wantsover', `Wants are ${fmt(a.wantsSpent - a.wantsPlan)} over your flexible budget`, `${wantsTop.length ? `Most went to ${wantsTop.map(([k, v]) => `${catLabel(k)} (${fmt(v)})`).join(' and ')}. ` : ''}If this is how a normal month looks, raise the planned amount so your plan matches real life.`);
      } else if (a.wantsPlan === 0 && a.wantsSpent > 0) {
        add('info', 'nowantsplan', `You’ve spent ${fmt(a.wantsSpent)} on wants with no flexible budget`, 'Adding a flexible amount in My Budget would let the app show how you’re doing against it.');
      } else if (a.wantsPlan > 0 && a.elapsed >= 5 && a.wantsSpent > 0) {
        const projected = round2((a.wantsSpent / a.elapsed) * a.n);
        if (projected > a.wantsPlan * 1.05) {
          const perDay = daysLeft > 0 ? round2((a.wantsPlan - a.wantsSpent) / daysLeft) : 0;
          add('attention', 'pace', `At this pace, wants reach ${fmt(projected)} this month`, `That would be ${fmt(projected - a.wantsPlan)} over the ${fmt(a.wantsPlan)} planned (estimate). About ${fmt(perDay)} a day for the rest of the month keeps you within plan.`);
        } else add('good', 'onpace', 'Your flexible spending is on track', `You’ve used ${fmt(a.wantsSpent)} of ${fmt(a.wantsPlan)} so far, which is in line with the days passed (estimate).`);
      }
      const high = ESSENTIAL_KEYS.filter(k => a.by[k] > num(b[k]));
      if (high.length) add('info', 'needsover', 'Some needs cost more than planned', `${high.map(k => `${catLabel(k)}: ${fmt(a.by[k])} against ${fmt(num(b[k]))} planned`).join('; ')}. If these amounts are normal, update your budget so future months are accurate.`);
      // compare daily wants spending with last month
      const pm = (() => { const [y, m] = a.month.split('-').map(Number); const d = new Date(y, m - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; })(), pby = Calc.spentByCategory(s.expenses, pm);
      let pWants = 0; Object.keys(pby).forEach(k => { if (Advisor.necessityOf(k, s) === 'want') pWants += pby[k]; });
      if (pWants > 0 && a.elapsed >= 10) {
        const cur = a.wantsSpent / a.elapsed, prev = pWants / Calc.daysInMonth(pm);
        if (cur > prev * 1.2) add('info', 'wantsup', 'Everyday wants are higher than last month', `Your daily average on wants is ${fmt(round2(cur))} against ${fmt(round2(prev))} last month.`);
        else if (cur < prev * 0.8) add('good', 'wantsdown', 'Everyday wants are lower than last month', `Your daily average on wants is ${fmt(round2(cur))} against ${fmt(round2(prev))} last month.`);
      }
      const days = new Set(s.expenses.filter(e => e.date.slice(0, 7) === a.month).map(e => e.date)).size;
      if (days >= 5) add('good', 'habit', `You’ve logged spending on ${days} days this month`, 'Regular tracking is what makes every figure on this page more reliable.');
    }

    // --- goals
    const plans = s.goals.map(g => ({ g, p: Calc.goalPlan(g) }));
    const active = plans.filter(x => x.p.status === 'active');
    const need = round2(active.reduce((t, x) => t + x.p.monthly, 0)), cap = Calc.savingCapacity(b);
    if (active.length) {
      if (need > cap) {
        const gap = round2(need - cap);
        add('attention', 'goalgap', `Your goals need ${fmt(need)} a month, but your plan leaves ${fmt(cap)}`,
          a.wantsPlan >= gap ? `Lowering flexible spending by ${fmt(gap)} a month would close the ${fmt(gap)} gap. Moving a deadline later or lowering a target would also work (estimate).` : 'Even with no flexible spending the gap would remain. Moving deadlines later or lowering targets is the realistic route (estimate).');
      } else add('good', 'goalsfit', 'Your goals fit your plan', `They need about ${fmt(need)} a month and your plan leaves about ${fmt(cap)} (estimate).`);
    }
    plans.filter(x => x.p.status === 'overdue').forEach(x => add('info', 'late-' + x.g.id, `“${x.g.name}” has passed its date`, `${fmt(x.p.remaining)} is still to go. You can pick a new date or adjust the target.`));
    const buffer = s.goals.find(g => /emergency|buffer|rainy|safety/i.test(g.name));
    if (!s.goals.length && (a.savings > 0 || rem > 0)) add('info', 'nogoal', 'Give your savings a purpose', `Goals make saving easier to keep up. A common first one is a buffer of a month of essentials (about ${fmt(a.needsPlan)} for you), but it’s your call.`);
    else if (s.goals.length && !buffer && a.needsPlan > 0) add('info', 'nobuffer', 'You don’t have a safety buffer goal yet', `Many people keep some money aside for surprises. A month of your essentials is about ${fmt(a.needsPlan)}, and any amount helps.`);
    else if (buffer && a.needsPlan > 0) add('info', 'buffer', `Your buffer covers about ${(buffer.saved / a.needsPlan).toFixed(1)} months of essentials`, `“${buffer.name}” holds ${fmt(buffer.saved)} against ${fmt(a.needsPlan)} of monthly essentials. How much is enough depends on how stable your income is.`);

    const order = { attention: 0, info: 1, good: 2 };
    F.sort((x, y) => order[x.level] - order[y.level]);
    a.findings = F; a.goalNeed = need; a.cap = cap;
    return a;
  },
  // Should this purchase be made? Answers from necessity and what the plan can cover.
  checkPurchase(s, inp) {
    const { price, kind, canWait } = inp, a = Advisor.base(s), reg = ECONOMY.regions[regionKey(s)];
    const out = { price, kind, canWait, reasons: [], options: [], numbers: [] };
    const rateTip = () => (reg.rateValue !== null ? `If you’re thinking of borrowing or paying later, the ${reg.rateName.toLowerCase()} in ${reg.name} is ${reg.rate} right now, so check the full cost first.` : null);
    if (!a.hasBudget) {
      out.verdict = 'nobudget';
      out.headline = kind === 'need' ? 'Needs usually come first, but I can’t check affordability yet.' : 'I can’t check affordability until you save a budget.';
      out.reasons.push(kind === 'need' ? 'A need is something you can’t do without for health, safety, work or study, so it generally takes priority over wants and extra savings.' : 'Wants are the first thing to adjust when money is tight, but without your budget I can’t tell whether this one fits.');
      out.options.push('Save your budget in My Budget, then run this check again for a specific answer.');
      return out;
    }
    const after = round2(a.free - price), cap = Calc.savingCapacity(s.budget);
    const wantsLeft = Math.max(0, a.wantsLeft);
    out.numbers.push(['Free money this month (estimate)', a.free < 0 ? `Short by ${fmt(-a.free)}` : fmt(a.free)]);
    out.numbers.push([after < 0 ? 'Short by, after buying' : 'Left after buying', fmt(Math.abs(after))]);
    if (a.wantsPlan > 0) out.numbers.push(['Flexible budget left', a.wantsLeft < 0 ? `Over by ${fmt(-a.wantsLeft)}` : fmt(a.wantsLeft)]);
    if (cap > 0) out.numbers.push(['Compared with a month of saving', `${Math.round((price / cap) * 100)}%`]);
    const saveFor = () => {
      if (cap > 0) { const m = Math.ceil(price / cap); out.options.push(`Make it a savings goal. At about ${fmt(cap)} a month it would take around ${m} month${m === 1 ? '' : 's'} (estimate).`); }
      else out.options.push('Your plan leaves little to save right now, so revisit this when your budget has room.');
    };
    if (kind === 'need') {
      if (after >= 0) {
        out.verdict = 'go'; out.headline = 'This is a need, and your plan can cover it.';
        out.reasons.push('Needs come before wants and extra savings.', `You have about ${fmt(a.free)} free this month, so it fits without touching bills or planned savings.`);
        out.options.push('Compare a couple of prices, or a simpler version that does the same job.');
        if (canWait) out.options.push('Since it can wait, a sale may lower the price.');
      } else {
        out.verdict = 'plan'; out.headline = `This is a need, but this month’s money is short by ${fmt(-after)}.`;
        out.reasons.push('Needs usually come first, so the question is how to cover it rather than whether to buy it.');
        if (wantsLeft > 0) out.options.push(`Use up to ${fmt(Math.min(wantsLeft, -after))} from your remaining flexible budget.`);
        out.options.push('Look for a cheaper, smaller or second-hand option that does the same job.', 'If it can be paid in parts, check for fees or interest first.');
        if (a.savings > 0) out.options.push(`Lower planned savings for one month (now ${fmt(a.savings)}), and top it back up later.`);
        const tip = rateTip(); if (tip) out.options.push(tip);
      }
    } else {
      if (kind === 'unsure') out.reasons.push('You’re not sure whether it’s a need. A quick test: if skipping it would hurt your health, safety, work or studies, treat it as a need.');
      if (after < 0) {
        out.verdict = 'hold'; out.headline = `Better to hold off. It would take you ${fmt(-after)} past what’s free this month.`;
        out.reasons.push('It’s a want, and this month’s money is already committed to bills and savings.');
        saveFor(); out.options.push('A cheaper or used alternative may give you most of the benefit.');
        const tip = rateTip(); if (tip) out.options.push(tip);
      } else if (price > wantsLeft) {
        out.verdict = 'caution'; out.headline = `Possible, but it goes ${fmt(price - wantsLeft)} over your flexible budget.`;
        out.reasons.push('It’s a want, so buying it means using money that is unassigned or meant for savings.');
        out.options.push('Wait until next month, when your flexible budget starts fresh.'); saveFor();
      } else if (wantsLeft > 0 && price / wantsLeft > 0.5) {
        out.verdict = 'caution'; out.headline = `It fits, but it uses ${Math.round((price / wantsLeft) * 100)}% of your remaining flexible budget.`;
        out.reasons.push(`It’s a want and fits inside the ${fmt(a.wantsLeft)} you have left for flexible spending.`, 'Bills and planned savings stay covered.');
        out.options.push(`You’d have ${fmt(round2(wantsLeft - price))} left for the rest of the month.`, 'A cheaper version might give you most of the enjoyment.');
      } else {
        out.verdict = 'go'; out.headline = 'A want that fits your flexible budget.';
        out.reasons.push(`It’s a want and fits inside the ${fmt(a.wantsLeft)} you have left for flexible spending.`, 'Bills and planned savings stay covered.');
        if (canWait) out.options.push('Waiting a few days costs nothing, and some wants fade.');
      }
    }
    return out;
  },
  economyNotes(s, reg) {
    const notes = [], i = reg.inflation, b = s.budget;
    notes.push(`Prices in ${reg.name} are about ${i}% higher than a year ago. Many central banks aim for around 2%.`);
    if (b.saved) {
      const E = Calc.essentials(b);
      if (E > 0) notes.push(`If your bills rise at that pace, ${fmt(E)} of monthly essentials becomes about ${fmt(round2(E * (1 + i / 100)))} in a year (estimate). Leaving a small cushion in your plan for rising bills can help.`);
    }
    s.goals.forEach(g => {
      const d = Dates.daysUntil(g.date);
      if (d !== null && d > 365 && Calc.goalRemaining(g) > 0) {
        const yrs = d / 365;
        notes.push(`“${g.name}” is due in about ${yrs.toFixed(1)} years. If its price rises with inflation, ${fmt(g.target)} today could be about ${fmt(round2(g.target * Math.pow(1 + i / 100, yrs)))} by then (estimate), so you may want to leave room in the target.`);
      }
    });
    if (reg.rateValue !== null) {
      notes.push(reg.rateValue < i
        ? `The central bank’s rate (${reg.rate}) is below inflation. That rate is a guide, not what your bank pays you, but money left in a low-interest account can lose buying power. It’s worth comparing what your savings earn.`
        : `The central bank’s rate (${reg.rate}) is above inflation. That rate is a guide, not what your bank pays you, but borrowing generally costs more when rates are higher, so check the full cost of any loan or pay-later plan.`);
    } else notes.push(reg.rateNote);
    if (reg.name === 'Cambodia') {
      notes.push('Transport is the fastest-rising cost right now. If you commute or send money for fuel, build a little extra into your transport budget and look at cheaper routes or sharing rides.');
      notes.push(`Food prices are rising about ${reg.facts[1].value} a year, which hits the biggest part of most budgets. Planning meals and buying staples in bulk can soften it.`);
      notes.push('Cambodia uses both the US dollar and the riel. Prices, savings and loans in dollars are not hurt by the riel rate moving, but dollars still lose buying power when local prices rise. If your income is in riel and your savings or debts are in dollars (or the other way round), a change in the exchange rate can change what they are worth to you.');
      notes.push('With growth slowing and bank lending weaker, jobs and pay may rise more slowly than prices. A small emergency fund is worth more in a slow year; even one month of essentials helps.');
      notes.push('The IMF also flags scam activity and weak financial integrity. Be careful with offers of high, guaranteed returns, and check that a bank or lender is licensed by the National Bank of Cambodia before handing over money.');
    }
    if (b.saved && b.debt > 0) notes.push(`You’ve planned ${fmt(b.debt)} a month for debt. If the interest rate on it can change, higher market rates can raise the cost, so check the terms.`);
    return notes;
  }
};

function renderAll() {
  renderHeader();
  renderDashboard();
  refreshBudgetSummary();
  renderSpending();
  renderInsights();
  renderGoals();
  renderLessons();
  renderProgress();
  renderSettings();
  document.querySelectorAll('.cur-symbol').forEach(n => { n.textContent = currencySymbol(state.profile.currency); });
}

function renderHeader() {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const name = state.profile.name;
  setText('greeting', name ? `${part}, ${name}. Welcome back.` : `${part}. Welcome to MoneySteps.`);
  setText('today-date', new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
  setText('profile-name', name || 'Guest');
  const av = $('avatar');
  av.replaceChildren(name ? document.createTextNode(Array.from(name)[0].toUpperCase()) : icon('user'));
}

/* ---------- Dashboard ---------- */
function emptyState(iconName, text, href, btn) {
  return el('div', { class: 'empty' }, icon(iconName), el('p', { text }), href ? el('a', { class: 'btn btn-secondary btn-sm', href, text: btn }) : null);
}

function renderDashboard() {
  const b = state.budget;
  const hasAny = b.saved || state.goals.length > 0 || Object.keys(state.lessons.completed).length > 0;
  $('onboarding').hidden = hasAny;

  const sub = $('stat-available-sub');
  sub.className = 'stat-sub';
  if (!b.saved) {
    setText('stat-income', '—'); setText('stat-expenses', '—'); setText('stat-available', '—');
    setText('stat-income-sub', 'Add your budget to see this');
    setText('stat-expenses-sub', 'Add your budget to see this');
    sub.textContent = 'Add your budget to see this';
  } else {
    const rem = Calc.remaining(b);
    setText('stat-income', fmt(b.income));
    setText('stat-income-sub', 'Your entry');
    setText('stat-expenses', fmt(Calc.totalExpenses(b)));
    setText('stat-expenses-sub', `Calculated · plus ${fmt(b.savings)} planned savings`);
    // Never show a negative balance as available money
    setText('stat-available', fmt(Math.max(0, rem)));
    if (rem < 0) { sub.textContent = `Plan is ${fmt(-rem)} over income. See My Budget.`; sub.classList.add('warn'); }
    else sub.textContent = 'Calculated · after expenses and planned savings';
  }
  setText('stat-savings', fmt(Calc.totalSaved(state.goals)));
  setText('stat-savings-sub', state.goals.length ? `Across ${state.goals.length} goal${state.goals.length === 1 ? '' : 's'} · your entries` : 'No goals yet');

  // Goals
  const dg = $('dash-goals');
  if (!state.goals.length) dg.replaceChildren(emptyState('bullseye', 'No savings goals yet. A goal can be as small as you like.', '#goals', 'Create a goal'));
  else {
    const pct = Calc.overallPct(state.goals);
    dg.replaceChildren(
      el('div', { class: 'mini-goal' },
        el('div', { class: 'progress-label' }, el('strong', { text: 'Overall' }), el('span', { text: `${pct}% of ${fmt(Calc.totalTarget(state.goals))}` })),
        progressBar(pct, 'Overall savings goal progress')),
      ...state.goals.slice(0, 3).map(g => el('div', { class: 'mini-goal' },
        el('div', { class: 'progress-label' }, el('span', { text: g.name }), el('span', { text: `${Calc.goalPct(g)}%` })),
        progressBar(Calc.goalPct(g), `${g.name} progress`)))
    );
  }

  // Next step
  const urgent = Advisor.analyze(state).findings.find(f => f.level === 'attention');
  const step = urgent ? { title: urgent.title, text: urgent.text, href: '#insights', label: 'See all insights' } : nextSteps(state)[0];
  $('next-action').replaceChildren(step
    ? el('div', {}, el('p', { class: 'next-title', text: step.title }), el('p', { text: step.text }), el('a', { class: 'btn btn-primary', href: step.href, text: step.label }))
    : el('p', { text: 'You’re all caught up. Nice work.' }));

  // Learning activity
  const done = Object.entries(state.lessons.completed).sort((a, b2) => new Date(b2[1].at) - new Date(a[1].at)).slice(0, 3);
  $('dash-learning').replaceChildren(done.length
    ? el('ul', { class: 'activity-list' }, done.map(([id, c]) => {
      const l = LESSONS.find(x => x.id === id);
      return el('li', {}, icon('circle-check'), el('div', {}, el('strong', { text: l.title }), el('span', { class: 'when', text: `${l.topic} · ${Dates.showIso(c.at)}` })));
    }))
    : emptyState('lightbulb', 'No lessons completed yet.', '#lessons', 'Try a lesson'));
  renderDashSpending();
}

function progressBar(pct, label) {
  const fill = el('div', { class: 'progress-fill' });
  fill.style.width = `${pct}%`;
  return el('div', { class: 'progress', role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) }, fill);
}

/* ---------- Budget ---------- */
// Draws the plan summary + allocation chart from any set of budget values
// (live form values while typing, or the saved budget otherwise).
function renderBudgetSummary(v, isDraft) {
  const income = num(v.income), total = Calc.totalExpenses(v), savings = num(v.savings), rem = Calc.remaining(v);
  setText('sum-income', fmt(income));
  setText('sum-expenses', fmt(total));
  setText('sum-savings', fmt(savings));

  const lbl = $('sum-remaining-label'), dd = $('sum-remaining');
  dd.className = '';
  if (rem < 0) { lbl.textContent = 'Shortfall (not available money)'; dd.textContent = fmt(-rem); dd.classList.add('shortfall'); }
  else { lbl.textContent = 'Remaining'; dd.textContent = fmt(rem); }

  // Status message
  const afterEssentials = round2(income - Calc.essentials(v));
  const box = $('budget-status');
  box.className = 'callout';
  let title = '', msg = '';
  if (income === 0 && total === 0 && savings === 0) {
    msg = isDraft || !state.budget.saved ? 'Enter your income and expenses to see your plan. Everything updates as you type.' : 'Your saved plan is all zeros. Enter your numbers to get started.';
  } else if (rem < 0) {
    box.classList.add('warn'); title = 'Your plan is over income';
    msg = `Planned spending and savings are ${fmt(-rem)} more than your income. That’s common, and it’s fixable: you could lower flexible spending, reduce planned savings for now, or look at whether any essentials can change. Nothing here is a judgment, and the remaining balance is shown as 0 rather than a negative amount.`;
  } else if (income > 0 && afterEssentials <= 0) {
    box.classList.add('warn'); title = 'Essentials use all of your income';
    msg = 'After essential expenses there’s nothing left over. That happens to many people, especially on a low or irregular income. Saving isn’t always possible, and you can adjust the plan whenever things change. Setting planned savings to 0 is completely fine.';
  } else if (rem === 0) {
    title = 'Every amount is assigned';
    msg = 'Your income is fully planned, with nothing left unassigned. If something unexpected comes up, flexible spending is the easiest place to adjust.';
  } else {
    title = 'You have money left to assign';
    msg = `${fmt(rem)} is unassigned each month. You choose: keep it as a buffer, put it towards a goal, or use it flexibly.`;
  }
  box.replaceChildren(title ? el('p', { class: 'callout-title' }, icon(box.classList.contains('warn') ? 'triangle-exclamation' : 'circle-info'), title) : null, el('p', { text: msg }));

  // Allocation bar + table (percent of everything planned, so the bar always fits)
  const rows = BREAKDOWN.map(b => ({ ...b, amount: num(v[b.key]) }));
  const outflow = round2(rows.reduce((s, r) => s + r.amount, 0));
  const bar = $('alloc-bar'), body = $('alloc-body');
  bar.replaceChildren(); body.replaceChildren();
  rows.forEach(r => {
    const pct = outflow > 0 ? (r.amount / outflow) * 100 : 0;
    if (r.amount > 0) {
      const seg = el('div', { class: `alloc-seg ${r.cls}`, title: `${FIELD_LABEL[r.key]}: ${Math.round(pct)}%` });
      seg.style.width = `${pct}%`;
      bar.append(seg);
    }
    body.append(el('tr', {},
      el('td', {}, el('span', { class: `swatch ${r.cls}`, 'aria-hidden': 'true' }), FIELD_LABEL[r.key]),
      el('td', { class: 'num', text: fmt(r.amount) }),
      el('td', { class: 'num', text: outflow > 0 ? `${Math.round(pct)}%` : '0%' })));
  });
  bar.setAttribute('aria-label', outflow > 0 ? 'Allocation of planned spending and savings by category. See the table below for exact amounts.' : 'No spending entered yet');
  setText('alloc-note', income > 0 && outflow > 0
    ? `Shares are of everything you’ve planned (${fmt(outflow)}), which is ${Math.round((outflow / income) * 100)}% of your income.`
    : 'Shares are calculated from the amounts you’ve entered.');
}

/* ---------- Daily spending ---------- */
const currentMonth = () => Dates.toInput(new Date()).slice(0, 7);
function monthLabel(m) {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function renderDashSpending() {
  const month = currentMonth(), b = state.budget;
  const total = Calc.sum(Calc.spentByCategory(state.expenses, month));
  const box = $('dash-spending');
  if (!state.expenses.some(e => e.date.slice(0, 7) === month)) {
    box.replaceChildren(emptyState('receipt', 'Nothing logged this month yet. Add what you spend as you go to see it here.', '#spending', 'Log an expense'));
    return;
  }
  const today = Calc.spentOn(state.expenses, Dates.toInput(new Date()));
  const kids = [];
  if (b.saved) {
    const income = num(b.income);
    const pct = income > 0 ? Math.min(100, Math.floor((total / income) * 100)) : 100;
    kids.push(
      el('div', { class: 'progress-label' }, el('strong', { text: monthLabel(month) }), el('span', { text: `${fmt(total)} of ${fmt(income)} income` })),
      progressBar(pct, 'Spending this month compared with monthly income'),
      el('p', { class: 'muted small', style: 'margin-top:10px', text: total > income ? `That’s ${fmt(total - income)} more than your monthly income. It happens, and you can review your budget any time.` : `${fmt(income - total)} of your income left this month.` }));
  } else {
    kids.push(el('p', {}, el('strong', { text: fmt(total) }), ` spent so far in ${monthLabel(month)}. `, el('a', { href: '#budget', text: 'Save a budget' }), ' to compare it with your income.'));
  }
  kids.push(el('p', { class: 'muted small', text: `Today: ${fmt(today)}` }), el('a', { class: 'btn btn-secondary btn-sm', href: '#spending', text: 'Log an expense' }));
  box.replaceChildren(...kids);
}

function renderSpending() {
  const month = ui.spMonth, b = state.budget, now = currentMonth();
  if ($('sp-month').value !== month) $('sp-month').value = month;
  refreshCategoryOptions();
  $('sp-newcat-field').hidden = $('sp-category').value !== '__new';
  renderCustomCategories();
  const spent = Calc.spentByCategory(state.expenses, month);
  const total = Calc.sum(spent);

  // Form mode
  const editing = ui.editingExpenseId ? state.expenses.find(x => x.id === ui.editingExpenseId) : null;
  if (ui.editingExpenseId && !editing) ui.editingExpenseId = null;
  setText('sp-form-title', editing ? 'Edit expense' : 'Log an expense');
  setText('sp-submit', editing ? 'Save changes' : 'Add expense');
  $('sp-cancel').hidden = !editing;

  // Month summary: income vs what you've spent
  const income = b.saved ? num(b.income) : null;
  setText('sp-today', fmt(Calc.spentOn(state.expenses, Dates.toInput(new Date()))));
  setText('sp-month-total', fmt(total));
  setText('sp-income', income === null ? 'Not set' : fmt(income));
  const left = $('sp-left'), status = $('sp-status');
  left.className = '';
  status.className = 'callout';
  if (income === null) {
    setText('sp-left-label', 'Money left');
    left.textContent = '—';
    status.replaceChildren(el('p', {}, el('a', { href: '#budget', text: 'Save your budget' }), ' with your monthly income and this page will show how much of it is left.'));
  } else if (total > income) {
    setText('sp-left-label', 'Over income by');
    left.textContent = fmt(total - income);
    left.classList.add('shortfall');
    status.classList.add('warn');
    status.replaceChildren(el('p', { class: 'callout-title' }, icon('triangle-exclamation'), 'You’ve spent more than your income'),
      el('p', { text: `You’ve logged ${fmt(total - income)} more than your monthly income for ${monthLabel(month)}. That can happen with savings or one-off costs. You could review your budget, or just keep tracking.` }));
  } else {
    setText('sp-left-label', 'Money left');
    left.textContent = fmt(income - total);
    const pct = income > 0 ? Math.round((total / income) * 100) : 0;
    status.replaceChildren(el('p', { text: `You’ve spent ${pct}% of your monthly income in ${monthLabel(month)}. This only counts what you’ve logged, so it’s as complete as your entries.` }));
  }
  const days = month === now ? new Date().getDate() : month > now ? 1 : Calc.daysInMonth(month);
  setText('sp-avg', fmt(round2(total / days)));
  setText('sp-avg-label', month === now ? `Daily average (${days} day${days === 1 ? '' : 's'} so far)` : 'Daily average');

  // Category breakdown
  const rows = allSpendCats().map(k => {
    const plan = b.saved && EXPENSE_KEYS.includes(k) ? num(b[k]) : 0;
    return { k, plan, spent: spent[k] };
  }).filter(r => r.plan > 0 || r.spent > 0);
  $('sp-cats').replaceChildren(...(rows.length ? rows.map(r => {
    const pct = r.plan > 0 ? Math.min(100, Math.floor((r.spent / r.plan) * 100)) : (r.spent > 0 ? 100 : 0);
    const over = r.plan > 0 && r.spent > r.plan;
    const text = r.plan > 0 ? `${fmt(r.spent)} of ${fmt(r.plan)}${over ? ` · over by ${fmt(r.spent - r.plan)}` : ''}` : `${fmt(r.spent)} · nothing planned`;
    return el('div', { class: 'mini-goal' },
      el('div', { class: 'progress-label' }, el('span', {}, over ? icon('triangle-exclamation') : null, over ? ' ' : null, catLabel(r.k)), el('span', { text })),
      progressBar(pct, `${catLabel(r.k)} spending`));
  }) : [el('p', { class: 'muted', text: 'Categories will appear here once you log an expense or save a budget.' })]));

  // Entry list, grouped by day
  const items = state.expenses.filter(x => x.date.slice(0, 7) === month)
    .sort((a, c) => c.date.localeCompare(a.date) || String(c.createdAt).localeCompare(String(a.createdAt)));
  const list = $('sp-list');
  if (!items.length) { list.replaceChildren(emptyState('receipt', `No expenses logged for ${monthLabel(month)} yet. Use the form above to add your first one.`)); return; }
  const groups = [];
  items.forEach(x => {
    let g = groups[groups.length - 1];
    if (!g || g.date !== x.date) { g = { date: x.date, items: [] }; groups.push(g); }
    g.items.push(x);
  });
  list.replaceChildren(...groups.map(g => el('section', { class: 'day-group' },
    el('h3', { class: 'day-head' }, el('span', { text: Dates.show(Dates.parse(g.date)) }), el('span', { class: 'day-total', text: fmt(g.items.reduce((s, x) => round2(s + x.amount), 0)) })),
    el('ul', { class: 'exp-list' }, g.items.map(expenseRow)))));
}

function renderCustomCategories() {
  $('sp-custom-card').hidden = !state.customCategories.length;
  $('sp-custom-list').replaceChildren(...state.customCategories.map(c => {
    const n = state.expenses.filter(x => x.category === 'c:' + c.id).length;
    return el('li', { class: 'exp-row' },
      el('div', { class: 'exp-main' }, el('strong', { text: c.name }), el('span', { class: 'muted small', text: `${n} expense${n === 1 ? '' : 's'} logged` })),
      el('label', { class: 'type-pick' }, el('span', { class: 'visually-hidden', text: `Is ${c.name} a need or a want?` }),
        el('select', { onchange: e => { c.type = e.target.value === 'need' ? 'need' : 'want'; commit(); } },
          el('option', { value: 'want', text: 'Want', selected: c.type !== 'need' ? true : null }), el('option', { value: 'need', text: 'Need', selected: c.type === 'need' ? true : null }))),
      el('div', { class: 'exp-actions' },
        el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => deleteCustomCategory(c.id), 'aria-label': `Remove category ${c.name}` }, icon('trash-can'), ' Remove')));
  }));
}

function expenseRow(x) {
  return el('li', { class: 'exp-row' },
    el('div', { class: 'exp-main' }, el('span', { class: 'tag', text: catLabel(x.category) }), x.note ? el('span', { class: 'exp-note', text: x.note }) : null),
    el('strong', { class: 'exp-amount', text: fmt(x.amount) }),
    el('div', { class: 'exp-actions' },
      el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => editExpense(x.id), 'aria-label': `Edit ${fmt(x.amount)} ${catLabel(x.category)} expense` }, icon('pen')),
      el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => deleteExpense(x.id), 'aria-label': `Delete ${fmt(x.amount)} ${catLabel(x.category)} expense` }, icon('trash-can'))));
}

/* ---------- Insights ---------- */
function renderInsights() {
  const a = Advisor.analyze(state);
  renderStand(a);
  renderFindings(a);
  renderCheckResult();
  renderEconomy();
}

function renderStand(a) {
  const box = $('ins-stand');
  if (!a.hasBudget) { box.replaceChildren(emptyState('wallet', 'Save your budget to see where your money stands.', '#budget', 'Open My Budget')); return; }
  const pct = v => (a.income > 0 ? `${Math.round((v / a.income) * 100)}%` : '0%');
  const unassigned = Math.max(0, a.rem);
  const parts = [
    { label: 'Needs (bills)', cls: 'c0', plan: a.needsPlan, logged: a.needsSpent },
    { label: 'Wants (flexible)', cls: 'c4 p-dots', plan: a.wantsPlan, logged: a.wantsSpent },
    { label: 'Planned savings', cls: 'c7', plan: a.savings, logged: null }
  ];
  const total = Math.max(a.income, parts.reduce((t, p) => t + p.plan, 0)) || 1;
  const bar = el('div', { class: 'alloc-bar', role: 'img', 'aria-label': `Planned split of income: needs ${pct(a.needsPlan)}, wants ${pct(a.wantsPlan)}, savings ${pct(a.savings)}, unassigned ${pct(unassigned)}. Exact amounts are in the table below.` });
  parts.forEach(p => { if (p.plan > 0) { const seg = el('div', { class: `alloc-seg ${p.cls}`, title: `${p.label}: ${fmt(p.plan)}` }); seg.style.width = `${(p.plan / total) * 100}%`; bar.append(seg); } });
  const rows = parts.map(p => el('tr', {},
    el('td', {}, el('span', { class: `swatch ${p.cls}`, 'aria-hidden': 'true' }), p.label),
    el('td', { class: 'num', text: fmt(p.plan) }), el('td', { class: 'num', text: pct(p.plan) }),
    el('td', { class: 'num', text: p.logged === null ? '—' : fmt(p.logged) })));
  rows.push(el('tr', {}, el('td', {}, el('span', { class: 'swatch', 'aria-hidden': 'true' }), a.rem < 0 ? 'Over income by' : 'Unassigned'), el('td', { class: 'num', text: fmt(Math.abs(a.rem)) }), el('td', { class: 'num', text: pct(Math.abs(a.rem)) }), el('td', { class: 'num', text: '—' })));
  box.replaceChildren(
    el('p', { class: 'muted small', text: `Planned from your budget (income ${fmt(a.income)} a month). “Logged” is what you’ve recorded in ${monthLabel(a.month)}.` }),
    bar,
    el('table', { class: 'alloc-table' }, el('caption', { class: 'visually-hidden', text: 'Needs, wants and savings: planned and logged' }),
      el('thead', {}, el('tr', {}, ['Group', 'Planned', 'Of income', 'Logged'].map((t, i) => el('th', { scope: 'col', class: i ? 'num' : '', text: t })))), el('tbody', {}, rows)),
    el('dl', { class: 'summary-list', style: 'margin-top:12px' },
      el('div', { class: 'summary-total' }, el('dt', { text: 'Free money left this month' }), el('dd', { class: a.free < 0 ? 'shortfall' : null, text: a.free < 0 ? `Short by ${fmt(-a.free)}` : fmt(a.free) }))),
    el('p', { class: 'muted small', text: 'Free money = income − planned savings − bills (planned, or logged if higher) − wants logged. It’s an estimate, so it’s only as complete as your entries.' }));
}

function renderFindings(a) {
  const LV = { attention: ['triangle-exclamation', 'Needs attention', 'badge badge-late'], info: ['circle-info', 'Worth knowing', 'badge badge-neutral'], good: ['circle-check', 'Going well', 'badge badge-done'] };
  $('ins-findings').replaceChildren(el('ul', { class: 'finding-list' }, a.findings.map(f => el('li', { class: `finding finding-${f.level}` },
    el('span', { class: 'finding-icon' }, icon(LV[f.level][0])),
    el('div', {}, el('div', { class: 'finding-head' }, el('strong', { text: f.title }), el('span', { class: LV[f.level][2], text: LV[f.level][1] })), el('p', { text: f.text }))))),
    el('p', { class: 'muted small', text: 'Suggestions come from your own entries and simple calculations. They’re educational, not financial advice, and you know your situation best.' }));
}

function renderCheckResult() {
  const box = $('ins-result'), c = ui.lastCheck;
  if (!c) { box.replaceChildren(); return; }
  const r = Advisor.checkPurchase(state, c);
  const V = { go: ['level-strong', 'circle-check', 'Fits your plan'], caution: ['level-depends', 'scale-balanced', 'Possible, with trade-offs'], plan: ['level-depends', 'scale-balanced', 'Needed, so plan how to cover it'], hold: ['level-rethink', 'magnifying-glass', 'Better to hold off for now'], nobudget: ['level-depends', 'circle-info', 'Save a budget for a personal answer'] }[r.verdict];
  box.replaceChildren(el('div', { class: 'feedback', role: 'status' },
    el('span', { class: `level ${V[0]}` }, icon(V[1]), V[2]),
    el('h3', { text: `${c.name ? `${c.name} (${fmt(c.price)}): ` : `${fmt(c.price)}: `}${r.headline}` }),
    r.reasons.length ? el('ul', { class: 'plain-list' }, r.reasons.map(t => el('li', { text: t }))) : null,
    r.options.length ? el('div', {}, el('p', { class: 'finding-sub', text: 'Ways to handle it' }), el('ul', { class: 'plain-list' }, r.options.map(t => el('li', { text: t })))) : null,
    r.numbers.length ? el('dl', { class: 'kv' }, r.numbers.map(([k, v]) => el('div', {}, el('dt', { text: k }), el('dd', { text: v })))) : null,
    el('p', { class: 'muted small', text: 'This is an estimate from your budget and what you’ve logged this month. It’s a decision aid, not financial advice.' })));
}

function renderEconomy() {
  const key = regionKey(state), reg = ECONOMY.regions[key];
  $('ins-region').value = key;
  const asOf = Dates.show(Dates.parse(ECONOMY.asOf));
  $('ins-economy').replaceChildren(
    el('dl', { class: 'perf-grid' },
      el('div', { class: 'perf-item' }, el('dt', { text: 'Inflation (yearly)' }), el('dd', { text: `${reg.inflation}%` }), el('dd', { class: 'muted small', text: reg.inflationLabel })),
      el('div', { class: 'perf-item' }, el('dt', { text: reg.rateName }), el('dd', { text: reg.rate }), el('dd', { class: 'muted small', text: reg.rateNote }))),
    reg.facts ? el('dl', { class: 'perf-grid' }, reg.facts.map(f => el('div', { class: 'perf-item' }, el('dt', { text: f.label }), el('dd', { text: f.value }), el('dd', { class: 'muted small', text: f.note })))) : null,
    el('h3', { text: 'What this means for you' }),
    el('ul', { class: 'plain-list' }, Advisor.economyNotes(state, reg).map(t => el('li', { text: t }))),
    el('p', { class: 'muted small', text: `Snapshot researched on ${asOf}. This app can’t fetch live data, so these numbers stay fixed until they’re refreshed. Check the central bank or statistics office for the latest.` }),
    el('p', { class: 'muted small' }, 'Sources: ', ...reg.sources.flatMap((s, i) => [i ? ', ' : '', el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer', text: s.title })])));
}

/* ---------- Goals ---------- */
function renderGoals() {
  const list = $('goals-list'), sum = $('goals-summary');
  const goals = [...state.goals].sort((a, b) => {
    const ca = Calc.goalRemaining(a) <= 0, cb = Calc.goalRemaining(b) <= 0;
    if (ca !== cb) return ca ? 1 : -1;
    return String(a.date).localeCompare(String(b.date));
  });

  if (!goals.length) {
    sum.replaceChildren();
    list.replaceChildren(el('div', { class: 'card', style: 'grid-column: 1 / -1' }, emptyState('bullseye', 'You haven’t set a goal yet. Start with something you care about, like a laptop, a trip or a safety buffer.')));
    return;
  }

  // Overall affordability note
  const cap = Calc.savingCapacity(state.budget);
  const plans = Calc.activeGoals(state.goals).map(Calc.goalPlan).filter(p => p.status === 'active');
  const need = round2(plans.reduce((s, p) => s + p.monthly, 0));
  let note = null;
  if (plans.length) {
    if (cap === null) note = el('div', { class: 'callout' }, el('p', {}, `Your active goals would need about ${fmt(need)} per month in total. `, el('a', { href: '#budget', text: 'Add your budget' }), ' to check how that fits.'));
    else if (need > cap) note = el('div', { class: 'callout warn' }, el('p', { class: 'callout-title' }, icon('triangle-exclamation'), 'Your goals add up to more than your plan allows'), el('p', { text: `Together they need about ${fmt(need)} per month, but your plan leaves about ${fmt(cap)} for saving. You could move a deadline, lower a target, or free up money in your budget. Pick whichever suits you.` }));
    else note = el('div', { class: 'callout' }, el('p', { text: `Your active goals need about ${fmt(need)} per month in total, and your plan leaves about ${fmt(cap)} for saving. This is an estimate based on your entries.` }));
  }
  sum.replaceChildren(note);
  list.replaceChildren(...goals.map(goalCard));
}

function goalCard(g) {
  const plan = Calc.goalPlan(g);
  const pct = Calc.goalPct(g);
  const cap = Calc.savingCapacity(state.budget);
  const lines = [];

  if (plan.status === 'complete') lines.push(el('p', { text: 'Goal reached. You’ve saved the full target.' }));
  else if (plan.status === 'overdue') lines.push(el('p', { text: `The target date has passed with ${fmt(plan.remaining)} still to go. You can set a new date or adjust the target. There’s no pressure.` }));
  else if (plan.status === 'due-today') lines.push(el('p', { text: `The target date is today, with ${fmt(plan.remaining)} remaining. Edit the goal if you’d like more time.` }));
  else if (plan.status === 'invalid') lines.push(el('p', { text: 'This goal’s date isn’t valid. Edit the goal to choose a new one.' }));
  else {
    lines.push(el('p', {}, el('span', { class: 'tag tag-calc', text: 'Estimate' }), `About ${fmt(plan.monthly)} per month for ${plan.months} month${plan.months === 1 ? '' : 's'} (${fmt(plan.remaining)} ÷ ${plan.months}, months rounded up).`));
    if (cap === null) lines.push(el('p', {}, el('a', { href: '#budget', text: 'Add your budget' }), ' to check whether this fits your plan.'));
    else if (cap <= 0) lines.push(el('p', { text: 'Your plan currently leaves nothing for saving. That’s okay. You can extend the deadline or lower the target until it fits, or revisit your budget when things change.' }));
    else if (plan.monthly <= cap) lines.push(el('p', { text: `Your plan leaves about ${fmt(cap)} per month for saving (planned savings plus unassigned money), so this looks possible if it all went to this goal. Other goals share the same money.` }));
    else {
      const m = Math.ceil(plan.remaining / cap);
      lines.push(el('p', { text: `That’s more than the ${fmt(cap)} per month your plan leaves for saving. Trade-offs: move the deadline later (around ${Dates.show(Dates.addMonths(Dates.today(), m))} at that pace), lower the target, or free up money in your budget. Edit this goal to try different numbers.` }));
    }
  }
  if (plan.status !== 'complete') {
    const est = Calc.estimate(g, state);
    if (est) lines.push(el('p', {}, el('span', { class: 'tag tag-calc', text: 'Estimate' }), `If you set aside about ${fmt(est.share)} per month (planned savings split evenly across active goals), you’d finish around ${Dates.show(est.date)}.`));
    else if (plan.status !== 'invalid') lines.push(el('p', { class: 'muted', text: 'Add planned savings in My Budget to see an estimated completion date.' }));
  }

  const date = Dates.parse(g.date);
  const badge = plan.status === 'complete' ? el('span', { class: 'badge badge-done' }, icon('check'), ' Completed')
    : plan.status === 'overdue' ? el('span', { class: 'badge badge-late', text: 'Date passed' })
      : plan.status === 'due-today' ? el('span', { class: 'badge badge-late', text: 'Due today' }) : null;

  return el('article', { class: 'card goal-card' },
    el('div', { class: 'goal-top' }, el('h3', { text: g.name }), badge),
    g.desc ? el('p', { class: 'goal-desc', text: g.desc }) : null,
    el('div', { class: 'progress-label' }, el('span', { text: `${pct}% saved` }), el('span', { text: `${fmt(g.saved)} of ${fmt(g.target)}` })),
    progressBar(pct, `${g.name} progress`),
    el('dl', { class: 'metrics' },
      el('div', {}, el('dt', { text: 'Saved so far' }), el('dd', { text: fmt(g.saved) })),
      el('div', {}, el('dt', { text: 'Amount remaining' }), el('dd', { text: fmt(plan.remaining) })),
      el('div', {}, el('dt', { text: 'Target date' }), el('dd', { text: date ? Dates.show(date) : 'Not set' }))),
    el('div', { class: 'plan-box' }, lines),
    el('div', { class: 'goal-actions' },
      el('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: () => openContribute(g.id), disabled: plan.status === 'complete' ? true : null },
        icon('plus'), ' Add money'),
      el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => openGoalDialog(g.id), 'aria-label': `Edit ${g.name}` }, icon('pen'), ' Edit'),
      el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => deleteGoal(g.id), 'aria-label': `Delete ${g.name}` }, icon('trash-can'), ' Delete')));
}

/* ---------- Lessons ---------- */
function renderLessons() {
  const done = Object.keys(state.lessons.completed).length;
  const flex = Object.entries(state.lessons.completed).filter(([id, c]) => LESSONS.find(l => l.id === id).options[c.choice].level === 'strong').length;
  setText('lesson-count', `${done} of ${LESSONS.length}`);
  setText('lesson-score', String(flex));

  ui.lessonIndex = Math.min(Math.max(ui.lessonIndex, 0), LESSONS.length - 1);
  const lesson = LESSONS[ui.lessonIndex];
  const result = state.lessons.completed[lesson.id];

  $('lesson-chips').replaceChildren(...LESSONS.map((l, i) => {
    const isDone = !!state.lessons.completed[l.id];
    return el('button', {
      type: 'button', class: `chip${isDone ? ' done' : ''}`, 'aria-current': i === ui.lessonIndex ? 'true' : null,
      'aria-label': `Scenario ${i + 1}: ${l.title}${isDone ? ', completed' : ''}`,
      onclick: () => { ui.lessonIndex = i; ui.selected = null; ui.lessonError = ''; renderLessons(); }
    }, isDone ? icon('circle-check') : null, `${i + 1}. ${l.topic}`);
  }));

  const card = $('lesson-card');
  const letters = ['A', 'B', 'C'];
  const selected = result ? result.choice : ui.selected;

  const optionEls = lesson.options.map((o, i) => el('label', { class: `option${result ? ' locked' : ''}` },
    el('input', {
      type: 'radio', name: 'lesson-option', value: String(i), checked: selected === i ? true : null, disabled: result ? true : null,
      onchange: () => { ui.selected = i; ui.lessonError = ''; const e = $('lesson-error'); if (e) e.textContent = ''; }
    }),
    el('span', {},
      el('span', {}, el('span', { class: 'opt-letter', text: `${letters[i]}.` }), o.text),
      result ? el('span', { class: 'opt-explain' },
        el('span', { class: `level level-${o.level}` }, icon(LEVELS[o.level].icon), LEVELS[o.level].label),
        el('br'), o.why) : null)));

  const chosen = result ? lesson.options[result.choice] : null;
  const isLast = ui.lessonIndex === LESSONS.length - 1;

  card.replaceChildren(
    el('p', { class: 'lesson-topic', text: `Scenario ${ui.lessonIndex + 1} of ${LESSONS.length} · ${lesson.topic}` }),
    el('h2', { text: lesson.title }),
    el('p', { class: 'situation', text: lesson.situation(fmt) }),
    el('form', { id: 'lesson-form', novalidate: true, onsubmit: submitLesson },
      el('fieldset', { class: 'options' }, el('legend', { text: 'What would you do?' }), optionEls),
      el('p', { id: 'lesson-error', class: 'error', role: 'alert', text: ui.lessonError }),
      result ? null : el('button', { type: 'submit', class: 'btn btn-primary' }, 'Check my answer')),
    result ? el('div', { class: 'feedback', role: 'status' },
      el('h3', {}, `You chose ${letters[result.choice]}: ${LEVELS[chosen.level].label}`),
      el('p', { text: chosen.why }),
      el('p', { class: 'muted', text: lesson.takeaway })) : null,
    el('div', { class: 'lesson-nav' },
      el('button', { type: 'button', class: 'btn btn-ghost', disabled: ui.lessonIndex === 0 ? true : null, onclick: () => goLesson(-1) }, icon('arrow-left'), ' Previous'),
      isLast
        ? el('a', { class: `btn ${result ? 'btn-primary' : 'btn-ghost'}`, href: '#progress' }, 'See my progress ', icon('arrow-right'))
        : el('button', { type: 'button', class: `btn ${result ? 'btn-primary' : 'btn-ghost'}`, onclick: () => goLesson(1) }, result ? 'Next scenario ' : 'Skip for now ', icon('arrow-right'))));
}

/* ---------- Progress ---------- */
function kv(rows) { return el('dl', { class: 'kv' }, rows.map(([k, v]) => el('div', {}, el('dt', { text: k }), el('dd', { text: v })))); }

function renderProgress() {
  const b = state.budget;
  const rem = Calc.remaining(b);

  $('prog-budget').replaceChildren(b.saved
    ? el('div', {}, kv([
      ['Monthly income', fmt(b.income)],
      ['Planned expenses', fmt(Calc.totalExpenses(b))],
      ['Planned savings', fmt(b.savings)],
      [rem < 0 ? 'Shortfall' : 'Remaining', fmt(Math.abs(rem))]
    ]), el('p', { class: 'muted small', text: `Last saved ${Dates.showIso(b.savedAt)}. These are your own entries; the totals are calculated.` }))
    : emptyState('wallet', 'You haven’t saved a budget yet.', '#budget', 'Create my budget'));

  const goals = state.goals;
  $('prog-savings').replaceChildren(goals.length
    ? el('div', {},
      kv([['Total saved across goals', fmt(Calc.totalSaved(goals))], ['Total of all targets', fmt(Calc.totalTarget(goals))], ['Overall progress', `${Calc.overallPct(goals)}%`]]),
      el('div', { style: 'margin-top:14px' }, goals.map(g => el('div', { class: 'mini-goal' },
        el('div', { class: 'progress-label' }, el('span', { text: g.name }), el('span', { text: `${Calc.goalPct(g)}%` })),
        progressBar(Calc.goalPct(g), `${g.name} progress`)))))
    : emptyState('piggy-bank', 'No goals yet. Your savings progress will appear here.', '#goals', 'Create a goal'));

  const done = Object.keys(state.lessons.completed).length;
  const flex = Object.entries(state.lessons.completed).filter(([id, c]) => LESSONS.find(l => l.id === id).options[c.choice].level === 'strong').length;
  const pct = Math.round((done / LESSONS.length) * 100);
  $('prog-lessons').replaceChildren(
    el('div', { class: 'progress-label' }, el('span', { text: `${done} of ${LESSONS.length} scenarios completed` }), el('span', { text: `${pct}%` })),
    progressBar(pct, 'Lesson completion'),
    el('p', { class: 'muted small', style: 'margin-top:10px', text: done ? `${flex} of your choices were the flexible-first option. Lessons aren’t graded; the other options can be sensible too.` : 'Complete a scenario to start tracking your learning.' }),
    el('a', { class: 'btn btn-secondary btn-sm', href: '#lessons', text: done ? 'Continue lessons' : 'Start a lesson' }));

  const steps = nextSteps(state).slice(0, 4);
  $('prog-next').replaceChildren(steps.length
    ? el('ul', { class: 'next-list' }, steps.map(s => el('li', {}, icon('arrow-right'), el('div', {}, el('strong', { text: s.title }), el('p', { class: 'muted small', text: s.text }), el('a', { href: s.href, text: s.label })))))
    : el('p', { text: 'Nothing pending. Nice work.' }));

  const unlocked = ACHIEVEMENTS.filter(a => state.achievements[a.id]);
  setText('ach-count', `${unlocked.length} of ${ACHIEVEMENTS.length} unlocked`);
  $('ach-list').replaceChildren(...[...ACHIEVEMENTS].sort((a, c) => {
    const ua = state.achievements[a.id], uc = state.achievements[c.id];
    if (ua && uc) return new Date(uc) - new Date(ua); // most recent first
    return ua ? -1 : uc ? 1 : 0;
  }).map(a => {
    const at = state.achievements[a.id];
    return el('li', { class: `ach${at ? ' unlocked' : ''}` },
      el('span', { class: 'ach-icon' }, icon(at ? a.icon : 'lock')),
      el('div', {}, el('strong', { text: a.title }), el('small', { text: a.desc }),
        el('small', { class: 'state', text: at ? `Unlocked ${Dates.showIso(at)}` : 'Locked' })));
  }));
}

/* ---------- Settings ---------- */
function renderSettings() {
  if (document.activeElement !== $('set-name')) $('set-name').value = state.profile.name;
  $('set-currency').value = state.profile.currency;
}

/* =====================================================================
 * 6. ACTIONS & EVENT HANDLERS
 * ===================================================================== */
function toast(msg, type = 'success') {
  const t = el('div', { class: `toast ${type}`, role: type === 'error' ? 'alert' : null }, icon(type === 'error' ? 'circle-exclamation' : 'circle-check'), el('span', { text: msg }));
  $('toasts').append(t);
  setTimeout(() => t.remove(), 4500);
}

function evaluateAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (!state.achievements[a.id] && a.check(state)) {
      state.achievements[a.id] = new Date().toISOString();
      toast(`Achievement unlocked: ${a.title}`);
    }
  });
}

// Save + re-render after every change so every screen stays in sync.
function commit(message) {
  evaluateAchievements();
  saveState();
  renderAll();
  if (message) toast(message);
}

/* ----- Confirm dialog (Promise<boolean>) ----- */
function confirmDialog({ title, message, confirmText = 'Confirm', danger = false }) {
  return new Promise(resolve => {
    const dlg = $('confirm-dialog');
    setText('confirm-title', title);
    setText('confirm-msg', message);
    const ok = $('confirm-ok');
    ok.textContent = confirmText;
    ok.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
    dlg.returnValue = '';
    dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'), { once: true });
    dlg.showModal();
  });
}

// Clicking the dark backdrop closes a dialog
document.addEventListener('click', e => {
  if (e.target instanceof HTMLDialogElement && e.target.open) e.target.close('cancel');
});

/* ----- Navigation ----- */
function route(userNav) {
  let view = location.hash.replace('#', '');
  if (!VIEWS[view]) view = 'dashboard';
  Object.keys(VIEWS).forEach(v => { $('view-' + v).hidden = v !== view; });
  document.querySelectorAll('.nav-link').forEach(a => {
    if (a.dataset.view === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  setText('page-title', VIEWS[view]);
  document.title = `${VIEWS[view]} · MoneySteps`;
  closeNav();
  if (userNav) { window.scrollTo(0, 0); $('page-title').focus({ preventScroll: true }); }
}

function openNav() {
  document.body.classList.add('nav-open');
  $('scrim').hidden = false;
  $('menu-btn').setAttribute('aria-expanded', 'true');
  $('menu-btn').setAttribute('aria-label', 'Close navigation menu');
  $('main').setAttribute('inert', '');
  const first = document.querySelector('.nav-link[aria-current="page"]') || document.querySelector('.nav-link');
  setTimeout(() => first && first.focus(), 50);
}
function closeNav() {
  if (!document.body.classList.contains('nav-open')) return;
  document.body.classList.remove('nav-open');
  $('scrim').hidden = true;
  $('menu-btn').setAttribute('aria-expanded', 'false');
  $('menu-btn').setAttribute('aria-label', 'Open navigation menu');
  $('main').removeAttribute('inert');
}

/* ----- Budget form ----- */
function buildBudgetFields() {
  BUDGET_FIELDS.forEach(f => {
    const host = $('fields-' + f.group);
    host.append(el('div', { class: 'field' },
      el('label', { for: 'b-' + f.key, text: f.label }),
      el('div', { class: 'input-wrap' },
        el('span', { class: 'cur-symbol', 'aria-hidden': 'true', text: '$' }),
        el('input', { id: 'b-' + f.key, name: f.key, type: 'number', inputmode: 'decimal', min: '0', step: '0.01', 'aria-describedby': `h-${f.key} e-${f.key}` })),
      el('p', { id: 'h-' + f.key, class: 'hint', text: f.hint }),
      el('p', { id: 'e-' + f.key, class: 'error', role: 'alert' })));
  });
}

// Fills the form. By default the form is left blank (it's for entering numbers);
// prefill=true loads the saved budget so it can be edited.
function fillBudgetForm(prefill) {
  BUDGET_FIELDS.forEach(f => {
    $('b-' + f.key).value = prefill && state.budget.saved ? String(state.budget[f.key]) : '';
    setFieldError(f.key, '');
  });
  $('budget-form-msg').textContent = '';
  $('budget-form-msg').classList.remove('is-error');
  refreshBudgetSummary();
}

// Shows the live preview while typing; with an empty form it shows the saved budget instead.
function refreshBudgetSummary() {
  const blank = BUDGET_FIELDS.every(f => $('b-' + f.key).value.trim() === '');
  renderBudgetSummary(blank ? state.budget : readBudgetForm().values, !blank);
  setText('sum-tag', !blank ? 'Preview · not saved yet' : state.budget.saved ? 'Your saved plan' : 'Calculated');
  $('budget-edit').hidden = !state.budget.saved;
}

function setFieldError(key, msg) {
  const input = $('b-' + key);
  setText('e-' + key, msg);
  if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
}

function readBudgetForm() {
  const values = {}, errors = {};
  BUDGET_FIELDS.forEach(f => {
    const input = $('b-' + f.key);
    const r = validateAmount(input.value, input.validity && input.validity.badInput);
    if (r.error) { errors[f.key] = r.error; values[f.key] = 0; } else values[f.key] = r.value;
  });
  return { values, errors };
}

function onBudgetInput(e) {
  const { values, errors } = readBudgetForm();
  const key = e.target.name;
  // Re-check a field only once its error is showing, so people aren't scolded mid-typing
  if (key && $('e-' + key).textContent) setFieldError(key, errors[key] || '');
  // Lenient live preview: invalid or blank fields count as 0
  refreshBudgetSummary();
}

function onBudgetSubmit(e) {
  e.preventDefault();
  const { values, errors } = readBudgetForm();
  const keys = Object.keys(errors);
  BUDGET_FIELDS.forEach(f => setFieldError(f.key, errors[f.key] || ''));
  const msg = $('budget-form-msg');
  if (keys.length) {
    msg.textContent = `Please fix ${keys.length} field${keys.length === 1 ? '' : 's'} before saving.`;
    msg.classList.add('is-error');
    $('b-' + BUDGET_FIELDS.find(f => errors[f.key]).key).focus();
    toast('Some budget fields need attention.', 'error');
    return;
  }
  msg.classList.remove('is-error');
  Object.assign(state.budget, values, { saved: true, saveCount: state.budget.saveCount + 1, savedAt: new Date().toISOString() });
  fillBudgetForm(false); // clear the fields; the saved plan stays visible on the right
  commit('Budget saved. Your dashboard is up to date.');
  msg.textContent = `Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
}

/* ----- Daily spending ----- */
// Rebuilds the category list (built-in, your own, then "add new"), keeping the current choice
function refreshCategoryOptions() {
  const sel = $('sp-category'), prev = sel.value;
  sel.replaceChildren(
    ...SPEND_CATS.map(k => el('option', { value: k, text: catLabel(k) })),
    ...state.customCategories.map(c => el('option', { value: 'c:' + c.id, text: c.name })),
    el('option', { value: '__new', text: '+ Add my own category…' }));
  sel.value = [...sel.options].some(o => o.value === prev) ? prev : 'food';
}

function onCategoryChange() {
  const isNew = $('sp-category').value === '__new';
  $('sp-newcat-field').hidden = !isNew;
  fieldErr('sp-newcat', '');
  if (isNew) $('sp-newcat').focus();
}

async function deleteCustomCategory(id) {
  const c = state.customCategories.find(x => x.id === id);
  if (!c) return;
  const n = state.expenses.filter(x => x.category === 'c:' + id).length;
  const yes = await confirmDialog({
    title: 'Remove this category?',
    message: n ? `“${c.name}” will be removed and its ${n} expense${n === 1 ? '' : 's'} will move to “Unplanned / other”. The amounts stay the same.` : `“${c.name}” will be removed.`,
    confirmText: 'Remove category', danger: true
  });
  if (!yes) return;
  state.expenses.forEach(x => { if (x.category === 'c:' + id) x.category = 'other'; });
  state.customCategories = state.customCategories.filter(x => x.id !== id);
  commit('Category removed.');
}

function buildExpenseFields() {
  refreshCategoryOptions();
  $('sp-category').value = 'food';
  resetExpenseForm(true);
}

// Clears the form for the next entry. resetDate=true also puts today's date back.
function resetExpenseForm(resetDate) {
  const today = Dates.toInput(new Date());
  $('sp-amount').value = '';
  $('sp-note').value = '';
  $('sp-newcat').value = '';
  $('sp-date').max = today;
  $('sp-month').max = today.slice(0, 7);
  if (resetDate || !$('sp-date').value) $('sp-date').value = today;
  ui.editingExpenseId = null;
  ['amount', 'date', 'note', 'newcat'].forEach(k => fieldErr('sp-' + k, ''));
}

function onExpenseSubmit(e) {
  e.preventDefault();
  ['amount', 'date', 'note', 'newcat'].forEach(k => fieldErr('sp-' + k, ''));
  let ok = true;
  const fail = (id, msg) => { fieldErr(id, msg); if (ok) $(id).focus(); ok = false; };

  const a = validateAmount($('sp-amount').value, $('sp-amount').validity.badInput);
  if (a.error) fail('sp-amount', a.error);
  else if (a.value <= 0) fail('sp-amount', 'Enter an amount greater than 0.');

  const dateStr = $('sp-date').value, d = Dates.parse(dateStr);
  if (!d) fail('sp-date', 'Choose a valid date.');
  else if (d > Dates.today()) fail('sp-date', 'Choose today or an earlier date.');
  else if (d.getFullYear() < 2000) fail('sp-date', 'Choose a date from the year 2000 onwards.');

  const note = $('sp-note').value.trim();
  if (note.length > 80) fail('sp-note', 'Keep the note to 80 characters or fewer.');
  let category = $('sp-category').value;
  let newCat = null;
  if (category === '__new') {
    const name = $('sp-newcat').value.trim().replace(/\s+/g, ' ');
    if (!name) fail('sp-newcat', 'Give your category a name.');
    else if (name.length > 30) fail('sp-newcat', 'Keep the name to 30 characters or fewer.');
    else if (allSpendCats().some(k => catLabel(k).toLowerCase() === name.toLowerCase())) fail('sp-newcat', 'That category already exists. Choose it from the list instead.');
    else if (state.customCategories.length >= MAX_CUSTOM) fail('sp-newcat', `You can have up to ${MAX_CUSTOM} of your own categories. Remove one first.`);
    else newCat = { id: newId(), name, type: $('sp-newcat-type').value === 'need' ? 'need' : 'want' };
  } else if (!allSpendCats().includes(category)) return;
  if (!ok) return;
  if (newCat) {
    state.customCategories.push(newCat);
    category = 'c:' + newCat.id;
    refreshCategoryOptions();
    $('sp-category').value = category; // stay on the new category for the next entry
  }

  const editing = ui.editingExpenseId ? state.expenses.find(x => x.id === ui.editingExpenseId) : null;
  let msg;
  if (editing) {
    Object.assign(editing, { amount: a.value, date: dateStr, category, note });
    msg = 'Expense updated.';
  } else {
    if (state.expenses.length >= MAX_EXPENSES) { toast(`You’ve reached the ${MAX_EXPENSES} expense limit. Export your data and reset to keep logging.`, 'error'); return; }
    state.expenses.push({ id: newId(), date: dateStr, amount: a.value, category, note, createdAt: new Date().toISOString() });
    state.stats.expensesLogged += 1;
    msg = `Added ${fmt(a.value)} to ${catLabel(category)}.`;
  }
  ui.spMonth = dateStr.slice(0, 7); // jump to the month that was just changed
  resetExpenseForm(false);
  commit(msg);
  $('sp-amount').focus(); // ready for the next entry
}

function editExpense(id) {
  const x = state.expenses.find(v => v.id === id);
  if (!x) return;
  ui.editingExpenseId = id;
  $('sp-amount').value = x.amount;
  $('sp-category').value = x.category;
  $('sp-date').value = x.date;
  $('sp-note').value = x.note;
  ['amount', 'date', 'note'].forEach(k => fieldErr('sp-' + k, ''));
  renderSpending();
  $('spending-form').scrollIntoView({ block: 'nearest' });
  $('sp-amount').focus();
}

function cancelExpenseEdit() {
  resetExpenseForm(false);
  renderSpending();
}

async function deleteExpense(id) {
  const x = state.expenses.find(v => v.id === id);
  if (!x) return;
  const yes = await confirmDialog({ title: 'Delete this expense?', message: `${fmt(x.amount)} on ${catLabel(x.category)} (${Dates.show(Dates.parse(x.date))}) will be removed. This can’t be undone.`, confirmText: 'Delete expense', danger: true });
  if (!yes) return;
  state.expenses = state.expenses.filter(v => v.id !== id);
  if (ui.editingExpenseId === id) resetExpenseForm(false);
  commit('Expense deleted.');
}

function onSpendingMonth() {
  const v = $('sp-month').value;
  if (/^\d{4}-\d{2}$/.test(v)) { ui.spMonth = v; renderSpending(); }
}

/* ----- Insights ----- */
function onCheckSubmit(e) {
  e.preventDefault();
  fieldErr('ins-price', ''); fieldErr('ins-name', '');
  const r = validateAmount($('ins-price').value, $('ins-price').validity.badInput);
  let ok = true;
  if (r.error) { fieldErr('ins-price', r.error); $('ins-price').focus(); ok = false; }
  else if (r.value <= 0) { fieldErr('ins-price', 'Enter a price greater than 0.'); $('ins-price').focus(); ok = false; }
  const name = $('ins-name').value.trim();
  if (name.length > 40) { fieldErr('ins-name', 'Keep the name to 40 characters or fewer.'); if (ok) $('ins-name').focus(); ok = false; }
  if (!ok) return;
  const kind = (document.querySelector('input[name="ins-kind"]:checked') || {}).value || 'want';
  ui.lastCheck = { name, price: r.value, kind, canWait: $('ins-wait').checked };
  renderCheckResult();
  $('ins-result').scrollIntoView({ block: 'nearest' });
}

function onRegionChange() {
  const v = $('ins-region').value;
  if (!ECONOMY.regions[v]) return;
  state.profile.region = v;
  commit();
}

/* ----- Goals ----- */
function openGoalDialog(id) {
  ui.goalEditingId = id || null;
  const g = id ? state.goals.find(x => x.id === id) : null;
  setText('goal-dialog-title', g ? 'Edit savings goal' : 'New savings goal');
  $('g-name').value = g ? g.name : '';
  $('g-target').value = g ? g.target : '';
  $('g-saved').value = g ? g.saved : 0;
  $('g-date').value = g ? g.date : '';
  $('g-desc').value = g ? g.desc : '';
  $('g-date').min = '';
  ['name', 'target', 'saved', 'date', 'desc'].forEach(k => fieldErr('g-' + k, ''));
  $('goal-dialog').showModal();
}

function fieldErr(inputId, msg) {
  setText(inputId + '-err', msg);
  if (msg) $(inputId).setAttribute('aria-invalid', 'true'); else $(inputId).removeAttribute('aria-invalid');
}

function onGoalSubmit(e) {
  e.preventDefault();
  const editing = ui.goalEditingId ? state.goals.find(x => x.id === ui.goalEditingId) : null;
  let ok = true;
  const fail = (id, msg) => { fieldErr(id, msg); if (ok) $(id).focus(); ok = false; };
  ['name', 'target', 'saved', 'date', 'desc'].forEach(k => fieldErr('g-' + k, ''));

  const name = $('g-name').value.trim();
  if (!name) fail('g-name', 'Give your goal a name.');

  const t = validateAmount($('g-target').value, $('g-target').validity.badInput);
  if (t.error) fail('g-target', t.error);
  else if (t.value <= 0) fail('g-target', 'The target must be greater than 0.');

  const s = validateAmount($('g-saved').value === '' ? '0' : $('g-saved').value, $('g-saved').validity.badInput);
  if (s.error) fail('g-saved', s.error);

  const dateStr = $('g-date').value;
  const d = Dates.parse(dateStr);
  if (!d) fail('g-date', 'Choose a valid date.');
  else if (d.getFullYear() > 2200) fail('g-date', 'That date is too far away. Choose one before 2200.');
  else if (d < Dates.today() && !(editing && editing.date === dateStr)) fail('g-date', 'Choose today or a future date. You can always edit it later.');

  const desc = $('g-desc').value.trim();
  if (desc.length > 200) fail('g-desc', 'Keep the description under 200 characters.');
  if (!ok) return;

  if (editing) {
    Object.assign(editing, { name, target: t.value, saved: s.value, date: dateStr, desc });
    $('goal-dialog').close();
    commit('Goal updated.');
  } else {
    state.goals.push({ id: newId(), name, target: t.value, saved: s.value, date: dateStr, desc, createdAt: new Date().toISOString() });
    state.stats.goalsCreated += 1;
    $('goal-dialog').close();
    commit('Goal created.');
  }
}

async function deleteGoal(id) {
  const g = state.goals.find(x => x.id === id);
  if (!g) return;
  const yes = await confirmDialog({ title: 'Delete this goal?', message: `“${g.name}” and its saved amount of ${fmt(g.saved)} will be removed from MoneySteps. This can’t be undone.`, confirmText: 'Delete goal', danger: true });
  if (!yes) return;
  state.goals = state.goals.filter(x => x.id !== id);
  commit('Goal deleted.');
}

function openContribute(id) {
  const g = state.goals.find(x => x.id === id);
  if (!g) return;
  ui.contributeId = id;
  setText('c-title', `Add money to “${g.name}”`);
  setText('c-info', `${fmt(g.saved)} saved of ${fmt(g.target)}. ${fmt(Calc.goalRemaining(g))} to go. This only records the amount here and doesn’t change your budget.`);
  $('c-amount').value = '';
  fieldErr('c-amount', '');
  $('contribute-dialog').showModal();
}

function onContributeSubmit(e) {
  e.preventDefault();
  const g = state.goals.find(x => x.id === ui.contributeId);
  if (!g) return $('contribute-dialog').close();
  const r = validateAmount($('c-amount').value, $('c-amount').validity.badInput);
  if (r.error) { fieldErr('c-amount', r.error); $('c-amount').focus(); return; }
  if (r.value <= 0) { fieldErr('c-amount', 'Enter an amount greater than 0.'); $('c-amount').focus(); return; }
  g.saved = round2(g.saved + r.value);
  state.stats.contributions += 1;
  $('contribute-dialog').close();
  commit(g.saved >= g.target ? `Added ${fmt(r.value)}. You’ve reached “${g.name}”!` : `Added ${fmt(r.value)} to “${g.name}”.`);
}

/* ----- Lessons ----- */
function submitLesson(e) {
  e.preventDefault();
  const lesson = LESSONS[ui.lessonIndex];
  if (state.lessons.completed[lesson.id]) return;
  if (ui.selected === null) {
    ui.lessonError = 'Choose an answer to see the feedback.';
    setText('lesson-error', ui.lessonError);
    const first = document.querySelector('input[name="lesson-option"]');
    if (first) first.focus();
    return;
  }
  state.lessons.completed[lesson.id] = { choice: ui.selected, at: new Date().toISOString() };
  ui.selected = null; ui.lessonError = '';
  commit();
  const fb = document.querySelector('#lesson-card .feedback');
  if (fb) { fb.setAttribute('tabindex', '-1'); fb.focus(); }
}

function goLesson(step) {
  ui.lessonIndex += step; ui.selected = null; ui.lessonError = '';
  renderLessons();
  $('lesson-card').scrollIntoView({ block: 'nearest' });
}

async function restartLessons() {
  const yes = await confirmDialog({ title: 'Restart lessons?', message: 'Your answers will be cleared so you can try the scenarios again. Achievements you’ve already unlocked stay.', confirmText: 'Restart' });
  if (!yes) return;
  state.lessons.completed = {};
  ui.lessonIndex = 0; ui.selected = null;
  commit('Lessons restarted.');
}

/* ----- Settings & data ----- */
function onSettingsSubmit(e) {
  e.preventDefault();
  const name = $('set-name').value.trim();
  if (name.length > 40) { setText('set-name-err', 'Keep your name to 40 characters or fewer.'); $('set-name').focus(); return; }
  setText('set-name-err', '');
  state.profile.name = name;
  state.profile.currency = $('set-currency').value;
  commit('Settings saved.');
}

function dataMessage(text, isError) {
  const m = $('data-msg');
  m.textContent = text;
  m.classList.toggle('is-error', !!isError);
}

function exportData() {
  const payload = { app: 'MoneySteps', schema: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data: state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: `moneysteps-${Dates.toInput(new Date())}.json` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  dataMessage('Exported. Keep the file somewhere safe; it contains your financial entries.');
}

async function importData(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  e.target.value = '';
  dataMessage('', false);
  if (file.size > 1024 * 1024) return dataMessage('That file is too large to be a MoneySteps export (limit 1 MB).', true);

  $('loader-text').textContent = 'Checking your file…';
  $('loader').hidden = false;
  let clean;
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || parsed.app !== 'MoneySteps' || typeof parsed.data !== 'object') throw new Error('This doesn’t look like a MoneySteps export.');
    if (parsed.schema !== SCHEMA_VERSION) throw new Error('This export is from an unsupported version.');
    clean = sanitizeState(parsed.data, true);
  } catch (err) {
    $('loader').hidden = true;
    const msg = err instanceof SyntaxError ? 'That file isn’t valid JSON.' : err.message;
    dataMessage(`Import failed: ${msg} Nothing was changed.`, true);
    toast('Import failed. Your data wasn’t changed.', 'error');
    return;
  }
  $('loader').hidden = true;

  const yes = await confirmDialog({ title: 'Replace your data?', message: `This will replace everything currently in MoneySteps with the file’s contents (${clean.goals.length} goal${clean.goals.length === 1 ? '' : 's'}, ${Object.keys(clean.lessons.completed).length} completed lesson${Object.keys(clean.lessons.completed).length === 1 ? '' : 's'}). Export first if you want a backup.`, confirmText: 'Import and replace' });
  if (!yes) return dataMessage('Import cancelled. Nothing was changed.');
  state = clean;
  fillBudgetForm();
  ui.spMonth = currentMonth();
  resetExpenseForm(true);
  commit('Data imported.');
  dataMessage('Import complete.');
}

async function resetData() {
  const yes = await confirmDialog({ title: 'Reset all data?', message: 'This permanently deletes your budget, goals, lesson progress and achievements from this browser. Export a backup first if you might want them later.', confirmText: 'Yes, reset everything', danger: true });
  if (!yes) return;
  state = defaultState();
  ui.lessonIndex = 0; ui.selected = null;
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  fillBudgetForm();
  ui.spMonth = currentMonth();
  resetExpenseForm(true);
  saveState();
  renderAll();
  location.hash = '#dashboard';
  route(true);
  toast('All data has been reset.');
}

/* =====================================================================
 * 7. INIT
 * ===================================================================== */
function bindEvents() {
  window.addEventListener('hashchange', () => route(true));
  $('menu-btn').addEventListener('click', () => (document.body.classList.contains('nav-open') ? closeNav() : openNav()));
  $('scrim').addEventListener('click', closeNav);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
  window.matchMedia('(min-width: 900px)').addEventListener('change', closeNav);

  $('budget-form').addEventListener('input', onBudgetInput);
  $('budget-form').addEventListener('submit', onBudgetSubmit);
  $('budget-revert').addEventListener('click', () => { fillBudgetForm(false); toast('Form cleared.'); });
  $('budget-edit').addEventListener('click', () => {
    fillBudgetForm(true);
    $('budget-form-msg').textContent = 'Your saved budget is loaded. Change what you need, then save.';
    $('b-income').focus();
  });

  $('new-goal-btn').addEventListener('click', () => openGoalDialog());
  $('goal-form').addEventListener('submit', onGoalSubmit);
  $('goal-cancel').addEventListener('click', () => $('goal-dialog').close());
  $('contribute-form').addEventListener('submit', onContributeSubmit);
  $('c-cancel').addEventListener('click', () => $('contribute-dialog').close());

  $('spending-form').addEventListener('submit', onExpenseSubmit);
  $('sp-cancel').addEventListener('click', cancelExpenseEdit);
  $('sp-category').addEventListener('change', onCategoryChange);
  $('sp-month').addEventListener('change', onSpendingMonth);

  $('check-form').addEventListener('submit', onCheckSubmit);
  $('ins-region').addEventListener('change', onRegionChange);

  $('lessons-restart').addEventListener('click', restartLessons);

  $('settings-form').addEventListener('submit', onSettingsSubmit);
  $('export-btn').addEventListener('click', exportData);
  $('import-file').addEventListener('change', importData);
  $('reset-btn').addEventListener('click', resetData);
}

function init() {
  loadState();
  $('set-currency').replaceChildren(...CURRENCIES.map(c => el('option', { value: c.code, text: c.label })));
  $('ins-region').replaceChildren(...Object.entries(ECONOMY.regions).map(([code, r]) => el('option', { value: code, text: `${r.name} (${code})` })));
  buildBudgetFields();
  buildExpenseFields();
  bindEvents();
  fillBudgetForm();
  route(false);
  evaluateAchievements();
  saveState();
  renderAll();
  // Brief loading state so the first paint never flashes empty values
  setTimeout(() => { $('loader').hidden = true; }, 300);
}

document.addEventListener('DOMContentLoaded', init);
