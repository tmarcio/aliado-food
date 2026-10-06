# Aliado Food — Web app de encomendas
Site estático (HTML/CSS/JS) + Supabase. Funciona directamente no GitHub Pages, sem build.

## Instalação
1. **Supabase:** crie um projecto em supabase.com. Em *SQL Editor*, cole e execute `supabase/schema.sql`.
2. **Chaves:** em *Project Settings > API* copie a *Project URL* e a chave *anon public* para `js/config.js`.
3. **Admin:** em *Authentication > Users* crie o utilizador da equipa (email + palavra-passe). Depois, no SQL Editor:
   `insert into admins select id from auth.users where email='EMAIL_DO_ADMIN';`
4. **GitHub:** crie um repositório, envie estes ficheiros e active *Settings > Pages > Deploy from branch (main, /root)*.
5. **Email "Trabalhe connosco":** as candidaturas ficam na tabela `applications` e são enviadas por FormSubmit para aliadofood@hotmail.com. Na primeira candidatura o FormSubmit envia um email de activação — clique para confirmar.

## Painel `/admin.html`
Pedidos (estado, atribuir estafeta, enviar por WhatsApp ao estafeta), Produtos, Taxas de entrega, Estafetas, Parceiros e Actividades (com upload de imagens).

## Notas
- As taxas por Município no SQL são **estimativas** baseadas em corridas de moto tipo Yango a partir de Luanda: confirme e ajuste em *Admin > Taxas de entrega*.
- O preço e a taxa de cada pedido são calculados no servidor (função `create_order`), por isso o cliente não os consegue alterar.
- As imagens iniciais (Unsplash/placeholders) são substituíveis no admin.
