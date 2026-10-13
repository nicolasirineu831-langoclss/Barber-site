// Perfil do cliente, "conheça o dono" e detalhes do hero (site do cliente).
// Carregado no fim de cliente.html, depois do script principal.

// ── Textos (PT / EN) ──────────────────────────────────────────────────────────
Object.assign(I18N.pt, {
  pfBookNow:'Novo agendamento', pfTabAppts:'Agendamentos', pfTabData:'Meus dados',
  pfFavBarber:'Barbeiro preferido', pfNoFav:'Sem preferência', pfPrefs:'Preferências do corte',
  pfPrefsPh:'Ex: degradê baixo, máquina 2 nas laterais, barba alinhada',
  pfPrefsHint:'Preenchemos isso nas observações quando você agenda.',
  pfSave:'Salvar alterações', pfChangePass:'Redefinir senha por e-mail',
  pfSince:'Cliente desde', pfUpcoming:'Próximos', pfHistory:'Histórico',
  pfNoUpcoming:'Você não tem nenhum horário marcado.', pfNoHistory:'Seus atendimentos aparecem aqui depois do primeiro corte.',
  pfBookAgain:'Agendar de novo', pfCancelled:'❌ Cancelado',
  pfStatCuts:'atendimentos', pfStatSpent:'investido', pfStatNext:'próximo horário', pfNone:'Nenhum',
  pfTier0:'Novo cliente', pfTier1:'Cliente fiel', pfTier2:'Cliente da casa', pfTier3:'Cliente VIP',
  pfNextLevel:'Próximo nível', pfMaxTier:'Você está no nível mais alto. Obrigado pela confiança!',
  pfPhotoOk:'Foto atualizada!', pfSaved:'Dados salvos!', pfBadName:'Digite seu nome completo.',
  pfBadPhone:'Telefone inválido. Use DDD + número.', pfErr:'Não foi possível salvar:',
  pfResetSent:'Enviamos um link de redefinição para o seu e-mail.',
  donoYears:'anos de ofício', donoBook:'Agendar comigo', donoBookEn:'Agendar',
  factServices:'serviços', factBarbers:'barbeiros', factService1:'serviço', factBarber1:'barbeiro', factRating:'no Google', factReviews:'avaliações'
});
Object.assign(I18N.en, {
  pfBookNow:'New booking', pfTabAppts:'Bookings', pfTabData:'My details',
  pfFavBarber:'Favorite barber', pfNoFav:'No preference', pfPrefs:'Cut preferences',
  pfPrefsPh:'E.g. low fade, clipper 2 on the sides, sharp beard line',
  pfPrefsHint:'We add this to the notes when you book.',
  pfSave:'Save changes', pfChangePass:'Reset password by e-mail',
  pfSince:'Customer since', pfUpcoming:'Upcoming', pfHistory:'History',
  pfNoUpcoming:'You have no upcoming bookings.', pfNoHistory:'Your visits show up here after your first cut.',
  pfBookAgain:'Book again', pfCancelled:'❌ Cancelled',
  pfStatCuts:'visits', pfStatSpent:'spent', pfStatNext:'next booking', pfNone:'None',
  pfTier0:'New customer', pfTier1:'Loyal customer', pfTier2:'Regular', pfTier3:'VIP',
  pfNextLevel:'Next level', pfMaxTier:"You've reached the top level. Thank you!",
  pfPhotoOk:'Photo updated!', pfSaved:'Details saved!', pfBadName:'Enter your full name.',
  pfBadPhone:'Invalid phone. Use area code + number.', pfErr:'Could not save:',
  pfResetSent:'We sent a reset link to your e-mail.',
  donoYears:'years in the trade', donoBook:'Book with me', donoBookEn:'Book',
  factServices:'services', factBarbers:'barbers', factService1:'service', factBarber1:'barber', factRating:'on Google', factReviews:'reviews'
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function avatarHTML(user){
  const foto = safeImg(user && user.foto);
  return foto ? `<img src="${esc(foto)}" alt="">` : esc(iniciais(user && user.name));
}
const TIERS = [0, 3, 8, 15]; // atendimentos concluídos para cada nível
function tierDe(done){
  let i = 0; TIERS.forEach((n,k)=>{ if(done>=n) i=k; });
  return i;
}
function dataHoraBooking(b){ return new Date(`${b.date}T${(b.time||'00:00')}:00`); }

// ── Entrar / sair ─────────────────────────────────────────────────────────────
function updateProfile(){
  if(!state.user) return;
  document.getElementById('myAccount').style.display = 'block';
  document.getElementById('navSignIn').style.display = 'none';
  document.getElementById('navUser').style.display = 'inline-flex';
  document.getElementById('navAvatar').innerHTML = avatarHTML(state.user);
  document.getElementById('navUserName').textContent = (state.user.name||'').split(' ')[0];
  document.getElementById('pfAvatar').innerHTML = avatarHTML(state.user);
  document.getElementById('pfNome').textContent = state.user.name || '';
  const desde = state.user.createdAt ? new Date(state.user.createdAt) : null;
  document.getElementById('pfSub').textContent = [state.user.email,
    desde && !isNaN(desde) ? `${t('pfSince')} ${t('months')[desde.getMonth()].slice(0,3).toLowerCase()}/${desde.getFullYear()}` : ''].filter(Boolean).join('  •  ');
  preencherFormPerfil();
  ouvirMeusAgendamentos();
}
function limparPerfilUI(){
  document.getElementById('myAccount').style.display = 'none';
  document.getElementById('navSignIn').style.display = '';
  document.getElementById('navUser').style.display = 'none';
}
function irParaPerfil(){
  const el = document.getElementById('myAccount'); if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
}
function preencherFormPerfil(){
  const u = state.user; if(!u) return;
  document.getElementById('pfName').value = u.name || '';
  document.getElementById('pfPhone').value = u.phone || '';
  document.getElementById('pfBirth').value = u.birth || '';
  document.getElementById('pfPrefs').value = u.prefs || '';
  const wrap = document.getElementById('pfFavWrap');
  wrap.style.display = BARBERS.length ? '' : 'none';
  document.getElementById('pfFav').innerHTML = `<option value="">${esc(t('pfNoFav'))}</option>` +
    BARBERS.map(b=>`<option value="${esc(b.id)}" ${u.barbeiroFav===b.id?'selected':''}>${esc(b.nome)}</option>`).join('');
}
function pfAba(aba){
  const ag = aba==='agenda';
  document.getElementById('pfPainelAgenda').style.display = ag ? '' : 'none';
  document.getElementById('pfPainelDados').style.display = ag ? 'none' : '';
  document.getElementById('pfTabBtnAgenda').classList.toggle('active', ag);
  document.getElementById('pfTabBtnDados').classList.toggle('active', !ag);
}

// ── Salvar perfil ─────────────────────────────────────────────────────────────
async function salvarPerfilCliente(campos){
  const u = state.user; if(!u) throw new Error('Sem sessão');
  const base = {};
  if(!u.createdAt) base.createdAt = new Date().toISOString();
  if(!u.email) base.email = auth.currentUser ? auth.currentUser.email : '';
  const dados = {...base, ...campos};
  await db.collection('clientes').doc(u.uid).set(dados, {merge:true});
  Object.assign(state.user, dados);
}
async function pfTrocarFoto(file){
  if(!file || !state.user) return;
  try{
    const foto = await comprimirAvatar(file);
    await salvarPerfilCliente({foto});
    updateProfile();
    toast(t('pfPhotoOk'), 'success');
  }catch(e){ toast((e && e.message) || t('pfErr'), 'error'); }
}
async function pfSalvar(){
  const name = document.getElementById('pfName').value.trim();
  const phone = document.getElementById('pfPhone').value.replace(/\D/g,'');
  if(name.length < 2) return toast(t('pfBadName'), 'error');
  if(phone && (phone.length < 10 || phone.length > 11)) return toast(t('pfBadPhone'), 'error');
  try{
    await salvarPerfilCliente({
      name, phone,
      birth: document.getElementById('pfBirth').value || '',
      prefs: document.getElementById('pfPrefs').value.trim().slice(0,280),
      barbeiroFav: document.getElementById('pfFav').value || ''
    });
    updateProfile();
    toast(t('pfSaved'), 'success');
    pfAba('agenda');
  }catch(e){ toast(t('pfErr')+' '+(e.code||e.message), 'error'); }
}
async function pfTrocarSenha(){
  try{
    auth.languageCode = lang==='en' ? 'en' : 'pt-BR';
    await auth.sendPasswordResetEmail(state.user.email);
    toast(t('pfResetSent'), 'success');
  }catch(e){ toast(t('tResetErr')+' ['+(e.code||e.message)+']', 'error'); }
}

// ── Agendamentos (estilo comanda) ─────────────────────────────────────────────
function ticketHTML(b, passado){
  const d = new Date(b.date+'T12:00');
  const mes = isNaN(d) ? '' : t('months')[d.getMonth()].slice(0,3);
  const dia = isNaN(d) ? '' : String(d.getDate()).padStart(2,'0');
  const st = {pending:t('pending'), confirmed:t('confirmed'), done:t('done'), cancelled:t('pfCancelled')}[b.status] || t('pending');
  const cls = {pending:'pending', confirmed:'confirmed', done:'done', cancelled:'cancelled'}[b.status] || 'pending';
  return `<div class="ticket ${passado?'passado':''} st-${cls}">
    <div class="ticket-stub"><b>${esc(dia)}</b><span>${esc(mes)}</span></div>
    <div class="ticket-body">
      <div class="ticket-svc">${esc(b.service)}</div>
      <div class="ticket-meta">
        <span>${esc(b.time)}</span>
        ${b.barber ? `<span>${esc(b.barber)}</span>` : ''}
        <span>R$ ${esc(fmtPreco(b.price))}</span>
      </div>
    </div>
    <div class="ticket-side">
      <span class="badge ${cls}">${st}</span>
      ${passado ? `<button class="ticket-again" onclick="agendarDeNovo('${esc(b.serviceId||'')}','${esc(b.service||'')}')">${esc(t('pfBookAgain'))}</button>` : ''}
    </div>
  </div>`;
}
function renderMyAppointments(){
  const box = document.getElementById('myAppointments');
  if(!box) return;
  const mine = (state.myBookings || []).slice();
  const agora = new Date();
  const proximos = mine.filter(b=>(b.status==='pending'||b.status==='confirmed') && dataHoraBooking(b) >= new Date(agora.getTime()-60*60*1000))
                       .sort((a,b)=>dataHoraBooking(a)-dataHoraBooking(b));
  const historico = mine.filter(b=>!proximos.includes(b)).sort((a,b)=>dataHoraBooking(b)-dataHoraBooking(a));

  const feitos = mine.filter(b=>b.status==='done');
  const gasto = feitos.reduce((s,b)=>s+(Number(b.price)||0),0);
  const nivel = tierDe(feitos.length);
  const prox = proximos[0];
  const proxTxt = prox ? `${dataBR(prox.date).slice(0,5)} ${prox.time}` : t('pfNone');

  // nível + barra de progresso até o próximo
  const tierEl = document.getElementById('pfTier');
  if(nivel < TIERS.length-1){
    const falta = TIERS[nivel+1]-feitos.length;
    const pct = Math.min(100, Math.round(((feitos.length-TIERS[nivel])/(TIERS[nivel+1]-TIERS[nivel]))*100));
    tierEl.innerHTML = `<span class="tier-name">${esc(t('pfTier'+nivel))}</span>
      <span class="tier-bar"><i style="width:${pct}%"></i></span>
      <span class="tier-next">${esc(t('pfNextLevel'))}: ${esc(t('pfTier'+(nivel+1)))} (+${falta})</span>`;
  } else {
    tierEl.innerHTML = `<span class="tier-name">${esc(t('pfTier'+nivel))}</span><span class="tier-next">${esc(t('pfMaxTier'))}</span>`;
  }
  document.getElementById('pfStats').innerHTML = `
    <div><b>${feitos.length}</b><span>${esc(t('pfStatCuts'))}</span></div>
    <div><b>R$ ${esc(fmtPreco(gasto))}</b><span>${esc(t('pfStatSpent'))}</span></div>
    <div><b>${esc(proxTxt)}</b><span>${esc(t('pfStatNext'))}</span></div>`;

  box.innerHTML = `
    <h3 class="pf-h">${esc(t('pfUpcoming'))}</h3>
    ${proximos.length ? proximos.map(b=>ticketHTML(b,false)).join('') : `<p class="pf-vazio">${esc(t('pfNoUpcoming'))}</p>`}
    <h3 class="pf-h">${esc(t('pfHistory'))}</h3>
    ${historico.length ? historico.map(b=>ticketHTML(b,true)).join('') : `<p class="pf-vazio">${esc(t('pfNoHistory'))}</p>`}`;
}
function agendarDeNovo(serviceId, nome){
  const s = SERVICES.find(x=>x.id===serviceId) || SERVICES.find(x=>x.name===nome);
  if(s) openBookingWithService(s.id); else openBooking();
}
// Preenche o formulário de agendamento com os dados do perfil
function preencherAgendamento(){
  const u = state.user; if(!u) return;
  const set = (id,v)=>{ const el = document.getElementById(id); if(el && !el.value && v) el.value = v; };
  set('bkName', u.name); set('bkEmail', u.email); set('bkPhone', u.phone); set('bkNotes', u.prefs);
  if(u.barbeiroFav && BARBERS.length && barbeiroPorId(u.barbeiroFav)){
    state.selectedBarber = u.barbeiroFav; renderBarberPick(); atualizaBtnStep2();
  }
}

// ── Conheça o dono (vem do perfil profissional salvo no painel) ───────────────
function renderDono(){
  const sec = document.getElementById('dono');
  const d = SITE.dono;
  if(!d || !d.nome || d.visivel === false){ sec.style.display='none'; return; }
  sec.style.display = '';
  const foto = safeImg(d.foto);
  const cargo = lang==='en' ? (d.cargo_en || d.cargo) : d.cargo;
  const bio = lang==='en' ? (d.bio_en || d.bio) : d.bio;
  const tags = (d.especialidades||[]).filter(Boolean);
  const insta = instaHandle(d.instagram);
  const anos = parseInt(d.anos)||0;
  document.getElementById('donoInner').innerHTML = `
    <div class="dono">
      <figure class="dono-foto">
        ${foto ? `<img src="${esc(foto)}" alt="${esc(d.nome)}" loading="lazy">` : `<div class="dono-ini">${esc(iniciais(d.nome))}</div>`}
      </figure>
      <div class="dono-txt">
        ${cargo ? `<p class="dono-cargo">${esc(cargo)}</p>` : ''}
        <h2 class="section-title">${esc(d.nome)}</h2>
        ${bio ? `<p class="dono-bio">${esc(bio)}</p>` : ''}
        ${tags.length ? `<ul class="dono-tags">${tags.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        ${anos ? `<div class="dono-num"><b>${anos}</b><span>${esc(t('donoYears'))}</span></div>` : ''}
        <div class="btn-row">
          <button class="btn-sm gold" onclick="openBooking()">✂ ${esc(t('donoBook'))}</button>
          ${insta ? `<a class="btn-sm" href="https://www.instagram.com/${esc(insta)}/" target="_blank" rel="noopener noreferrer">@${esc(insta)}</a>` : ''}
        </div>
      </div>
    </div>`;
}

// ── Números do hero ───────────────────────────────────────────────────────────
function renderHeroFacts(){
  const el = document.getElementById('heroFacts'); if(!el) return;
  const f = [];
  const padrao = SERVICES[0] && String(SERVICES[0].id).startsWith('padrao-');
  if(SERVICES.length && !padrao) f.push([SERVICES.length, t(SERVICES.length===1?'factService1':'factServices')]);
  if(BARBERS.length) f.push([BARBERS.length, t(BARBERS.length===1?'factBarber1':'factBarbers')]);
  if(SITE.googleNota) f.push([SITE.googleNota, t('factRating') + (SITE.googleQtd ? ` (${SITE.googleQtd} ${t('factReviews')})` : '')]);
  el.innerHTML = f.slice(0,3).map(x=>`<div><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join('');
}

// Primeira pintura: aplica as chaves novas e redesenha
applyLang();
