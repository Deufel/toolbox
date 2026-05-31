<html><head></head><body><h1>Forms — HTML authoring guide</h1>
<p>How to write form markup for this system. The rule that explains everything
below: <strong>you write semantic HTML; the CSS reads its structure.</strong> No component
classes, no wrapper <code>&lt;div&gt;</code>s, no <code>appearance</code> hacks. If you find yourself
reaching for a class on a control, stop — the element almost certainly already
works.</p>
<hr>
<h2>The one rule</h2>
<p>A <code>&lt;label&gt;</code> inside a <code>&lt;form&gt;</code> <strong>is</strong> a field. The system detects the shape from
what the label wraps:</p>
<ul>
<li>wraps a text <code>&lt;input&gt;</code> / <code>&lt;select&gt;</code> / <code>&lt;textarea&gt;</code> → <strong>stacked field</strong>
(label above, control below)</li>
<li>wraps a checkbox / radio <code>&lt;input&gt;</code> → <strong>inline field</strong> (control beside label)</li>
</ul>
<p>You never declare which; the markup decides.</p>
<hr>
<h2>The field</h2>
<pre><code class="language-html">&lt;form&gt;
  &lt;label&gt;
    &lt;span&gt;Email address&lt;/span&gt;
    &lt;small&gt;We'll never share it.&lt;/small&gt;
    &lt;input type="email" placeholder="you@example.com"&gt;
  &lt;/label&gt;
&lt;/form&gt;
</code></pre>
<p>Three children, always in this order:</p>
<table>
<thead>
<tr>
<th>child</th>
<th>role</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>&lt;span&gt;</code></td>
<td>the label text (neutral ink)</td>
</tr>
<tr>
<td><code>&lt;small&gt;</code></td>
<td>feedback / helper text — <strong>always include it, even empty</strong></td>
</tr>
<tr>
<td>control</td>
<td><code>&lt;input&gt;</code>, <code>&lt;select&gt;</code>, or <code>&lt;textarea&gt;</code></td>
</tr>
</tbody>
</table>
<p><strong>Always include the <code>&lt;small&gt;</code>, even when there's no message</strong> (<code>&lt;small&gt;&lt;/small&gt;</code>).
It holds a fixed line whether full or empty, so showing or hiding feedback never
shifts the layout. Leaving it out means text appearing later will push the
control down.</p>
<p>The <code>&lt;form&gt;</code> itself becomes a recessed panel and the controls inside sit raised
against it — so inside a form, inputs are borderless by design. Outside a form,
the same input keeps a border (it has no panel to sit against). You don't style
either; just use <code>&lt;form&gt;</code>.</p>
<h3>Stacking fields</h3>
<p>Fields are block-level and stack on their own. For consistent gaps, wrap them in
a <code>.column</code>:</p>
<pre><code class="language-html">&lt;form class="column"&gt;
  &lt;label&gt;…&lt;/label&gt;
  &lt;label&gt;…&lt;/label&gt;
&lt;/form&gt;
</code></pre>
<hr>
<h2>Validation &amp; state</h2>
<p>State is driven by <strong>real attributes</strong>, never by adding classes to fake a look.</p>
<h3>Required</h3>
<p>Put <code>required</code> on the control. The label gets a danger-hued asterisk
automatically:</p>
<pre><code class="language-html">&lt;label&gt;
  &lt;span&gt;Password&lt;/span&gt;
  &lt;small&gt;&lt;/small&gt;
  &lt;input type="password" required&gt;
