const C=window.CFG,$=s=>document.querySelector(s),sb=supabase.createClient(C.SUPABASE_URL,C.SUPABASE_KEY),V=$('#view');
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const kz=n=>new Intl.NumberFormat('pt-AO').format(n)+' Kz';
const ST={recebido:'Recebido',preparando:'Em preparação',pronto:'Pronto',a_caminho:'A caminho',entregue:'Entregue',cancelado:'Cancelado'};
const T={products:{n:'Produtos',f:[['name','Nome'],['description','Descrição'],['price','Preço (Kz)','number'],['category','Categoria (Refeições, Pizzas, Salgados, Doces, Bebidas)'],['image_url','Imagem','img'],['active','Activo','bool']]},
zones:{n:'Taxas de entrega',f:[['municipality','Município'],['fee','Taxa (Kz)','number']]},
couriers:{n:'Estafetas',f:[['name','Nome'],['phone','Telemóvel (ex.: 2449...)'],['available','Disponível','bool']]},
partners:{n:'Parceiros',f:[['name','Nome'],['image_url','Imagem / logótipo','img']]},
events:{n:'Actividades',f:[['title','Título'],['description','Descrição'],['image_url','Imagem','img'],['event_date','Data','date']]}};
$('#lf').onsubmit=async e=>{e.preventDefault();const {error}=await sb.auth.signInWithPassword({email:e.target.e.value,password:e.target.p.value});if(error)$('#le').textContent='Email ou palavra-passe inválidos.';else init()};
$('#out').onclick=async e=>{e.preventDefault();await sb.auth.signOut();location.reload()};
async function init(){const {data:{session}}=await sb.auth.getSession();if(!session)return;
 const {data}=await sb.from('admins').select('user_id').eq('user_id',session.user.id);
 if(!data?.length){$('#le').textContent='Esta conta não tem permissão de administrador.';return}
 $('#login').hidden=true;$('#panel').hidden=false;
 $('#tabs').innerHTML=[['orders','Pedidos'],...Object.entries(T).map(([k,v])=>[k,v.n])].map(([k,n])=>`<button data-t="${k}">${n}</button>`).join('');
 document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>show(b.dataset.t));show('orders');
 sb.channel('o').on('postgres_changes',{event:'*',schema:'public',table:'orders'},p=>{if(p.eventType=='INSERT')beep();cur=='orders'&&show('orders')}).subscribe()}
function beep(){try{const a=new AudioContext(),o=a.createOscillator();o.connect(a.destination);o.frequency.value=880;o.start();o.stop(a.currentTime+.4)}catch(e){}}
function printOrder(r){const w=open('','_blank');w.document.write(`<body style="font:15px sans-serif;max-width:320px"><h2>Aliado Food</h2><b>${esc(r.reference)}</b><br>${esc(r.customer_name)} · ${esc(r.phone)}<br>${r.mode=='delivery'?'Entrega: '+esc([r.municipality,r.neighborhood,r.street].filter(Boolean).join(', ')):'Levantamento'}<hr>${(r.items||[]).map(i=>`${i.qty}x ${esc(i.name)} — ${kz(i.price*i.qty)}`).join('<br>')}<hr>Entrega: ${kz(r.fee)}<br><b>Total: ${kz(r.total)}</b>${r.notes?'<br>Obs: '+esc(r.notes):''}</body>`);w.document.close();w.print()}
let cur,OL=[];async function show(t){cur=t;document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t==t));t=='orders'?orders():crud(t)}
async function orders(){const [o,c]=await Promise.all([sb.from('orders').select('*').order('created_at',{ascending:false}).limit(100),sb.from('couriers').select('*').order('name')]);
 const cs=c.data||[];OL=o.data||[];V.innerHTML=(o.data||[]).map(r=>{const co=cs.find(x=>x.id==r.courier_id);
 const msg=`Nova entrega Aliado Food\nPedido ${r.reference}\nCliente: ${r.customer_name} (${r.phone})\nLocal: ${[r.municipality,r.neighborhood,r.street].filter(Boolean).join(', ')}\nTotal a cobrar: ${kz(r.total)}`;
 return `<div class="ord"><div><b>${esc(r.reference)}</b> · ${r.mode=='delivery'?'Entrega — '+esc(r.municipality):'Levantamento'}<br>${esc(r.customer_name)} · <a href="https://wa.me/${esc(r.phone.replace(/\D/g,''))}" target="_blank">${esc(r.phone)}</a><br><small>${(r.items||[]).map(i=>i.qty+'x '+esc(i.name)).join(', ')}</small><br><b>${kz(r.total)}</b> <small>(entrega ${kz(r.fee)})</small>${r.notes?'<br><small>Obs: '+esc(r.notes)+'</small>':''}</div>
 <div><select data-s="${r.id}">${Object.entries(ST).map(([k,v])=>`<option value="${k}" ${k==r.status?'selected':''}>${v}</option>`).join('')}</select>
 ${r.mode=='delivery'?`<select data-c="${r.id}"><option value="">Estafeta…</option>${cs.map(x=>`<option value="${x.id}" ${x.id==r.courier_id?'selected':''}>${esc(x.name)}${x.available?'':' (indisponível)'}</option>`).join('')}</select>${co?`<a class="btn" target="_blank" href="https://wa.me/${co.phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}">Enviar ao estafeta</a>`:''}`:''}<button class="btn ghost" data-p="${r.id}">Imprimir</button></div></div>`}).join('')||'<p>Sem pedidos.</p>';
 V.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>printOrder(OL.find(x=>x.id==b.dataset.p)));
 V.querySelectorAll('[data-s]').forEach(s=>s.onchange=async()=>{await sb.from('orders').update({status:s.value}).eq('id',s.dataset.s)});
 V.querySelectorAll('[data-c]').forEach(s=>s.onchange=async()=>{await sb.from('orders').update({courier_id:s.value||null,status:s.value?'a_caminho':'preparando'}).eq('id',s.dataset.c);orders()})}
