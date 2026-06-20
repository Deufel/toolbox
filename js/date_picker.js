/*
 * event-date-picker — Datastar Pro (Rocket) web component.
 * Location: static/rocket/event-date-picker.js
 *
 * Loaded once from the base layout:
 *   <script type="module" src="/static/rocket/event-date-picker.js"></script>
 *
 * Used via the typed templ wrapper view.EventDatePicker(mode, value, valueEnd),
 * or directly as an element:
 *   <event-date-picker mode="range" value="2026-06-18" value-end="2026-06-26"></event-date-picker>
 *
 * Commits (Confirm or click-outside) dispatch a bubbling `change` event:
 *   el.addEventListener('change', e => { const {start, end, mode} = e.detail });
 *
 * NOTE: the import below is ABSOLUTE (/static/datastar.js). Because this file lives in
 * a subfolder, a relative './datastar.js' would resolve to static/rocket/ and 404.
 * Requires system.css on the page for tokens.
 */
import { rocket } from '/static/datastar.js';

// ---- pure date helpers (props-down, no signals) ----
  const pad = n => String(n).padStart(2,'0');
  const isoOf = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const som = (ms,delta) => { const d=new Date(ms); return new Date(d.getFullYear(), d.getMonth()+delta, 1).getTime(); };
  const gridStart = viewMs => { const d=new Date(viewMs); const first=new Date(d.getFullYear(),d.getMonth(),1); const dow=(first.getDay()+6)%7; return new Date(d.getFullYear(),d.getMonth(),1-dow).getTime(); };
  const cellDate = (viewMs,i) => { const s=new Date(gridStart(viewMs)); return new Date(s.getFullYear(),s.getMonth(),s.getDate()+i); };
  const cellDay = (viewMs,i) => cellDate(viewMs,i).getDate();
  const cellIso = (viewMs,i) => isoOf(cellDate(viewMs,i));
  const cellInMonth = (viewMs,i) => cellDate(viewMs,i).getMonth() === new Date(viewMs).getMonth();
  const cellIsToday = (viewMs,i) => cellIso(viewMs,i) === isoOf(new Date());
  const todayIso = () => isoOf(new Date());
  const monthLabel = viewMs => new Date(viewMs).toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const fmtPretty = iso => { if(!iso) return ''; const p=iso.split('-'); return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'}); };

  // expose helpers for Datastar expressions in the rendered markup
  Object.assign(window, { cellDay, cellIso, cellInMonth, cellIsToday, som, todayIso, monthLabel, fmtPretty });

  rocket('event-date-picker', {
    mode: 'light',  // inherit system.css — shadow DOM would wall it off
    props: ({ oneOf, string }) => ({
      mode:     oneOf('single','range').default('single'),
      value:    string.default(''),   // committed start ISO
      valueEnd: string.default(''),   // committed end ISO
    }),
    setup: ({ $$, props, host, action }) => {
      // committed values mirror props; draft + view are internal local state
      $$.sela = props.value;
      $$.selb = props.valueEnd || props.value;
      $$.da = '';
      $$.db = '';
      $$.hover = '';
      $$.clicked = '';
      $$.mode = props.mode;
      $$.v = props.value ? som(new Date(props.value).getTime(),0) : som(Date.now(),0);
      $$.priorEnd = (props.valueEnd && props.valueEnd !== props.value) ? props.valueEnd : '';

      // events-up: commit is a registered action, callable as @commit() in markup
      action('commit', () => {
        $$.sela = $$.da;
        $$.selb = ($$.mode === 'single') ? $$.da : ($$.db || $$.da);
        host.setAttribute('value', $$.sela);
        host.setAttribute('value-end', $$.selb);
        host.dispatchEvent(new CustomEvent('change', {
          bubbles: true,
          detail: { start: $$.sela, end: $$.selb, mode: $$.mode }
        }));
      });

      // smart range selection (spec): start-first, then end; complete-range edits nearest endpoint
      action('pick', () => {
        const iso = $$.clicked;
        if ($$.mode === 'single') { $$.da = iso; $$.db = iso; $$.priorEnd = ''; return; }
        // range mode
        if (!$$.da || ($$.da && $$.db === '')) {
          // no start yet, or start set but no end yet
          if (!$$.da) { $$.da = iso; $$.db = ''; return; }
          // start set, no end
          if (iso > $$.da) { $$.db = iso; $$.priorEnd = iso; }
          else { $$.da = iso; }            // on/before start -> move start
          return;
        }
        // complete range exists ($$.da && $$.db)
        if (iso > $$.db) { $$.db = iso; $$.priorEnd = iso; return; }   // after end -> extend end
        if (iso < $$.da) { $$.da = iso; return; }                      // before start -> move start
        // between start and end (inclusive): edit nearest endpoint; tie -> end
        const dStart = Math.abs(new Date(iso) - new Date($$.da));
        const dEnd   = Math.abs(new Date(iso) - new Date($$.db));
        if (dStart < dEnd) { $$.da = iso; }
        else { $$.db = iso; $$.priorEnd = iso; }                        // tie or closer-to-end -> end
      });
    },
    render: ({ html, props }) => html`
      <div style="display:inline-block">
        <style>
        .calpop  { --bg: 0; background-color: var(--_bg); --surf-l: var(--_bg-l); margin: auto;
                   inline-size: max-content; min-inline-size: 0; max-inline-size: 94vw;
                   border: 1px solid var(--border); border-radius: var(--cfg-radius); padding: 0.7lh 0.8em; }
        .calendar {
          display: grid; grid-template-columns: repeat(7, minmax(0, 2.4lh)); gap: 0.15lh;
        }
        .calendar > small { text-align: center; --fg: -0.5; --type: -1; }
        .calendar > button {
          aspect-ratio: 1; min-inline-size: 0; min-block-size: 0; --bg: 0.08; --type: -1;
        }
        .calendar > button[data-ui-adjacent]              { --bg: -1; --fg: -0.7; }
        .calendar > button[data-ui-inrange]               { --bg: 0.6; }
        .calendar > button[data-ui-preview]               { --bg: 0.3; }
        .calendar > button[aria-current="date"]           { outline: 2px dotted var(--focus); }
        .calendar > button[data-ui-selected]              { --bg: 0.6; outline: 2px solid var(--focus); }
        .calendar > button[data-ui-start],
        .calendar > button[data-ui-end]                   { --bg: 0.6; }
      </style>
      
        <button type="button" popovertarget="evpop"
          style="--bg:0; border:1px solid var(--border); gap:0.5em; justify-content:flex-start; min-inline-size:17em"
          data-on:click="$$da=$$sela; $$db=$$selb; $$mode=($$sela && $$sela!==$$selb)?'range':'single'; if($$sela){$$v=som(new Date($$sela).getTime(),0)}">
          <span style="--fg:-0.5; display:inline-flex"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="inline-size:1.05em;block-size:1.05em;flex:0 0 auto"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg></span>
          <span data-text="!$$sela ? 'Select a date' : ($$sela===$$selb ? fmtPretty($$sela) : fmtPretty($$sela)+' – '+fmtPretty($$selb))"></span>
        </button>

        <div id="evpop" popover class="calpop"
          data-on:toggle="evt.newState==='closed' && $$da && (($$mode==='range' && $$db) || $$mode==='single') && @commit()"><div class="column">

          <div role="radiogroup" aria-label="Event length" class="tabs">
            <label><input type="radio" name="evmode" data-bind="$$mode" value="single"
              data-on:change="$$db = $$da"><span>Single day</span></label>
            <label><input type="radio" name="evmode" data-bind="$$mode" value="range"
              data-on:change="$$db = ($$priorEnd && $$priorEnd !== $$da) ? $$priorEnd : ''"><span>Date range</span></label>
          </div>

          <div class="spread" style="align-items:center">
            <button type="button" aria-label="Previous month" style="--bg:0.06" data-on:click="$$v=som($$v,-1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
            <strong data-text="monthLabel($$v)"></strong>
            <button type="button" aria-label="Next month" style="--bg:0.06" data-on:click="$$v=som($$v,1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
          </div>

          <div class="spread" style="align-items:center">
            <div class="column" style="gap:0">
              <small data-text="!$$da ? 'Nothing selected' : ($$mode==='single' ? fmtPretty($$da) : (!$$db ? fmtPretty($$da)+' – …' : fmtPretty($$da)+' – '+fmtPretty($$db)))"></small>
              <small style="--fg:-0.6" data-show="$$mode==='range' && $$da && $$db && $$da!==$$db" data-text="Math.round((new Date($$db)-new Date($$da))/86400000)+' night'+(Math.round((new Date($$db)-new Date($$da))/86400000)===1?'':'s')"></small>
            </div>
            <div class="row">
              <button type="button" style="--bg:0.04" data-on:click="$$da=''; $$db=''">Clear</button>
              <button type="button" style="--bg:0.04" data-on:click="$$v=som(Date.now(),0); $$da=todayIso(); $$db=todayIso()">Today</button>
            </div>
          </div>

          <!-- Rocket loop: cells are generated, not baked -->
          <div class="calendar" data-on:mouseleave="$$hover=''">
            <small>M</small><small>T</small><small>W</small><small>T</small><small>F</small><small>S</small><small>S</small>
            <template data-for="i in [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41]">
              <button type="button"
                data-on:mouseenter="$$hover = cellIso($$v,i)"
                data-text="cellDay($$v, i)"
                data-attr:data-ui-adjacent="!cellInMonth($$v, i)"
                data-attr:aria-current="cellIsToday($$v, i) ? 'date' : 'false'"
                data-attr:data-ui-selected="!!($$da && cellIso($$v,i)===$$da && (!$$db || $$da===$$db))"
                data-attr:data-ui-start="!!($$da && $$db && $$da!==$$db && cellIso($$v,i)===$$da)"
                data-attr:data-ui-end="!!($$da && $$db && $$da!==$$db && cellIso($$v,i)===$$db)"
                data-attr:data-ui-inrange="!!($$da && $$db && $$da!==$$db && cellIso($$v,i) > $$da && cellIso($$v,i) < $$db)"
                data-attr:data-ui-preview="!!($$mode==='range' && $$da && !$$db && $$hover && cellIso($$v,i) >= $$da && cellIso($$v,i) <= $$hover)"
                data-on:click="$$clicked = cellIso($$v,i); @pick()"></button>
            </template>
          </div>

          <div class="column">
            <button type="button" style="--bg:0.6"
              data-attr:disabled="!$$da || ($$mode==='range' && !$$db)"
              data-on:click="@commit(); document.getElementById('evpop').hidePopover()">Confirm</button>
          </div>

        </div></div>
      </div>
    `,
  });