&lt;/label&gt;
</code></pre>
<h3>Invalid (error)</h3>
<p>Set <code>aria-invalid="true"</code> on the control — this is the one real, announced
validation state, so it's the one we hook. The feedback text and the control's
edge both go danger-red:</p>
<pre><code class="language-html">&lt;input type="email" aria-invalid="true"&gt;
&lt;!-- with: &lt;small&gt;That email is already taken.&lt;/small&gt; --&gt;
</code></pre>
<p>Toggle it from your validation script: <code>el.setAttribute('aria-invalid','true')</code>
on failure, <code>el.removeAttribute('aria-invalid')</code> when fixed. Update the
<code>&lt;small&gt;</code> text alongside it. (Note: <code>aria-invalid="false"</code> reads as <em>absent</em> to
screen readers — don't use it to mean "valid.")</p>
<h3>Semantic colour (success / info / warning / danger)</h3>
<p>A "valid/green" cue has no ARIA backing, so it's just a visual helper — add one
of these classes to the <strong>label</strong>. The hue flows to the feedback and the
control's edge:</p>
<table>
<thead>
<tr>
<th>class</th>
<th>meaning</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>.suc</code></td>
<td>success</td>
</tr>
<tr>
<td><code>.inf</code></td>
<td>info</td>
</tr>
<tr>
<td><code>.wrn</code></td>
<td>warning</td>
</tr>
<tr>
<td><code>.dgr</code></td>
<td>danger</td>
</tr>
</tbody>
</table>
<pre><code class="language-html">&lt;label class="suc"&gt;
  &lt;span&gt;Username&lt;/span&gt;
  &lt;small&gt;Looks good — available.&lt;/small&gt;
  &lt;input value="ada"&gt;
&lt;/label&gt;
</code></pre>
<p>Feedback text is neutral at rest and only takes colour when a semantic class or
<code>aria-invalid</code> is present.</p>
<h3>Disabled</h3>
<p>Use the native <code>disabled</code> attribute. Ink drains toward the surface
automatically.</p>
<hr>
<h2>Controls</h2>
<h3>Text inputs &amp; textarea</h3>
<p>Bare elements. No class.</p>
<pre><code class="language-html">&lt;input type="email" placeholder="you@example.com"&gt;
&lt;input type="search" placeholder="Search…"&gt;
&lt;textarea rows="3" placeholder="Tell us about yourself…"&gt;&lt;/textarea&gt;
</code></pre>
<h3>Select</h3>
<p>A plain <code>&lt;select&gt;</code> with plain <code>&lt;option&gt;</code>s. <strong>Do not</strong> add a
<code>&lt;button&gt;&lt;selectedcontent&gt;</code> — the browser renders the selected value itself.
Options may contain an SVG icon plus text:</p>
<pre><code class="language-html">&lt;select&gt;
  &lt;option value=""&gt;Choose a fruit…&lt;/option&gt;
  &lt;option value="apple"&gt;
    &lt;svg viewBox="0 0 24 24" width="16" height="16" …&gt;…&lt;/svg&gt;Apple
  &lt;/option&gt;
  &lt;option value="banana"&gt;Banana&lt;/option&gt;
&lt;/select&gt;
</code></pre>
<p>The styled dropdown is progressive: browsers without customizable-select fall
back to the native picker, which still works.</p>
<h3>Datalist (autocomplete)</h3>
<p>Native text-with-suggestions. The input is themed; the suggestion popup is
OS-rendered (not stylable — that's expected):</p>
<pre><code class="language-html">&lt;input list="browsers" placeholder="Type a browser…"&gt;
&lt;datalist id="browsers"&gt;
  &lt;option&gt;Chrome&lt;/option&gt;&lt;option&gt;Firefox&lt;/option&gt;&lt;option&gt;Safari&lt;/option&gt;
&lt;/datalist&gt;
</code></pre>
<h3>Checkbox &amp; radio</h3>
<p>Bare <code>&lt;input type="checkbox"&gt;</code> / <code>&lt;input type="radio"&gt;</code>. Wrap each in a <code>&lt;label&gt;</code>
with a <code>&lt;span&gt;</code> and a <code>&lt;small&gt;</code> — it becomes an inline field (control beside the
text) with the same feedback + validation as any other field:</p>
<pre><code class="language-html">&lt;label&gt;
  &lt;input type="checkbox"&gt;
  &lt;span&gt;I accept the terms and conditions&lt;/span&gt;
  &lt;small&gt;&lt;/small&gt;
&lt;/label&gt;
</code></pre>
<p>Validation works identically — set <code>aria-invalid="true"</code> on the checkbox to flag
"you must accept":</p>
<pre><code class="language-html">&lt;label id="terms"&gt;
  &lt;input type="checkbox" aria-invalid="true"&gt;
  &lt;span&gt;I accept the terms and conditions&lt;/span&gt;
  &lt;small&gt;You must accept to continue.&lt;/small&gt;
&lt;/label&gt;
</code></pre>
<p>The control is the native checkbox, themed to the page hue (and recoloured by a
semantic class or <code>aria-invalid</code>). There is <strong>no switch</strong> — a checkbox is the
clearer control, and on some platforms the native checkbox already renders as a
polished toggle.</p>
<h3>Range slider</h3>
<p>Bare <code>&lt;input type="range"&gt;</code>. A pill track with a round thumb, themed to the page
hue. Set <code>--hue</code> to recolour:</p>
<pre><code class="language-html">&lt;input type="range" min="0" max="100" value="40"&gt;
&lt;input type="range" min="0" max="100" value="65" style="--hue: 145"&gt;
</code></pre>
<p>The thumb is draggable, arrow-key operable, and carries the focus ring. Use it
when the user <em>sets</em> a value — not for showing one (that's meter, below).</p>
<h3>Progress &amp; meter</h3>
<p>Two native display elements (not inputs — you don't fill them in, they show a
value). They share one look — a pill track with a hue-driven fill at the same
height as the slider — but mean different things:</p>
<ul>
<li><strong><code>&lt;progress&gt;</code></strong> — <em>a task advancing toward completion.</em> Only goes up, will
finish: an upload, a multi-step form, loading. Omit <code>value</code> for an animated
indeterminate state ("working…").</li>
<li><strong><code>&lt;meter&gt;</code></strong> — <em>a current measurement on a fixed scale.</em> Can go up or down,
never "done": disk usage, a score, a goal, an SLA. Has <code>min</code>/<code>max</code> (and
optional <code>low</code>/<code>high</code>/<code>optimum</code>).</li>
</ul>
<pre><code class="language-html">&lt;progress value="0.6"&gt;&lt;/progress&gt;          &lt;!-- 60% done --&gt;
&lt;progress&gt;&lt;/progress&gt;                        &lt;!-- indeterminate, animated --&gt;

&lt;meter value="284" min="0" max="320" style="--hue: 145"&gt;&lt;/meter&gt;
</code></pre>
<p>Both follow <code>--hue</code> like everything else. <strong>Don't reach for progress when you
mean meter</strong> — "284k of 320k revenue" is a measurement (meter), not a task
filling up (progress).</p>
<p><strong>Smart meter colouring (opt-in).</strong> Add <code>.smart</code> and the meter's own
<code>low</code>/<code>high</code>/<code>optimum</code> attributes drive the colour — in range = success,
sub-optimum = warning, far off = danger — with no hand-picked hue:</p>
<pre><code class="language-html">&lt;!-- 71% with low=75 lands in the "low" band → auto-reds --&gt;
&lt;meter class="smart" value="71" min="0" max="100" low="75" high="90" optimum="100"&gt;&lt;/meter&gt;
</code></pre>
<p>The colouring is relative to <code>optimum</code>, so set <code>optimum</code> to the <em>good</em> end of
the scale (or the middle, if both extremes are bad).</p>
<hr>
<h2>Groups &amp; rows</h2>
<h3>Field group on one row — <code>&lt;fieldset&gt;</code></h3>
<p>Wrap fields in a <code>&lt;fieldset&gt;</code> to force them onto a single row. Each field's share
of the row is set with <code>--row-width</code> (a ratio — no need to make them sum to
anything). Omit it for an equal split:</p>
<pre><code class="language-html">&lt;fieldset&gt;
  &lt;label style="--row-width: 2"&gt;   &lt;!-- 2/3 of the row --&gt;
    &lt;span&gt;Street address&lt;/span&gt;&lt;small&gt;&lt;/small&gt;
    &lt;input placeholder="123 Main St"&gt;
  &lt;/label&gt;
  &lt;label&gt;                          &lt;!-- 1/3 --&gt;
    &lt;span&gt;Unit&lt;/span&gt;&lt;small&gt;&lt;/small&gt;
    &lt;input placeholder="Apt 4"&gt;
  &lt;/label&gt;
&lt;/fieldset&gt;
</code></pre>
<p><code>--row-width: 2</code> next to a default <code>1</code> means "twice as wide." Add a third field
and the row just re-splits.</p>
<h3>Radio group with a label — <code>&lt;fieldset&gt;</code> + <code>&lt;legend&gt;</code></h3>
<p>Radios group natively by shared <code>name</code>. For a plain vertical/packed list, wrap
them in a <code>&lt;fieldset&gt;</code> with a <code>&lt;legend&gt;</code> for the group label. Group-level
feedback goes in a <code>&lt;small&gt;</code> <strong>inside</strong> the legend (it rides the legend's line,
like a field's label + feedback):</p>
<pre><code class="language-html">&lt;fieldset&gt;
  &lt;legend&gt;Plan &lt;small&gt;&lt;/small&gt;&lt;/legend&gt;
  &lt;label&gt;&lt;input type="radio" name="plan" checked&gt;&lt;span&gt;Free&lt;/span&gt;&lt;/label&gt;
  &lt;label&gt;&lt;input type="radio" name="plan"&gt;&lt;span&gt;Pro&lt;/span&gt;&lt;/label&gt;
  &lt;label&gt;&lt;input type="radio" name="plan"&gt;&lt;span&gt;Team&lt;/span&gt;&lt;/label&gt;
&lt;/fieldset&gt;
</code></pre>
<p>Each option is just <code>&lt;label&gt;&lt;input type="radio"&gt;&lt;span&gt;…&lt;/span&gt;&lt;/label&gt;</code> — no
per-option <code>&lt;small&gt;</code>; feedback for the whole group lives in the legend.</p>
<h3>Segmented radio (a "tab" control) — <code>.tabs</code></h3>
<p>For a small set of short options (2–5), render the radio group as a segmented
control: a recessed track of connected tiles, one selected. Opt in with
<code>class="tabs"</code>. <strong>Important: the track is a <code>&lt;div role="group"&gt;</code>, not a
<code>&lt;fieldset&gt;</code></strong> (see the box below for why), and the group label is a
<code>&lt;span class="legend"&gt;</code> referenced by <code>aria-labelledby</code>:</p>
<pre><code class="language-html">&lt;div role="group" class="tabs" aria-labelledby="ship-lbl"&gt;
  &lt;span class="legend" id="ship-lbl"&gt;Delivery speed &lt;small&gt;&lt;/small&gt;&lt;/span&gt;
  &lt;label&gt;&lt;input type="radio" name="ship" checked&gt;&lt;span&gt;Standard&lt;/span&gt;&lt;/label&gt;
  &lt;label&gt;&lt;input type="radio" name="ship"&gt;&lt;span&gt;Express&lt;/span&gt;&lt;/label&gt;
  &lt;label&gt;&lt;input type="radio" name="ship"&gt;&lt;span&gt;Overnight&lt;/span&gt;&lt;/label&gt;
&lt;/div&gt;
</code></pre>
<p>The radios are real native inputs — keyboard arrows, form submission, and screen
readers all work exactly as with a plain group; they're just shown beside each
label inside the tile. The label breaks out above the track; the selected tile
lifts and goes chromatic; segments wrap to rows on narrow screens. Group
feedback goes in the <code>&lt;small&gt;</code> inside the <code>.legend</code>, same as the plain group.</p>
<p>Use <code>.tabs</code> only for short option sets that read well side by side. For long
labels or many options, use the plain <code>&lt;fieldset&gt;</code> list above.</p>
<blockquote>
<p><strong>Why a <code>&lt;div role="group"&gt;</code> and not a <code>&lt;fieldset&gt;</code>?</strong> <code>&lt;fieldset&gt;</code> has a
magic internal anonymous content box that breaks flex/grid formatting
contexts — children can't receive <code>align-items</code> / <code>align-self: stretch</code>
through it, so the tiles can't fill the track height (true in both flex and
grid). A <code>&lt;div role="group"&gt;</code> with <code>aria-labelledby</code> gives a screen reader the
same "named group of radios" semantics without the quirk. Plain radio lists
(above) keep using <code>&lt;fieldset&gt;</code> because their options don't need to stretch.</p>
</blockquote>
<hr>
<h2>Tuning at the call site</h2>
<p>Everything visual is a value you set inline, not a class you pick. Common knobs:</p>
<table>
<thead>
<tr>
<th>knob</th>
<th>what it does</th>
<th>example</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>--hue</code></td>
<td>recolour a control or region</td>
<td><code>&lt;button style="--hue: 262"&gt;</code></td>
</tr>
<tr>
<td><code>--type</code></td>
<td>size step (−2 small … +2 display)</td>
<td><code>&lt;span style="--type: 1"&gt;</code></td>
</tr>
<tr>
<td><code>--row-width</code></td>
<td>a field's share of a fieldset row</td>
<td><code>&lt;label style="--row-width: 3"&gt;</code></td>
</tr>
<tr>
<td><code>.tabs</code></td>
<td>render a radio group as a segmented control</td>
<td><code>&lt;div role="group" class="tabs"&gt;</code></td>
</tr>
<tr>
<td><code>.suc/.inf/.wrn/.dgr</code></td>
<td>lock a semantic hue</td>
<td><code>&lt;label class="dgr"&gt;</code></td>
</tr>
</tbody>
</table>
<p>A "primary" button is not a variant class — it's a hue at the call site:
<code>&lt;button style="--hue: 262"&gt;Confirm&lt;/button&gt;</code>. If you use the same value often,
make a one-line project alias (<code>.pri { --hue: 262 }</code>) — but that's <em>your</em>
shorthand, not a system component.</p>
<hr>
<h2>Quick reference</h2>
<pre><code class="language-html">&lt;form class="column"&gt;

  &lt;!-- text field --&gt;
  &lt;label&gt;
    &lt;span&gt;Label&lt;/span&gt;
    &lt;small&gt;&lt;/small&gt;            &lt;!-- always present --&gt;
    &lt;input type="text"&gt;
  &lt;/label&gt;

  &lt;!-- required + error --&gt;
  &lt;label&gt;
    &lt;span&gt;Email&lt;/span&gt;
    &lt;small&gt;Invalid address.&lt;/small&gt;
    &lt;input type="email" required aria-invalid="true"&gt;
  &lt;/label&gt;

  &lt;!-- select --&gt;
  &lt;label&gt;
    &lt;span&gt;Country&lt;/span&gt;&lt;small&gt;&lt;/small&gt;
    &lt;select&gt;&lt;option&gt;…&lt;/option&gt;&lt;/select&gt;
  &lt;/label&gt;

  &lt;!-- two fields on a row, 2:1 --&gt;
  &lt;fieldset&gt;
    &lt;label style="--row-width: 2"&gt;&lt;span&gt;City&lt;/span&gt;&lt;small&gt;&lt;/small&gt;&lt;input&gt;&lt;/label&gt;
    &lt;label&gt;&lt;span&gt;ZIP&lt;/span&gt;&lt;small&gt;&lt;/small&gt;&lt;input&gt;&lt;/label&gt;
  &lt;/fieldset&gt;

  &lt;!-- checkbox with validation --&gt;
  &lt;label&gt;
    &lt;input type="checkbox" required&gt;
    &lt;span&gt;I accept the terms&lt;/span&gt;
    &lt;small&gt;&lt;/small&gt;
  &lt;/label&gt;

  &lt;!-- radio group (plain list) --&gt;
  &lt;fieldset&gt;
    &lt;legend&gt;Plan &lt;small&gt;&lt;/small&gt;&lt;/legend&gt;
    &lt;label&gt;&lt;input type="radio" name="p" checked&gt;&lt;span&gt;Free&lt;/span&gt;&lt;/label&gt;
    &lt;label&gt;&lt;input type="radio" name="p"&gt;&lt;span&gt;Pro&lt;/span&gt;&lt;/label&gt;
  &lt;/fieldset&gt;

  &lt;!-- segmented radio (tabs) — div role=group, NOT fieldset --&gt;
  &lt;div role="group" class="tabs" aria-labelledby="sp"&gt;
    &lt;span class="legend" id="sp"&gt;Speed &lt;small&gt;&lt;/small&gt;&lt;/span&gt;
    &lt;label&gt;&lt;input type="radio" name="s" checked&gt;&lt;span&gt;Standard&lt;/span&gt;&lt;/label&gt;
    &lt;label&gt;&lt;input type="radio" name="s"&gt;&lt;span&gt;Express&lt;/span&gt;&lt;/label&gt;
  &lt;/div&gt;

  &lt;!-- slider · progress · meter (bare elements) --&gt;
  &lt;input type="range" min="0" max="100" value="40"&gt;
  &lt;progress value="0.6"&gt;&lt;/progress&gt;
  &lt;meter value="284" min="0" max="320" style="--hue: 145"&gt;&lt;/meter&gt;

&lt;/form&gt;
</code></pre>
<h3>Don'ts</h3>
<ul>
<li>❌ a class on a control (<code>&lt;input class="…"&gt;</code>) — bare elements are styled</li>
<li>❌ wrapper <code>&lt;div&gt;</code>s around a field — the <code>&lt;label&gt;</code> is the field</li>
<li>❌ <code>&lt;button&gt;&lt;selectedcontent&gt;</code> inside a select — let the browser render it</li>
<li>❌ a <code>.field</code>, <code>.input</code>, or <code>.form-control</code> class — none exist; use the element</li>
<li>❌ omitting an empty <code>&lt;small&gt;</code> — you lose the no-shift guarantee</li>
<li>❌ a class to fake an error/success — use <code>aria-invalid</code> / the <code>.suc</code> helper</li>
<li>❌ a <code>&lt;fieldset&gt;</code> for a <code>.tabs</code> segmented control — its anonymous box breaks
the tile fill; use <code>&lt;div role="group" aria-labelledby&gt;</code></li>
<li>❌ a per-option <code>&lt;small&gt;</code> in a radio/tabs group — group feedback goes in the
<code>&lt;small&gt;</code> inside the <code>&lt;legend&gt;</code> / <code>.legend</code></li>
<li>❌ <code>&lt;progress&gt;</code> for a measurement (revenue, disk, a score) — that's <code>&lt;meter&gt;</code>;
progress is for tasks that fill up and finish</li>
</ul></body></html>
