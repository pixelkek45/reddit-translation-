(function() {
    'use strict';

    const translateIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"></path><path d="M4 14l6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="M22 22l-5-10-5 10"></path><path d="M14 18h6"></path></svg>`;

    const langList = {
        en: "English 🇺🇸", tr: "Turkish 🇹🇷", ar: "Arabic 🇦🇪", de: "German 🇩🇪", 
        fr: "French 🇫🇷", es: "Spanish 🇪🇸", ru: "Russian 🇺🇺", ja: "Japanese 🇯🇵"
    };

    const style = document.createElement('style');
    style.textContent = `
        #bpro-nav-settings { cursor: pointer; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; transition: 0.2s; color: #d7dadc; }
        #bpro-nav-settings svg { width: 20px; height: 20px; }
        #bpro-nav-settings:hover { background: rgba(255, 69, 0, 0.15); color: #ff4500; }
        #bpro-dropdown { position: absolute; top: 45px; right: 0; background: #1a1a1b; border: 1px solid #343536; border-radius: 10px; padding: 10px; z-index: 999999999 !important; display: none; box-shadow: 0 8px 24px rgba(0,0,0,0.8); width: 170px; }
        #bpro-dropdown.open { display: block !important; }
        .bpro-lang-opt { width: 100%; background: #272729; color: white; border: 1px solid #444; border-radius: 6px; padding: 8px; cursor: pointer; font-size: 13px; }
        .bpro-btn-wrap { display: inline-flex !important; margin-left: 8px !important; vertical-align: middle !important; cursor: pointer; }
        .bpro-translate-btn { background: none !important; border: none !important; cursor: pointer !important; padding: 2px !important; color: #818384; display: flex; align-items: center; justify-content: center; transition: 0.2s; opacity: 0.6; }
        .bpro-translate-btn svg { width: 14px; height: 14px; }
        .bpro-translate-btn:hover { color: #ff4500; opacity: 1; transform: scale(1.1); }
        .bpro-res-box { background: rgba(255, 69, 0, 0.05) !important; border-left: 2px solid #ff4500 !important; padding: 8px 12px !important; margin: 8px 0 !important; border-radius: 4px !important; color: #d7dadc !important; font-size: 13.5px !important; line-height: 1.5 !important; display: block !important; width: 100%; }
    `;
    document.head.appendChild(style);

    async function translateText(text, target) {
        if(!text) return null;
        // target parametresinin boş gelmediğinden emin oluyoruz
        const lang = target || localStorage.getItem('bpro_lang') || 'en';
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data[0].map(x => x[0]).join("");
        } catch (e) { return null; }
    }

    function isInsidePost() {
        return window.location.href.includes('/comments/');
    }

    function injectNavbar() {
        if (document.getElementById('bpro-nav-settings')) return;
        const navRight = document.querySelector('.ps-lg.gap-xs.flex.items-center.justify-end') || 
                         document.querySelector('#header-action-item-user-dropdown')?.parentElement;
        
        if (navRight) {
            const wrapper = document.createElement('div');
            wrapper.className = 'relative flex items-center ml-2';
            wrapper.id = 'bpro-container';
            
            const savedLang = localStorage.getItem('bpro_lang') || 'en';

            wrapper.innerHTML = `
                <div id="bpro-nav-settings" title="Settings">${translateIcon}</div>
                <div id="bpro-dropdown">
                    <div style="font-size:10px; color:#ff4500; font-weight:bold; margin-bottom:8px; text-align:center;">TARGET LANGUAGE</div>
                    <select id="b-target" class="bpro-lang-opt"></select>
                </div>
            `;
            navRight.prepend(wrapper);

            const select = wrapper.querySelector('#b-target');
            Object.entries(langList).forEach(([code, name]) => {
                const opt = new Option(name, code);
                if(code === savedLang) opt.selected = true;
                select.add(opt);
            });

            // Hem hafızaya yaz hem de anlık değişkeni güncelle
            select.onchange = (e) => {
                localStorage.setItem('bpro_lang', e.target.value);
            };

            const btn = wrapper.querySelector('#bpro-nav-settings');
            const dropdown = wrapper.querySelector('#bpro-dropdown');
            
            btn.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();
                dropdown.classList.toggle('open');
            };

            document.addEventListener('click', (e) => {
                if (!wrapper.contains(e.target)) dropdown.classList.remove('open');
            });
        }
    }

    function processContent() {
        if (!isInsidePost()) return;
        const selectors = 'shreddit-post-text-body:not([bpro]), .md:not([bpro]), .Comment p:not([bpro])';
        
        document.querySelectorAll(selectors).forEach(container => {
            if (container.closest('#bpro-dropdown')) return;
            container.setAttribute('bpro', 'true');
            
            const btnWrap = document.createElement('span');
            btnWrap.className = 'bpro-btn-wrap';
            btnWrap.innerHTML = `<button class="bpro-translate-btn" title="Translate">${translateIcon}</button>`;
            
            const btn = btnWrap.querySelector('button');
            btn.onclick = async (e) => {
                e.preventDefault(); e.stopPropagation();

                const text = container.innerText.trim();
                if (!text || text.length < 2) return;

                btn.style.opacity = "0.2";
                
                // KRİTİK NOKTA: Dili tam şu saniyede select kutusundan oku
                const currentSelect = document.getElementById('b-target');
                const targetLang = currentSelect ? currentSelect.value : (localStorage.getItem('bpro_lang') || 'en');
                
                const translated = await translateText(text, targetLang);
                btn.style.opacity = "1";
                
                if (translated) {
                    const old = container.querySelector('.bpro-res-box');
                    if (old) old.remove();
                    const resBox = document.createElement('div');
                    resBox.className = 'bpro-res-box';
                    resBox.innerText = translated;
                    container.appendChild(resBox);
                }
            };
            container.appendChild(btnWrap);
        });
    }

    const observer = new MutationObserver(() => { injectNavbar(); processContent(); });
    observer.observe(document.body, { childList: true, subtree: true });
    injectNavbar(); processContent();
})();