// 🔘 Btn States 1.0.0 — add class="btn" to buttons
// Drives hover/active/disabled via Pointer API — no :hover/:active quirks
if (!window.btnStates) {
    const SEL = ['.btn']           // ← add selectors here
    const Q   = SEL.join(',')      // cached for closest()

    const slot = cls => {
        let prev = null
        return el => { prev?.classList.remove(cls); (prev = el)?.classList.add(cls) }
    }

    const active = slot('active')
    const hover  = slot('hover')
    const B      = e => SEL.map(s => e.target.closest?.(s)).find(Boolean)
    const kb     = e => e.key === ' ' || e.key === 'Enter'
    const guard  = (el, fn) => el && !el.disabled && fn(el)
    const sync   = el => el.classList.toggle('disabled', el.disabled || el.getAttribute('aria-disabled') === 'true')
    const scan   = root => {
        if (root.nodeType !== 1 && root !== document) return
        SEL.forEach(s => root.querySelectorAll(s).forEach(sync))
    }

    document.addEventListener('pointerdown',   e => guard(B(e), active),                      {passive:true})
    document.addEventListener('pointerup',     () => active(null),                            {passive:true})
    document.addEventListener('pointercancel', () => active(null),                            {passive:true})
    document.addEventListener('pointerenter',  e => guard(B(e), hover),                       {passive:true, capture:true})
    document.addEventListener('pointerleave',  e => { hover(null); if(B(e)) active(null) },   {passive:true, capture:true})
    document.addEventListener('keydown',       e => kb(e) && guard(document.activeElement?.closest(Q), active))
    document.addEventListener('keyup',         e => kb(e) && active(null))

    window.btnStates = new MutationObserver(ms =>
        ms.forEach(m => m.addedNodes.forEach(scan))
    )
    window.btnStates.observe(document.body, {childList:true, subtree:true})

    scan(document)
}
