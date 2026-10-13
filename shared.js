// Funções compartilhadas entre cliente.html e admin.html
// (horários, barbeiros, links seguros, cor da marca, compressão de imagem)

const HOURS_PADRAO = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
                      '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];
const DIAS_PT = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const DIAS_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Horário padrão sugerido ao dono na 1ª vez (equivale ao horário antigo do site)
function horariosSugeridos(){
  const h = {};
  for(let d=0; d<7; d++){
    h[d] = {aberto: d!==0, abre:'08:00', fecha:'18:00', pausaIni:'12:00', pausaFim:'13:00'};
  }
  return h;
}

// ── SEGURANÇA ─────────────────────────────────────────────────────────────────
// Só aceita links https:// (ou imagem embutida data:image/). Qualquer outra coisa vira ''.
function safeUrl(u){
  u = String(u||'').trim();
  if(/^https:\/\/[^\s"'<>]+$/i.test(u)) return u;
  return '';
}
function safeImg(u){
  u = String(u||'').trim();
  if(/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(u)) return u;
  return safeUrl(u);
}
function normPhone(p){
  let d = String(p||'').replace(/\D/g,'');
  if(d.length===10 || d.length===11) d = '55'+d; // DDD + número → adiciona Brasil
  return d;
}
function instaHandle(v){
  v = String(v||'').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/^@/,'').replace(/[\/?#].*$/,'');
  return /^[A-Za-z0-9._]{1,30}$/.test(v) ? v : '';
}
function instaPostCode(url){
  const m = String(url||'').match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : '';
}

// ── HORÁRIOS ──────────────────────────────────────────────────────────────────
function toMin(t){ const [h,m] = String(t||'0:0').split(':').map(Number); return (h||0)*60+(m||0); }
function fromMin(n){ return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0'); }
function dateStrLocal(d){
  d = d || new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dataFechada(site, dateStr){
  return !!(site && Array.isArray(site.datasFechadas) && site.datasFechadas.includes(dateStr));
}
// A barbearia abre nesse dia? (considera dias da semana e datas fechadas/feriados)
function lojaAbreNoDia(site, dateStr){
  const dow = new Date(dateStr+'T12:00').getDay();
  if(dataFechada(site, dateStr)) return false;
  if(site && site.horarios && site.horarios[dow]) return !!site.horarios[dow].aberto;
  return dow !== 0; // sem configuração: domingo fechado (comportamento original)
}
// O barbeiro atende nesse dia?
function barbeiroAtende(b, dateStr){
  if(!b) return true;
  const dow = new Date(dateStr+'T12:00').getDay();
  if(Array.isArray(b.dias) && b.dias.length) return b.dias.includes(dow);
  return true;
}
// Lista de horários (strings "HH:MM") possíveis para um dia, de acordo com loja e (opcional) barbeiro
function gerarSlots(site, dateStr, barbeiro){
  if(!lojaAbreNoDia(site, dateStr)) return [];
  if(barbeiro && !barbeiroAtende(barbeiro, dateStr)) return [];
  const dow = new Date(dateStr+'T12:00').getDay();
  let slots;
  const h = site && site.horarios && site.horarios[dow];
  if(h){
    slots = [];
    const ini = toMin(h.abre), fim = toMin(h.fecha);
    const p1 = h.pausaIni ? toMin(h.pausaIni) : null, p2 = h.pausaFim ? toMin(h.pausaFim) : null;
    for(let t=ini; t+30<=fim; t+=30){
      if(p1!==null && p2!==null && t>=p1 && t<p2) continue;
      slots.push(fromMin(t));
    }
  } else {
    slots = [...HOURS_PADRAO];
  }
  if(barbeiro){
    if(barbeiro.inicio) slots = slots.filter(s=>toMin(s)>=toMin(barbeiro.inicio));
    if(barbeiro.fim)    slots = slots.filter(s=>toMin(s)+30<=toMin(barbeiro.fim));
  }
  return slots;
}
// "Aberto agora" baseado nos horários configurados (null se o dono ainda não configurou)
function statusAbertoAgora(site, agora){
  if(!site || !site.horarios) return null;
  agora = agora || new Date();
  const dateStr = dateStrLocal(agora);
  const dow = agora.getDay();
  const h = site.horarios[dow];
  const min = agora.getHours()*60 + agora.getMinutes();
  if(dataFechada(site, dateStr)) return {aberto:false, motivo:'feriado'};
  if(!h || !h.aberto) return {aberto:false, motivo:'hoje'};
  const ini = toMin(h.abre), fim = toMin(h.fecha);
  if(min < ini) return {aberto:false, motivo:'abre', hora:h.abre};
  if(min >= fim) return {aberto:false, motivo:'fechou'};
  if(h.pausaIni && h.pausaFim && min>=toMin(h.pausaIni) && min<toMin(h.pausaFim))
    return {aberto:false, motivo:'pausa', hora:h.pausaFim};
  return {aberto:true, ate:h.fecha};
}
// Chave do documento de "disponibilidade" (espelho público de horários ocupados)
function dispKey(date, time, barberId){
  return barberId ? `${date}_${time}_${barberId}` : `${date}_${time}`;
}
// Um agendamento (ou espelho) ocupa o horário desse barbeiro?
// Agendamentos antigos (sem barberId) bloqueiam todos, por segurança contra horário duplo.
function ocupaBarbeiro(bk, date, time, barberId){
  if(bk.date!==date || bk.time!==time || bk.status==='cancelled') return false;
  if(!barberId) return true;
  return !bk.barberId || bk.barberId===barberId;
}

// ── MARCA ─────────────────────────────────────────────────────────────────────
function clamp(n){ return Math.max(0, Math.min(255, Math.round(n))); }
function ajustaCor(hex, f){ // f>0 clareia, f<0 escurece
  const m = /^#?([0-9a-f]{6})$/i.exec(hex||''); if(!m) return null;
  const n = parseInt(m[1],16); let r=n>>16, g=(n>>8)&255, b=n&255;
  if(f>=0){ r+= (255-r)*f; g+= (255-g)*f; b+= (255-b)*f; } else { r*=1+f; g*=1+f; b*=1+f; }
  return '#'+[r,g,b].map(x=>clamp(x).toString(16).padStart(2,'0')).join('');
}
function aplicarCorMarca(hex){
  if(!/^#[0-9a-f]{6}$/i.test(hex||'')) return;
  const r = document.documentElement.style;
  r.setProperty('--gold', hex);
  r.setProperty('--gold-light', ajustaCor(hex, .25));
  r.setProperty('--gold-dark', ajustaCor(hex, -.25));
  const meta = document.querySelector('meta[name="theme-color"]'); if(meta) meta.setAttribute('content', hex);
}

// ── IMAGENS ───────────────────────────────────────────────────────────────────
// Reduz a foto no próprio celular antes de salvar (fica leve e cabe no Firestore).
function comprimirImagem(file, maxLado=900, qualidade=0.8){
  return new Promise((resolve, reject)=>{
    if(!file || !/^image\//.test(file.type)) return reject(new Error('Escolha um arquivo de imagem.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = ()=>{
      const esc = Math.min(1, maxLado/Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width*esc); c.height = Math.round(img.height*esc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', qualidade));
    };
    img.onerror = ()=>{ URL.revokeObjectURL(url); reject(new Error('Não foi possível ler a imagem.')); };
    img.src = url;
  });
}
