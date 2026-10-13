// Perfil profissional do dono + saudação do dashboard (painel admin).
// Carregado no fim de admin.html, depois do script principal.

adminState.especialidades = [];

function saudacao(){
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : (h < 18 ? 'Boa tarde' : 'Boa noite');
}

// ── Saudação no dashboard ─────────────────────────────────────────────────────
function renderHello(){
  const el = document.getElementById('dashHello'); const a = adminState.admin;
  if(!el || !a) return;
  const hoje = dateStrLocal();
  const deHoje = adminState.bookings.filter(b=>b.date===hoje && b.status!=='cancelled');
  const pend = adminState.bookings.filter(b=>b.status==='pending').length;
  const primeiro = (a.name||'').split(' ')[0] || 'dono';
  const partes = [];
  partes.push(deHoje.length ? `Hoje você tem <b>${deHoje.length}</b> ${deHoje.length===1?'horário':'horários'}.` : 'Nenhum horário marcado para hoje.');
  if(pend) partes.push(`<b>${pend}</b> ${pend===1?'aguarda':'aguardam'} sua confirmação.`);
  el.innerHTML = `
    <div class="hello-txt">
      <h2>${saudacao()}, ${esc(primeiro)}</h2>
      <p>${partes.join(' ')}</p>
    </div>
    <div class="hello-actions">
      <button class="btn-primary" onclick="openModal('newAppt')">+ Novo agendamento</button>
      <a class="hello-link" href="cliente.html" target="_blank" rel="noopener">Ver o site</a>
    </div>
    <div class="pole" aria-hidden="true"></div>`;
}
const _renderDashboardOriginal = renderDashboard;
renderDashboard = function(){ _renderDashboardOriginal(); renderHello(); };

// ── Estatísticas do perfil ────────────────────────────────────────────────────
function renderPerfilStatsAdmin(){
  const el = document.getElementById('pfaStats'); if(!el) return;
  const bks = adminState.bookings || [];
  const feitos = bks.filter(b=>b.status==='done');
  const total = feitos.reduce((s,b)=>s+(Number(b.price)||0),0);
  const mesAtual = dateStrLocal().slice(0,7);
  const mes = feitos.filter(b=>String(b.date).startsWith(mesAtual)).reduce((s,b)=>s+(Number(b.price)||0),0);
  const clientes = new Set(bks.filter(b=>b.status!=='cancelled').map(b=>b.email||b.phone).filter(Boolean)).size;
  const fmt = n => n.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:2});
  el.innerHTML = `
    <div><b>${feitos.length}</b><span>atendimentos concluídos</span></div>
    <div><b>${clientes}</b><span>clientes diferentes</span></div>
    <div><b>R$ ${fmt(mes)}</b><span>faturado neste mês</span></div>
    <div><b>R$ ${fmt(total)}</b><span>faturado no total</span></div>`;
}

// ── Preencher / mostrar perfil ────────────────────────────────────────────────
function iniciarPerfilAdmin(){
  const a = adminState.admin; if(!a) return;
  // Se o perfil público já existe em config/site mas ainda não na ficha do dono, aproveita
  const d = adminState.site && adminState.site.dono;
  if(d){
    ['cargo','cargo_en','bio','bio_en','anos','instagram','especialidades'].forEach(k=>{ if(a[k]===undefined && d[k]!==undefined) a[k]=d[k]; });
    if(!a.foto && d.foto) a.foto = d.foto;
  }
  adminState.especialidades = Array.isArray(a.especialidades) ? [...a.especialidades] : [];
  atualizarCabecalhoAdmin();
  renderHello();
}
function renderPerfilAdmin(){
  const a = adminState.admin; if(!a) return;
  const set = (id,v)=>{ const el = document.getElementById(id); if(el) el.value = v ?? ''; };
  set('pfaName', a.name); set('pfaCargo', a.cargo); set('pfaBio', a.bio); set('pfaAnos', a.anos);
  set('pfaInsta', a.instagram ? '@'+a.instagram : ''); set('pfaCargoEn', a.cargo_en); set('pfaBioEn', a.bio_en);
  set('pfaBiz', a.bizName); set('pfaPhone', a.phone); set('pfaCity', a.city); set('pfaAddr', a.addr);
  set('pfaEmail', a.email || (auth.currentUser && auth.currentUser.email) || '');
  document.getElementById('pfaVisivel').classList.toggle('on', a.visivelSite !== false);
  adminState.especialidades = Array.isArray(a.especialidades) ? [...a.especialidades] : adminState.especialidades;
  renderEspecialidades();
  contarBio();
  pintarCabecalhoPerfil();
  renderPerfilStatsAdmin();
}
function pintarCabecalhoPerfil(){
  const a = adminState.admin; if(!a) return;
  const foto = safeImg(a.foto), capa = safeImg(a.capa);
  document.getElementById('pfaAvatar').innerHTML = foto ? `<img src="${esc(foto)}" alt="">` : esc(iniciais(a.name));
  const cp = document.getElementById('pfaCapa');
  cp.style.backgroundImage = capa ? `linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.45)), url("${capa}")` : '';
  document.getElementById('pfaNome').textContent = a.name || '—';
  document.getElementById('pfaCargoTxt').textContent = [a.cargo, a.bizName].filter(Boolean).join(' • ');
  const desde = a.createdAt ? new Date(a.createdAt) : null;
  document.getElementById('pfaBadges').innerHTML =
    `<span class="pfa-badge gold">Proprietário</span>` +
    (desde && !isNaN(desde) ? `<span class="pfa-badge">Desde ${String(desde.getMonth()+1).padStart(2,'0')}/${desde.getFullYear()}</span>` : '') +
    (a.visivelSite === false ? `<span class="pfa-badge muted">Perfil oculto no site</span>` : `<span class="pfa-badge ok">Visível no site</span>`);
}

