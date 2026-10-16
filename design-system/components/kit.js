/* Preview kit: turns <i data-i="truck"></i> into an inline Lucide icon. Size via style="--s:20px" or class. */
(function () {
  function draw(root) {
    var icons = window.CZ_ICONS || {}
    ;(root || document).querySelectorAll("i[data-i]").forEach(function (el) {
      var body = icons[el.getAttribute("data-i")]
      if (!body) return
      var sw = el.getAttribute("data-w") || "2"
      el.outerHTML = '<svg class="ic ' + (el.className || "") + '" style="' + (el.getAttribute("style") || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>"
    })
  }
  window.czIcons = draw
  if (document.readyState !== "loading") draw()
  else document.addEventListener("DOMContentLoaded", function () { draw() })
})()
