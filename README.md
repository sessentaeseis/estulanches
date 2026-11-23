# EstuLanches

Sistema web para cardápio e pedidos da cantina escolar. A aplicação usa React no cliente, Express na API e PostgreSQL com Prisma.

## Ambiente local

Requisitos: Node.js 22 ou superior, npm e Docker com Compose.

1. Copie `.env.example` para `.env` e defina senhas e segredos fortes.
2. Suba a aplicação com `docker compose up --build -d`.
3. Consulte os serviços com `docker compose ps`.
4. Consulte a inicialização com `docker compose logs -f database api frontend`.
5. Abra `http://localhost:8080` (ou a porta configurada em `APP_PORT`).

O primeiro administrador é criado a partir de `ADMIN_EMAIL` e `ADMIN_PASSWORD` no arquivo `.env`. A API executa as migrações antes de iniciar.

## Desenvolvimento

Para rodar o backend fora do container, mantenha o PostgreSQL iniciado com `docker compose up -d database`. A porta local `5432` é encaminhada ao banco do Compose. Na pasta `backend`, configure `POSTGRES_PASSWORD` e `JWT_SECRET` em `.env` e execute `npm run dev`; a conexão local usa o banco `estulanches` e o usuário `estulanches`. Se preferir, configure `DATABASE_URL` diretamente. Na pasta `frontend`, execute `npm install` e `npm run dev`.

O backend usa os scripts `npm test`, `npm run test:unit` e `npm run test:integration`. O health check da API está em `/api/health`.

## Funcionalidades

- Consulta de produtos disponíveis no cardápio.
- Criação de pedidos com total calculado no servidor.
- Acesso administrativo com senha armazenada por bcrypt e token JWT.
- Cadastro e atualização de disponibilidade/preço dos produtos.
- Consulta de pedidos e atualização de status.
- Persistência PostgreSQL com volume Docker.
