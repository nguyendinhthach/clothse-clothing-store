// Shared ClothSE language switcher pill (VI / EN). Registers <lang-switch>.
(function () {
  if (window.customElements && customElements.get('lang-switch')) return;
  var KEY = 'clothse-lang';

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      if (v !== 'en' && v !== 'vi') { localStorage.setItem(KEY, 'vi'); return 'vi'; }
      return v;
    } catch (e) { return 'vi'; }
  }

  class LangSwitch extends HTMLElement {
    connectedCallback() {
      if (this._built) return;
      this._built = true;
      this.style.display = 'inline-flex';
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display: flex; align-items: center; height: 40px; padding: 3px; gap: 2px; border: 1px solid #221B2E; border-radius: 999px; background: transparent';
      this._btns = ['vi', 'en'].map(function (code) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = code.toUpperCase();
        b.setAttribute('aria-label', code === 'vi' ? 'Tiếng Việt' : 'English');
        b.style.cssText = 'height: 32px; min-width: 32px; padding: 0 9px; border: 0; border-radius: 999px; cursor: pointer; background: transparent; font-family: "JetBrains Mono", monospace; font-size: 11px; letter-spacing: 0.1em; line-height: 1; transition: background-color 180ms ease-out, color 180ms ease-out';
        b.dataset.code = code;
        b.addEventListener('click', function () {
          try { localStorage.setItem(KEY, code); } catch (e) {}
          window.dispatchEvent(new CustomEvent('clothse-lang', { detail: code }));
        });
        b.addEventListener('mouseenter', function () { if (b.dataset.on !== '1') b.style.background = 'rgba(34,27,46,0.08)'; });
        b.addEventListener('mouseleave', function () { if (b.dataset.on !== '1') b.style.background = 'transparent'; });
        wrap.appendChild(b);
        return b;
      });
      this.appendChild(wrap);
      this._sync = this.sync.bind(this);
      window.addEventListener('clothse-lang', this._sync);
      this.sync();
    }
    disconnectedCallback() { window.removeEventListener('clothse-lang', this._sync); }
    sync() {
      var cur = read();
      this._btns.forEach(function (b) {
        var on = b.dataset.code === cur;
        b.dataset.on = on ? '1' : '0';
        b.style.background = on ? '#221B2E' : 'transparent';
        b.style.color = on ? '#EDEBF2' : '#5F5775';
        b.style.fontWeight = on ? '600' : '400';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
  }
  customElements.define('lang-switch', LangSwitch);
})();
