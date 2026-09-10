// Global ClothSE "back to top" floating button. Self-installs on load.
(function () {
  if (window.__clothseBackToTop) return;
  window.__clothseBackToTop = true;

  var THRESHOLD = 480;

  function install() {
    if (document.querySelector('[data-clothse-top]')) return;
    var btn = document.createElement('button');
    btn.setAttribute('data-clothse-top', '1');
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="square" aria-hidden="true"><path d="M12 20V5"></path><path d="M5 11.5 12 4.5l7 7"></path></svg>';
    btn.style.cssText = [
      'position: fixed', 'right: 28px', 'bottom: 28px', 'z-index: 900',
      'width: 48px', 'height: 48px', 'border-radius: 999px',
      'border: 1px solid #221B2E', 'background: #221B2E', 'color: #EDEBF2',
      'display: grid', 'place-items: center', 'cursor: pointer', 'padding: 0',
      'box-shadow: 4px 4px 0 rgba(34,27,46,0.28)',
      'opacity: 0', 'transform: translateY(14px)', 'pointer-events: none',
      'transition: opacity 200ms ease-out, transform 200ms cubic-bezier(.2,.7,.2,1), background-color 180ms ease-out, box-shadow 180ms ease-out'
    ].join(';');

    btn.addEventListener('mouseenter', function () {
      if (btn.dataset.on !== '1') return;
      btn.style.transform = 'translateY(0) scale(1.09)';
      btn.style.background = '#6B5BFF';
      btn.style.boxShadow = '6px 6px 0 rgba(34,27,46,0.32)';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.transform = btn.dataset.on === '1' ? 'translateY(0)' : 'translateY(14px)';
      btn.style.background = '#221B2E';
      btn.style.boxShadow = '4px 4px 0 rgba(34,27,46,0.28)';
    });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      var el = document.scrollingElement || document.documentElement;
      if (el && el.scrollTop > 0) el.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.body.appendChild(btn);

    function sync() {
      var y = window.pageYOffset || (document.scrollingElement || document.documentElement).scrollTop || 0;
      var on = y > THRESHOLD;
      if (btn.dataset.on === (on ? '1' : '0')) return;
      btn.dataset.on = on ? '1' : '0';
      btn.style.opacity = on ? '1' : '0';
      btn.style.transform = on ? 'translateY(0)' : 'translateY(14px)';
      btn.style.pointerEvents = on ? 'auto' : 'none';
    }
    btn.dataset.on = '0';
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  if (document.body) install();
  else document.addEventListener('DOMContentLoaded', install);
})();
