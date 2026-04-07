// h/t https://github.com/gnat/css-scope-inline
// ME_CSS 1.0.0 — use `me` in <style> to scope to parent element
// Rewrites `me` → unique class, isolating component styles without shadow DOM
if (!window.cssScope) {
    const SEL = 'me'
    const RE  = new RegExp(`(?:^|\\.|(?<=\\s|[^a-zA-Z0-9\\-\\_]))(${SEL})(?![a-zA-Z\\/])`, 'g')
    const RKF = new RegExp(`((@keyframes|animation:|animation-name:)[^{};]*)\\.${SEL}__`, 'g')
    let   count = window.cssScopeCount ?? 1

    const process = node => {
        const scope = `${SEL}__${count++}`
        node.parentNode.classList.add(scope)
        node.textContent = node.textContent
            .replace(RE,  (_, p1) => _.replace(p1, `.${scope}`))
            .replace(RKF, `$1${SEL}__`)
        node.setAttribute('ready', '')
        window.cssScopeCount = count
    }

    window.cssScope = new MutationObserver(() =>
        document.body.querySelectorAll('style:not([ready])').forEach(process)
    )
    window.cssScope.observe(document.documentElement, {childList:true, subtree:true})

    document.querySelectorAll('style:not([ready])').forEach(process)
}
