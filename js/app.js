const C=window.CFG,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const kz=n=>new Intl.NumberFormat('pt-AO').format(n)+' Kz';
const FB="this.onerror=null;this.src='assets/icon.png'";
const ok=/^https?:/.test(C.SUPABASE_URL);let SS={open:true,methods:'cash',min_order:0},S=JSON.parse(localStorage.af_logos||'{}'),LR=localStorage.af_logos!=null,sb,P=[],Z=[],cat='Todos',cart=JSON.parse(localStorage.af_cart||'{}');
const ST={recebido:'Pedido recebido',preparando:'Em preparação',pronto:'Pronto',a_caminho:'A caminho',entregue:'Entregue',cancelado:'Cancelado'};
const FLOW={pickup:['recebido','preparando','pronto','entregue'],delivery:['recebido','preparando','a_caminho','entregue']};

// Hero interactivo
const words=['pizzas','refeições','salgados','doces','bebidas'];let wi=0;
setInterval(()=>{const r=$('#rot');r.classList.add('out');setTimeout(()=>{r.textContent=words[++wi%words.length];r.classList.remove('out')},300)},2200);
$('#top').addEventListener('mousemove',e=>{const b=$('#stage').getBoundingClientRect(),x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;$('.ico').style.transform=`rotateY(${x*18}deg) rotateX(${-y*18}deg) scale(1.04)`});
$$('.chip').forEach(b=>b.onclick=()=>{cat=b.dataset.cat;renderMenu();$('#menu').scrollIntoView()});

