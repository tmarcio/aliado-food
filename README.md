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

## Loja, pagamento e continuidade
- **Painel > Loja e pagamentos:** pausar pedidos, horário (Luanda), pedido mínimo, tempo estimado, formas de pagamento e dados de transferência/Express, notificações do navegador e cópia de segurança.
- **Avisos de pedidos:** cada pedido é enviado por email (FormSubmit) e, com o painel aberto, gera aviso sonoro e notificação. Um aviso automático por WhatsApp exige um serviço pago (API do WhatsApp Business).
- **Protecção:** limite de 3 pedidos por telemóvel e 60 no total a cada 10 minutos, validação no servidor, campo-armadilha e intervalo mínimo entre pedidos. Reduz abusos, mas não substitui um captcha.
- **Manter o Supabase activo:** em GitHub > Settings > Secrets and variables > Actions crie `SUPABASE_URL` e `SUPABASE_KEY` (a chave pública do config.js). O ficheiro `.github/workflows/keepalive.yml` faz um pedido a cada 3 dias. O GitHub desactiva tarefas agendadas após 60 dias sem alterações ao repositório.
- **Cópias de segurança:** botão no painel (Loja e pagamentos) e exportação CSV em Pedidos. Para cópias automáticas, o Supabase oferece-as nos planos pagos.

## Versão instalável (PWA)
Ficheiros: `manifest.webmanifest`, `admin.webmanifest`, `sw.js`, `offline.html` e `assets/icons/`. Precisa de HTTPS (o GitHub Pages já o tem). O site (`/`) e o painel (`/admin.html`) instalam-se como duas apps separadas. O service worker usa "rede primeiro": com internet mostra sempre a versão mais recente; sem internet mostra uma página de aviso.