async function crud(t){const c=T[t],{data}=await sb.from(t).select('*').order(c.f[0][0]),L=data||[];
 V.innerHTML=`<h2>${c.n}</h2><form id="fm" class="fm">${c.f.map(([k,l,ty])=>ty=='bool'?`<label><input type="checkbox" name="${k}" checked style="width:auto"> ${l}</label>`:ty=='img'?`<label>${l}<input type="file" accept="image/*" data-k="${k}"><input name="${k}" placeholder="ou cole o URL da imagem"></label>`:`<label>${l}<input name="${k}" type="${ty||'text'}" ${ty=='number'?'step="any"':''} ${k=='description'?'':'required'}></label>`).join('')}<input type="hidden" name="id"><button class="btn">Guardar</button><button type="button" class="btn ghost" id="clr">Limpar</button><p id="fe" class="err"></p></form>
 ${L.map(r=>`<div class="row"><span>${r.image_url?`<img src="${esc(r.image_url)}" height="36" style="border-radius:6px;vertical-align:middle"> `:''}<b>${esc(r[c.f[0][0]])}</b> ${esc(r[c.f[1][0]]??'')}${r.active===false||r.available===false?' <small>(inactivo)</small>':''}</span><span><button class="btn ghost" data-e="${r.id}">Editar</button> <button class="btn ghost" data-x="${r.id}">Apagar</button></span></div>`).join('')}`;
 const f=$('#fm');$('#clr').onclick=()=>f.reset();
 V.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{const r=L.find(x=>x.id==b.dataset.e);c.f.forEach(([k,,ty])=>{if(ty=='bool')f[k].checked=r[k];else f[k].value=r[k]??''});f.id.value=r.id;scrollTo(0,0)});
 V.querySelectorAll('[data-x]').forEach(b=>b.onclick=async()=>{if(confirm('Apagar este registo?')){const {error}=await sb.from(t).delete().eq('id',b.dataset.x);error?alert(error.message):crud(t)}});
 f.onsubmit=async e=>{e.preventDefault();const o={};
  for(const [k,,ty] of c.f){if(ty=='bool')o[k]=f[k].checked;else if(ty=='img'){const file=f.querySelector(`[data-k=${k}]`).files[0];o[k]=f[k].value;
    if(file){const p=`${t}/${Date.now()}-${file.name.replace(/[^\w.]/g,'_')}`,{error}=await sb.storage.from('media').upload(p,file);if(error){$('#fe').textContent=error.message;return}o[k]=sb.storage.from('media').getPublicUrl(p).data.publicUrl}}
   else o[k]=ty=='number'?+f[k].value:(f[k].value||null)}
  if(f.id.value)o.id=f.id.value;const {error}=await sb.from(t).upsert(o);error?$('#fe').textContent=error.message:crud(t)}}
init();