if(!ok){$('#warn').hidden=false}else{sb=supabase.createClient(C.SUPABASE_URL,C.SUPABASE_KEY);load();storeStatus()}
async function load(){
 const [p,z,pa,ev,se]=await Promise.all([sb.from('products').select('*').order('category').order('name'),sb.from('zones').select('*').order('municipality'),sb.from('partners').select('*').order('name'),sb.from('events').select('*').order('event_date',{ascending:false}),sb.from('settings').select('*')]);
 S=Object.fromEntries((se.data||[]).map(r=>[r.key,r.value]));localStorage.af_logos=JSON.stringify(S);LR=true;logos();
 P=p.data||[];Z=z.data||[];renderMenu();renderCart();
 $('#mun').innerHTML='<option value="">Município (obrigatório)</option>'+Z.map(x=>`<option>${esc(x.municipality)}</option>`).join('');
$('#partners').innerHTML=(pa.data||[]).map(x=>{const u=/^https?:\/\//.test(x.url||'')?x.url:'',i=`<img src="${esc(x.image_url)}" alt="${esc(x.name)}" onerror="${FB}"><p>${esc(x.name)}</p>`;return u?`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(x.name)} (abre noutro separador)">${i}</a>`:`<div>${i}</div>`}).join('')||'<p>Em breve.</p>';
 $('#events').innerHTML=(ev.data||[]).map(x=>`<div class="card"><img src="${esc(x.image_url)}" alt="" onerror="${FB}"><div><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p></div></div>`).join('')||'<p>Em breve.</p>';
}
function renderMenu(){
 const cs=['Todos',...new Set(P.map(p=>p.category))];
 $('#cats').innerHTML=cs.map(c=>`<button class="${c==cat?'on':''}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
 $$('#cats button').forEach(b=>b.onclick=()=>{cat=b.dataset.c;renderMenu()});
 $('#grid').innerHTML=P.filter(p=>cat=='Todos'||p.category==cat).map(p=>`<div class="card"><img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy" onerror="${FB}"><div><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="pr"><b>${kz(p.price)}</b><button class="add" data-add="${p.id}" aria-label="Adicionar ${esc(p.name)}">+</button></div></div></div>`).join('')||'<p>Sem produtos nesta categoria.</p>';
 $$('[data-add]').forEach(b=>b.onclick=()=>{add(b.dataset.add,1);openCart()});
}
function add(id,d){cart[id]=(cart[id]||0)+d;if(cart[id]<=0)delete cart[id];localStorage.af_cart=JSON.stringify(cart);renderCart()}
const sub=()=>Object.entries(cart).reduce((s,[id,q])=>s+(P.find(p=>p.id==id)?.price||0)*q,0);
function renderCart(){
 cart=Object.fromEntries(Object.entries(cart).filter(([id])=>!P.length||P.some(p=>p.id==id)));
 $('#cartN').textContent=Object.values(cart).reduce((a,b)=>a+b,0);$('#sub').textContent=kz(sub());
 $('#items').innerHTML=Object.entries(cart).map(([id,q])=>{const p=P.find(x=>x.id==id);return p?`<div class="it"><div><b>${esc(p.name)}</b><br><small>${kz(p.price)}</small></div><div class="q"><button data-d="-1" data-i="${id}">−</button>${q}<button data-d="1" data-i="${id}">+</button></div></div>`:''}).join('')||'<p>O carrinho está vazio.</p>';
 $$('#items button').forEach(b=>b.onclick=()=>add(b.dataset.i,+b.dataset.d));const miss=Math.max(0,(+SS.min_order||0)-sub());$('#minNote').textContent=+SS.min_order?`Pedido mínimo: ${kz(SS.min_order)}${miss&&sub()?' — faltam '+kz(miss):''}`:'';$('#go').disabled=!Object.keys(cart).length||!SS.open||miss>0;$('#go').textContent=SS.open?'Finalizar pedido':'Fechado de momento';
}
const openCart=()=>{$('#drawer').classList.add('open');$('#ov').classList.add('on')},closeCart=()=>{$('#drawer').classList.remove('open');$('#ov').classList.remove('on')};
$('#cartBtn').onclick=openCart;$('#cx').onclick=closeCart;$('#ov').onclick=closeCart;
$('#go').onclick=()=>{closeCart();$('#cf').hidden=false;$('#ok').hidden=true;$('#err').textContent='';payUI();upd();$('#co').showModal()};
$('#cox').onclick=()=>$('#co').close();
const mode=()=>$('#cf').elements.mode.value,fee=()=>mode()=='delivery'?Z.find(z=>z.municipality==$('#mun').value)?.fee:0;
function upd(){payInfo();const d=mode()=='delivery',f=fee();$('#addr').hidden=!d;$('#mun').required=d;$('#t1').textContent=kz(sub());$('#t2').textContent=!d?'Grátis (levantamento)':f==null?'Escolha o município':kz(f);$('#t3').textContent=kz(sub()+(f||0))}
$('#cf').addEventListener('input',upd);
$('#cf').onsubmit=async e=>{e.preventDefault();const f=e.target,b=$('#sendBtn');b.disabled=true;$('#err').textContent='';
 if(f.elements.website.value)return;
 if(Date.now()-(+localStorage.af_last||0)<45000){b.disabled=false;$('#err').textContent='Aguarde um instante antes de enviar outro pedido.';return}
 if(!f.elements.pay?.value){b.disabled=false;$('#err').textContent='Escolha a forma de pagamento.';return}
 const {data:ref,error}=await sb.rpc('create_order',{p_name:f.elements.name.value,p_phone:f.elements.phone.value,p_mode:mode(),p_mun:f.elements.mun.value,p_neigh:f.elements.neigh.value,p_street:f.elements.street.value,p_notes:f.elements.notes.value,p_items:Object.entries(cart).map(([id,qty])=>({id,qty})),p_payment:f.elements.pay.value});
 b.disabled=false;if(error){$('#err').textContent='Não foi possível enviar: '+error.message;return}
 const lines=Object.entries(cart).map(([id,q])=>{const p=P.find(x=>x.id==id);return `• ${q}x ${p.name}`}).join('\n'),tot=sub()+(fee()||0);
 const msg=`Olá Aliado Food! Pedido ${ref}\n${lines}\n${mode()=='delivery'?`Entrega: ${f.elements.mun.value}${f.elements.neigh.value?', '+f.elements.neigh.value:''}${f.elements.street.value?', '+f.elements.street.value:''}`:'Levantamento no ponto de venda'}\nPagamento: ${PAYL[f.elements.pay.value]}\nTotal: ${kz(tot)}\nCliente: ${f.elements.name.value} (${f.elements.phone.value})`;
 const url=`https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent(msg)}`;
 fetch('https://formsubmit.co/ajax/'+C.EMAIL,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({_subject:'Novo pedido '+ref,_template:'table','Referência':ref,'Cliente':f.elements.name.value,'Telemóvel':f.elements.phone.value,'Modo':mode()=='delivery'?'Entrega — '+f.elements.mun.value+' '+f.elements.neigh.value+' '+f.elements.street.value:'Levantamento','Pagamento':PAYL[f.elements.pay.value],'Total':kz(tot),'Itens':lines.replace(/\n/g,' | '),'Notas':f.elements.notes.value})}).catch(()=>{});
 cart={};localStorage.af_cart='{}';localStorage.af_ref=ref;localStorage.af_last=Date.now();renderCart();f.hidden=true;
 $('#ok').hidden=false;$('#ok').innerHTML=`<h3>Pedido recebido!</h3><p>Guarde a sua referência para acompanhar o pedido:</p><div class="ref">${esc(ref)}</div>${['transfer','express'].includes(f.elements.pay.value)?'<p>Efectue o pagamento e envie o comprovativo pelo WhatsApp.</p>':''}<a class="btn big" href="${url}" target="_blank" rel="noopener">Enviar por WhatsApp</a><button class="btn ghost" style="color:var(--r);box-shadow:inset 0 0 0 2px var(--r)" id="trkGo">Rastrear pedido</button>`;
 $('#trkGo').onclick=()=>{$('#co').close();$('#ref').value=ref;$('#rastreio').scrollIntoView();track(ref)};
 if($('#wa').checked)window.open(url,'_blank');
};
async function track(r){const o=$('#trkOut');const {data,error}=await sb.rpc('track_order',{p_ref:r});
 if(error||!data){o.innerHTML='<p class="err">Referência não encontrada. Verifique e tente novamente.</p>';return}
 const fl=FLOW[data.mode],i=fl.indexOf(data.status);
 o.innerHTML=`<h3>${esc(data.reference)}</h3><p><b>${ST[data.status]||esc(data.status)}</b> · ${kz(data.total)}${data.courier?' · Estafeta: '+esc(data.courier):''}</p>${data.status=='cancelado'?'':`<div class="steps">${fl.map((s,k)=>`<i class="${k<=i?'on':''}" title="${ST[s]}"></i>`).join('')}</div>`}<small>${new Date(data.created_at).toLocaleString('pt-AO')}</small>`}
$('#trk').onsubmit=e=>{e.preventDefault();track($('#ref').value)};if(localStorage.af_ref)$('#ref').value=localStorage.af_ref;
$('#job').onsubmit=async e=>{e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f)),m=$('#jobMsg');m.textContent='A enviar…';
 const {error}=await sb.from('applications').insert(d);
 fetch('https://formsubmit.co/ajax/'+C.EMAIL,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({_subject:'Candidatura — Aliado Food',...d})}).catch(()=>{});
 m.textContent=error?'Erro ao enviar. Tente novamente ou escreva para '+C.EMAIL:'Candidatura enviada. Obrigado!';if(!error)f.reset()};

