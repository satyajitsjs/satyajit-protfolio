/** Project-specific original mini interfaces; decorative only, no live data. */
const line=(label,width="70%")=>`<span class="pa-line"><b style="width:${width}"></b><small>${label}</small></span>`;
const tag=(name)=>`<span class="pa-chip">${name}</span>`;
const node=(name,cls="")=>`<span class="pa-node ${cls}">${name}</span>`;
const card=(name,cls="")=>`<span class="pa-microcard ${cls}">${name}</span>`;
const artwork={"fabricflow":()=>`
    <div class="pa-scene pa-fabric">
      <div class="pa-fabric-fan">
        <div class="pa-fabric-piece pa-fabric-piece-one"></div>
        <div class="pa-fabric-piece pa-fabric-piece-two"></div>
        <div class="pa-fabric-piece pa-fabric-piece-three"><span>FABRIC / 024</span></div>
      </div>
      <div class="pa-fabric-spec"><span class="pa-live">MATERIAL SYSTEM</span>${line('FABRIC LIBRARY','78%')}${line('PROCUREMENT','56%')}${line('INSPECTION','90%')}</div>
      <div class="pa-floating pa-fabric-chip">${tag('BOM')} ${tag('AI')}</div>
    </div>`,
"alphazero-hrms":()=>`
    <div class="pa-scene pa-hrms">
      <div class="pa-hierarchy">
        <div class="pa-manager"><span class="pa-avatar">◈</span><span><b>PLATFORM</b><small>ADMIN</small></span></div>
        <div class="pa-org-line"></div>
        <div class="pa-team">
          <div>${node('◉','pa-employee')}<small>HR</small></div>
          <div>${node('◈','pa-employee')}<small>TEAM</small></div>
          <div>${node('◇','pa-employee')}<small>STAFF</small></div>
        </div>
      </div>
      <div class="pa-floating pa-hr-status"><i></i> MULTI-TENANT</div>
    </div>`,
"kya-kare":()=>`
    <div class="pa-scene pa-astrology">
      <div class="pa-zodiac"><div class="pa-zodiac-ring"></div><div class="pa-zodiac-inner"><span>☽</span><small>JYOTISH AI</small></div><i class="pa-orbit-point"></i></div>
      <div class="pa-floating pa-star-card">✦ DASHA / KUNDLI</div>
    </div>`,
"aptpath":()=>`
    <div class="pa-scene pa-learning">
      <div class="pa-roadmap">
        <div class="pa-route-track"></div>
        <div class="pa-route-stop"><span>01</span><b>ASSESS</b></div>
        <div class="pa-route-stop pa-route-center"><span>02</span><b>DISCOVER</b></div>
        <div class="pa-route-stop"><span>03</span><b>GROW</b></div>
      </div>
      <div class="pa-floating pa-learn-badge">✧ PERSONALIZED PATH</div>
    </div>`,
"odisha-bakery":()=>`
    <div class="pa-scene pa-bakery">
      <div class="pa-orders">
        <div class="pa-order-head"><span>ORDER FLOW</span><i class="pa-status-pulse"></i></div>
        <div class="pa-order-columns">
          <div><small>RECEIVED</small>${card('ORDER · 01')}${card('ORDER · 02')}</div>
          <div><small>PREPARING</small>${card('BAKING','pa-order-hot')}${card('PACKING')}</div>
          <div><small>READY</small>${card('✓ READY','pa-order-ready')}</div>
        </div>
      </div>
    </div>`,
"richesm":()=>`
    <div class="pa-scene pa-commerce">
      <div class="pa-store">
        <div class="pa-store-head"><span class="pa-mini-dots">● ● ●</span><b>STORE / PRODUCT</b><span>↗</span></div>
        <div class="pa-products"><div><span class="pa-product-object pa-product-one"></span><small>COLLECTION 01</small></div><div><span class="pa-product-object pa-product-two"></span><small>COLLECTION 02</small></div></div>
        <div class="pa-store-foot"><span>SECURE CHECKOUT</span><b>✓</b></div>
      </div>
      <div class="pa-floating pa-cart-icon">▣</div>
    </div>`,
"task-management":()=>`
    <div class="pa-scene pa-task">
      <div class="pa-kanban">
        <div><small>TO DO <b>●</b></small><span class="pa-task-note"><i></i>${line('BACKLOG','78%')}</span><span class="pa-task-note">${line('REVIEW','61%')}</span></div>
        <div><small>IN PROGRESS <b>●</b></small><span class="pa-task-note pa-active-note"><i></i>${line('SPRINT','84%')}</span><span class="pa-task-note">${line('QA','54%')}</span></div>
        <div><small>DONE <b>✓</b></small><span class="pa-task-note pa-done-note">${line('RELEASE','90%')}</span></div>
      </div>
    </div>`,
"aquaculture-iot":()=>`
    <div class="pa-scene pa-water">
      <div class="pa-sensor-top"><span class="pa-live"><i></i> SENSOR TELEMETRY</span><b>LoRa / MQTT</b></div>
      <div class="pa-wave-panel">
        <svg viewBox="0 0 320 105" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 35 C45 -2 74 72 119 35 S197 -2 239 35 S286 70 320 27 V105 H0 Z" fill="rgba(52,185,232,.2)"/>
          <path d="M0 35 C45 -2 74 72 119 35 S197 -2 239 35 S286 70 320 27" stroke="#6ae6ff" stroke-width="2.4" fill="none"/>
          <path d="M0 63 C46 24 80 94 122 59 S204 22 248 63 S292 83 320 52" stroke="rgba(116,137,255,.7)" stroke-width="1.5" fill="none"/>
        </svg>
        <div class="pa-probe pa-probe-one"><span></span></div><div class="pa-probe pa-probe-two"><span></span></div><div class="pa-probe pa-probe-three"><span></span></div>
      </div>
      <div class="pa-sensor-readouts">${tag('pH')}${tag('TEMP')}${tag('O₂')}</div>
    </div>`,
"futurecoin":()=>`
    <div class="pa-scene pa-forecast">
      <div class="pa-chart-top"><span>MODEL / FORECAST</span><b>↗ AI</b></div>
      <div class="pa-price-grid">
        <svg viewBox="0 0 320 135" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="pa-price-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#78f0cc" stop-opacity=".30"/><stop offset="1" stop-color="#78f0cc" stop-opacity="0"/></linearGradient></defs>
          <path d="M0 114L32 90L57 103L83 57L110 68L133 33L166 63L190 40L220 54L242 22L266 35L290 13L320 30V135H0Z" fill="url(#pa-price-fill)"/>
          <path class="pa-chart-line" d="M0 114L32 90L57 103L83 57L110 68L133 33L166 63L190 40L220 54L242 22L266 35L290 13L320 30" fill="none" stroke="#79f2c7" stroke-width="3"/>
          <path d="M0 100L320 100 M0 67L320 67 M0 34L320 34" stroke="rgba(132,190,255,.14)" stroke-width="1" fill="none"/>
        </svg>
      </div>
      <div class="pa-chart-bottom"><span>LSTM</span><span>XGBOOST</span><span>TIME SERIES</span></div>
    </div>`,
"ab-kya-kare":()=>`
    <div class="pa-scene pa-theft">
      <div class="pa-bike-badge">
        <svg viewBox="0 0 210 95" aria-hidden="true">
          <circle cx="47" cy="67" r="21" fill="none" stroke="currentColor" stroke-width="6"/><circle cx="164" cy="67" r="21" fill="none" stroke="currentColor" stroke-width="6"/>
          <path d="M47 67L85 20L113 67H47M113 67L145 27L164 67M85 20H111M147 26L158 26" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="pa-checkpoints">${card('FIR')}${card('INSURANCE')}${card('RTO')}</div>
    </div>`,
"jobfill-ai":()=>`
    <div class="pa-scene pa-jobfill">
      <div class="pa-browser">
        <div class="pa-browser-bar"><span>● ● ●</span><b>APPLICATION FORM</b></div>
        <div class="pa-browser-body">
          <span class="pa-inputfield"><i></i><b>Candidate profile</b><em>✓</em></span>
          <span class="pa-inputfield"><i></i><b>Experience</b><em>✓</em></span>
          <span class="pa-inputfield"><i></i><b>Skills & stack</b><em>✓</em></span>
          <span class="pa-progressbar"><i></i></span>
        </div>
      </div>
      <div class="pa-floating pa-auto-chip">⚡ SMART FILL</div>
    </div>`};
export const knownProjectArtSlugs=Object.freeze(Object.keys(artwork));
export function renderProjectArtwork(slug){
  const render=Object.prototype.hasOwnProperty.call(artwork,slug)?artwork[slug]:null;
  return render?render():'<div class="pa-scene pa-generic"><span class="pa-generic-core">◈</span><span class="pa-generic-label">ENGINEERING / BUILD</span></div>';
};