// ── Especialidades (chips) ────────────────────────────────────────────────────
function renderEspecialidades(){
  document.getElementById('pfaChips').innerHTML = adminState.especialidades.map((t,i)=>
    `<span class="pfa-chip">${esc(t)}<button type="button" aria-label="Remover ${esc(t)}" onclick="removerEsp(${i})">✕</button></span>`).join('');
}
function addEsp(v){
  v = String(v||'').trim().replace(/,$/,'').slice(0,30);
  if(!v) return;
  if(adminState.especialidades.length >= 8) return toast('Máximo de 8 especialidades','error');
  if(adminState.especialidades.some(x=>x.toLowerCase()===v.toLowerCase())) return;
  adminState.especialidades.push(v); renderEspecialidades();
}
function removerEsp(i){ adminState.especialidades.splice(i,1); renderEspecialidades(); }
function contarBio(){
  const el = document.getElementById('pfaBio'), c = document.getElementById('pfaBioCount');
  if(el && c) c.textContent = el.value.length;
}
document.addEventListener('keydown', e=>{
  if(e.target && e.target.id==='pfaEspIn' && (e.key==='Enter' || e.key===',')){
    e.preventDefault(); addEsp(e.target.value); e.target.value='';
  }
});
document.addEventListener('input', e=>{ if(e.target && e.target.id==='pfaBio') contarBio(); });
document.addEventListener('focusout', e=>{ if(e.target && e.target.id==='pfaEspIn' && e.target.value.trim()){ addEsp(e.target.value); e.target.value=''; } });

// ── Fotos ─────────────────────────────────────────────────────────────────────
async function pfaUploadFoto(file){
  if(!file) return;
  try{
    adminState.admin.foto = await comprimirAvatar(file);
    pintarCabecalhoPerfil(); atualizarCabecalhoAdmin();
    await pfaSalvar({silencioso:true});
    toast('Foto atualizada!','success');
  }catch(e){ toast(e.message || 'Não foi possível enviar a foto','error'); }
}
async function pfaUploadCapa(file){
  if(!file) return;
  try{
    adminState.admin.capa = await comprimirImagemCortada(file, 1100, 0.72, 3.2);
    pintarCabecalhoPerfil();
    await pfaSalvar({silencioso:true});
    toast('Capa atualizada!','success');
  }catch(e){ toast(e.message || 'Não foi possível enviar a capa','error'); }
}

// ── Salvar ────────────────────────────────────────────────────────────────────
async function pfaSalvar(opts){
  const a = adminState.admin; if(!a) return;
  const v = id => document.getElementById(id).value.trim();
  const name = v('pfaName');
  if(name.length < 2) return toast('Digite seu nome','error');
  const insta = v('pfaInsta') ? instaHandle(v('pfaInsta')) : '';
  if(v('pfaInsta') && !insta) return toast('Instagram inválido. Use só o @usuario','error');
  const phone = v('pfaPhone').replace(/\D/g,'');
  if(phone && (phone.length<10 || phone.length>13)) return toast('WhatsApp inválido. Use DDD + número','error');
  const anos = Math.max(0, Math.min(80, parseInt(v('pfaAnos'))||0));
  const visivel = document.getElementById('pfaVisivel').classList.contains('on');

  const dados = {
    name, cargo:v('pfaCargo'), cargo_en:v('pfaCargoEn'), bio:v('pfaBio'), bio_en:v('pfaBioEn'),
    anos, instagram:insta, especialidades:[...adminState.especialidades],
    bizName:v('pfaBiz'), phone, city:v('pfaCity'), addr:v('pfaAddr'),
    visivelSite: visivel, foto: a.foto || '', capa: a.capa || ''
  };
  const publico = {
    nome:name, cargo:dados.cargo, cargo_en:dados.cargo_en, bio:dados.bio, bio_en:dados.bio_en,
    anos, instagram:insta, especialidades:dados.especialidades, foto:dados.foto, visivel
  };
  try{
    await db.collection('admins').doc(a.uid).set(dados, {merge:true});
    await db.collection('config').doc('site').set({dono: publico}, {merge:true});
    Object.assign(adminState.admin, dados);
    if(adminState.site) adminState.site.dono = publico;
    atualizarCabecalhoAdmin(); pintarCabecalhoPerfil(); renderSettings(); renderHello();
    if(!(opts && opts.silencioso)) toast('Perfil salvo! O site já mostra as mudanças.','success');
  }catch(e){
    toast('Não foi possível salvar o perfil ('+(e.code||e.message)+')','error');
  }
}

// ── Trocar senha (exige a senha atual) ───────────────────────────────────────
async function pfaTrocarSenha(){
  const velha = document.getElementById('pfaPassOld').value;
  const nova = document.getElementById('pfaPassNew').value;
  const user = auth.currentUser;
  if(!user) return toast('Sessão expirada. Entre de novo.','error');
  if(!velha || !nova) return toast('Preencha a senha atual e a nova','error');
  if(nova.length < 6) return toast('A nova senha precisa ter pelo menos 6 caracteres','error');
  try{
    await user.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(user.email, velha));
    await user.updatePassword(nova);
    document.getElementById('pfaPassOld').value = ''; document.getElementById('pfaPassNew').value = '';
    toast('Senha alterada com sucesso!','success');
  }catch(e){
    if(['auth/wrong-password','auth/invalid-credential','auth/invalid-login-credentials'].includes(e.code)) toast('A senha atual está incorreta','error');
    else toast('Não foi possível alterar a senha ('+(e.code||e.message)+')','error');
  }
}