$('#yr').textContent=new Date().getFullYear();const E=window.EMP||{};
$('#legal').textContent=[E.legal,E.nif&&'NIF '+E.nif,E.alvara&&'Alvará '+E.alvara,E.morada].filter(Boolean).join(' · ');

const IC={sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'};
function setTheme(t){document.documentElement.dataset.theme=t;localStorage.af_theme=t;logos();$('#themeBtn').innerHTML=`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[t=='dark'?'sun':'moon']}</svg>`}
$('#themeBtn').onclick=()=>setTheme(document.documentElement.dataset.theme=='dark'?'light':'dark');setTheme(document.documentElement.dataset.theme||'light');

function logos(){const dk=document.documentElement.dataset.theme=='dark',h=(dk&&S.logo_header_dark)||S.logo_header,f=S.logo_footer,set=(el,u)=>{if(!el)return;el.src=u||'assets/logo.png';el.classList.toggle('tr',!!u)},ph=(id,u)=>{const el=$(id);if(!el)return;if(!el.dataset.d)el.dataset.d=el.getAttribute('src');el.src=u||el.dataset.d};set($('#logoH'),h);set($('#logoF'),f);ph('#sbi1',S.sobre_img1);ph('#sbi2',S.sobre_img2);if(LR)document.querySelectorAll('img.lg,img.sbp').forEach(e=>e.classList.add('on'))}
setTimeout(()=>{LR=true;logos()},2500);

$('#teamBtn')?.addEventListener('click',async()=>{const g=$('#teamGrid');$('#teamDlg').showModal();if(!sb)return;g.innerHTML='<p>A carregar…</p>';const {data}=await sb.from('team').select('*').order('name');
 g.innerHTML=(data||[]).map(m=>`<div class="tm"><img src="${esc(m.image_url)}" alt="${esc(m.name)}" onerror="${FB}"><b>${esc(m.name)}</b><span>${esc(m.role)}</span></div>`).join('')||'<p>Em breve vai conhecer quem faz a Aliado Food acontecer.</p>'});
$('#teamX')?.addEventListener('click',()=>$('#teamDlg').close());

const PAYL={cash:'Numerário',tpa:'TPA / Multicaixa na entrega',transfer:'Transferência bancária',express:'Multicaixa Express'};
function payUI(){const ms=(SS.methods||'cash').split(',').filter(m=>PAYL[m]);$('#payOpts').innerHTML=ms.map((m,i)=>`<label><input type="radio" name="pay" value="${m}" ${i?'':'checked'}>${PAYL[m]}</label>`).join('');payInfo()}
function payInfo(){const v=$('#cf').elements.pay?.value,b=$('#payInfo');b.hidden=!(['transfer','express'].includes(v)&&SS.pay_info);b.textContent=SS.pay_info||''}
async function storeStatus(){if(!sb)return;const {data}=await sb.rpc('store_status');if(data)SS=data;const b=$('#storebar'),hm=t=>t?t.slice(0,5):'',p=[];
 if(!SS.open){b.className='sbar closed';p.push('<b>Fechado de momento</b>');p.push(SS.reason=='hours'&&SS.open_time?'Abrimos às '+hm(SS.open_time):'Voltamos em breve')}
 else{b.className='sbar';p.push('<b>Aberto</b>');if(SS.open_time&&SS.close_time)p.push(hm(SS.open_time)+' – '+hm(SS.close_time));if(SS.eta)p.push('Entrega em '+esc(SS.eta));if(+SS.min_order)p.push('Pedido mínimo '+kz(SS.min_order))}
 b.innerHTML=p.map(x=>`<span>${x}</span>`).join('');b.hidden=!data;renderCart()}
setInterval(storeStatus,120000);
