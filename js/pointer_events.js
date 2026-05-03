// 🔘 Pointer Events 1.2.0 — drives .hover/.active/.disabled
// on interactive elements. Stays dumb: classes are added uniformly,
// CSS decides what to do with them per-component.
//
// On click of an element with [aria-pressed], toggles the attribute.
// On any activation attempt (pointerdown / Space / Enter) on a
// .disabled element, fires .nope (rejection shake) instead.
if (!window.btnStates) {
    const SEL = ['.btn', '.tap', '.tag']
    const Q   = SEL.join(',')

    const slot = cls => {
        let prev = null
        return el => { prev?.classList.remove(cls); (prev = el)?.classList.add(cls) }
    }

    const active = slot('active')
    const hover  = slot('hover')
    const B      = e => SEL.map(s => e.target.closest?.(s)).find(Boolean)
    const kb     = e => e.key === ' ' || e.key === 'Enter'
    const off    = el => el.classList.contains('disabled')
    const sync   = el => el.classList.toggle('disabled', el.disabled || el.getAttribute('aria-disabled') === 'true')
    const scan   = root => {
        if (root.nodeType !== 1 && root !== document) return
        SEL.forEach(s => root.querySelectorAll(s).forEach(sync))
    }

    const fireNope = el => {
        el.classList.add('nope')
        setTimeout(() => el.classList.remove('nope'), 400)
    }
    const tryActivate = el => off(el) ? fireNope(el) : active(el)

    document.addEventListener('pointerdown',   e => { const el = B(e); if (el) tryActivate(el) },           {passive:true})
    document.addEventListener('pointerup',     () => active(null),                                         {passive:true})
    document.addEventListener('pointercancel', () => active(null),                                         {passive:true})
    document.addEventListener('pointerenter',  e => { const el = B(e); if (el && !off(el)) hover(el) },    {passive:true, capture:true})
    document.addEventListener('pointerleave',  e => { hover(null); if (B(e)) active(null) },               {passive:true, capture:true})
    document.addEventListener('click',         e => {
        const el = B(e)
        if (!el || off(el)) return
        if (el.hasAttribute('aria-pressed')) {
            el.setAttribute('aria-pressed', el.getAttribute('aria-pressed') === 'true' ? 'false' : 'true')
        }
    })
    document.addEventListener('keydown', e => {
        if (!kb(e)) return
        const el = document.activeElement?.closest(Q)
        if (el) tryActivate(el)
    })
    document.addEventListener('keyup',   e => kb(e) && active(null))

    window.btnStates = new MutationObserver(ms =>
        ms.forEach(m => m.addedNodes.forEach(scan))
    )
    window.btnStates.observe(document.body, {childList:true, subtree:true})

    scan(document)
}
