-- ALIADO FOOD — execute tudo no Supabase > SQL Editor
create extension if not exists pgcrypto;
create table admins(user_id uuid primary key references auth.users on delete cascade);
create function is_admin() returns boolean language sql security definer stable as $$select exists(select 1 from admins where user_id=auth.uid())$$;
create table products(id uuid primary key default gen_random_uuid(),name text not null,description text,price numeric not null,category text not null,image_url text,active boolean default true);
create table zones(id uuid primary key default gen_random_uuid(),municipality text unique not null,fee numeric not null);
create table couriers(id uuid primary key default gen_random_uuid(),name text not null,phone text not null,available boolean default true);
create table partners(id uuid primary key default gen_random_uuid(),name text not null,image_url text);
create table events(id uuid primary key default gen_random_uuid(),title text not null,description text,image_url text,event_date date);
create table applications(id uuid primary key default gen_random_uuid(),name text,email text,phone text,role text,message text,created_at timestamptz default now());
create table orders(id uuid primary key default gen_random_uuid(),reference text unique not null,customer_name text,phone text,mode text check(mode in('pickup','delivery')),municipality text,neighborhood text,street text,notes text,items jsonb,subtotal numeric,fee numeric,total numeric,status text default 'recebido',courier_id uuid references couriers,created_at timestamptz default now());

do $$ declare t text; begin
 foreach t in array array['products','zones','couriers','partners','events','applications','orders'] loop
  execute format('alter table %I enable row level security',t);
  execute format('create policy "admin_%1$s" on %1$I for all using(is_admin()) with check(is_admin())',t);
 end loop; end$$;
alter table admins enable row level security;
create policy admins_self on admins for select using (user_id=auth.uid());
create policy pub_products on products for select using(active);
create policy pub_zones on zones for select using(true);
create policy pub_partners on partners for select using(true);
create policy pub_events on events for select using(true);
create policy app_insert on applications for insert with check(true);

-- Cria o pedido; preços e taxa são calculados no servidor (o cliente não os pode alterar)
create function create_order(p_name text,p_phone text,p_mode text,p_mun text,p_neigh text,p_street text,p_notes text,p_items jsonb)
returns text language plpgsql security definer set search_path=public as $$
declare sub numeric; f numeric:=0; ref text; its jsonb;
begin
 select jsonb_agg(jsonb_build_object('name',p.name,'price',p.price,'qty',least(greatest((i->>'qty')::int,1),50))),
        sum(p.price*least(greatest((i->>'qty')::int,1),50)) into its,sub
 from jsonb_array_elements(p_items) i join products p on p.id=(i->>'id')::uuid and p.active;
 if sub is null then raise exception 'Carrinho vazio'; end if;
 if p_mode='delivery' then
  select fee into f from zones where municipality=p_mun;
  if f is null then raise exception 'Município inválido'; end if;
 end if;
 ref:='AF-'||to_char(now(),'YYMMDD')||'-'||upper(substr(md5(random()::text||clock_timestamp()::text),1,5));
 insert into orders(reference,customer_name,phone,mode,municipality,neighborhood,street,notes,items,subtotal,fee,total)
 values(ref,p_name,p_phone,p_mode,case when p_mode='delivery' then p_mun end,p_neigh,p_street,p_notes,its,sub,f,sub+f);
 return ref;
end$$;

create function track_order(p_ref text) returns json language sql security definer set search_path=public as $$
 select json_build_object('reference',o.reference,'status',o.status,'mode',o.mode,'total',o.total,'created_at',o.created_at,'courier',c.name)
 from orders o left join couriers c on c.id=o.courier_id where o.reference=upper(trim(p_ref))$$;
grant execute on function create_order,track_order to anon,authenticated;

insert into storage.buckets(id,name,public) values('media','media',true) on conflict do nothing;
create policy media_admin on storage.objects for all using(bucket_id='media' and is_admin()) with check(bucket_id='media' and is_admin());
alter publication supabase_realtime add table orders;

-- Taxas ESTIMADAS (referência tipo Yango moto, partida do aeroporto). Ajuste no painel admin > Taxas de entrega.
insert into zones(municipality,fee) values('Luanda',1500),('Kilamba Kiaxi',2000),('Cazenga',2000),('Talatona',2500),('Belas',3000),('Viana',3000),('Cacuaco',3500),('Icolo e Bengo',6000),('Quiçama',9000);

insert into products(name,description,category,price,image_url) values
('Prato do Dia','Arroz, feijão e carne grelhada da casa','Refeições',4500,'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'),
('Frango Grelhado','Meio frango, batata frita e salada','Refeições',6000,'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600'),
('Pizza Margherita','Molho, mozzarella e manjericão','Pizzas',7500,'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600'),
('Pizza Pepperoni','Pepperoni e mozzarella dupla','Pizzas',9000,'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600'),
('Coxinha','Recheio de frango cremoso','Salgados',700,'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600'),
('Pastel de Carne','Crocante e bem recheado','Salgados',600,'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600'),
('Donut Glaceado','Macio, com cobertura de açúcar','Doces',900,'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600'),
('Sumo Natural','Fruta da época, 400 ml','Bebidas',1200,'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600'),
('Refrigerante','Lata 330 ml gelada','Bebidas',500,'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600');
insert into partners(name,image_url) values('Parceiro 1','https://placehold.co/300x200/BF220D/white?text=Parceiro+1'),('Parceiro 2','https://placehold.co/300x200/F0991E/white?text=Parceiro+2'),('Parceiro 3','https://placehold.co/300x200/BF220D/white?text=Parceiro+3');
insert into events(title,description,image_url,event_date) values('Aliado Food no Aeroporto','O nosso ponto de venda sempre pronto para si.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',current_date),('Festival de Sabores','Pizzas, salgados e doces ao vivo.','https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600',current_date+30);
