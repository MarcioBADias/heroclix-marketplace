![Screenshot do Heroclix Marketplace](image_3f3105.jpg)

# 🎲 Heroclix Marketplace

O **Heroclix Marketplace** é a sua plataforma definitiva para comprar e vender miniaturas de Heroclix. Conecte-se com outros colecionadores, encontre peças raras, e gerencie seus anúncios e vendas de forma eficiente.

## 🚀 Recursos Principais

* **Autenticação de Usuário:** Login e Cadastro com Supabase, incluindo upload de avatar e validação de dados (e-mail, nome de usuário, WhatsApp).
* **Listagem e Busca de Peças:** Navegação na página inicial com filtro por coleção, busca por nome/coleção, e exibição de cards de unidades com preços mínimo, médio e máximo de mercado.
* **Carrinho de Compras:** Adicione peças ao carrinho e finalize a compra por vendedor, gerando uma mensagem de checkout via WhatsApp para o vendedor.
* **Dashboard do Vendedor:**
    * **Meus Anúncios:** Gerencie, edite preço e quantidade, e exclua seus anúncios.
    * **Vendas Pendentes:** Visualize, aprove ou rejeite vendas pendentes, agrupadas por comprador, com validação de estoque.
    * **Histórico de Transações:** Acompanhe todas as compras e vendas processadas (aprovadas ou rejeitadas).
* **Notificações em Tempo Real:** Campainha de notificação (NotificationBell) que exibe novas compras pendentes e vendas aprovadas, utilizando o Supabase Realtime.
* **Gerenciamento de Preços de Mercado:** Triggers SQL atualizam automaticamente os valores de preço (mínimo, médio, máximo) na tabela `units` com base nos anúncios ativos (`listings`) e vendas aprovadas (`pending_sales`).

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando as seguintes tecnologias:

* **Frontend:** [React], [TypeScript], [Vite], [React Router DOM].
* **Estilização:** [Tailwind CSS], [shadcn-ui], [Class Variance Authority (cva)].
* **Backend & Banco de Dados:** [Supabase] (PostgreSQL, Auth, Realtime, Storage).

## 🗃️ Estrutura de Dados (Supabase)

As tabelas principais do banco de dados são:

| Tabela | Descrição |
| :--- | :--- |
| `profiles` | Armazena dados dos usuários (username, whatsapp, avatar_url) |
| `units` | Catálogo de peças de Heroclix (nome, coleção, nº da unidade, preços min/avg/max) |
| `listings` | Anúncios criados pelos vendedores (preço, quantidade, quantidade disponível) |
| `cart_items` | Itens temporários que os usuários adicionaram ao carrinho |
| `pending_sales` | Registros de compras pendentes de aprovação pelo vendedor (status: 'pending', 'approved', 'rejected') |

## ⚙️ Instalação e Configuração Local

Para rodar o projeto em sua máquina local:

1.  **Clone o repositório:**
    ```bash
    git clone <YOUR_GIT_URL>
    cd <YOUR_PROJECT_NAME>
    ```

2.  **Instale as dependências:**
    ```bash
    npm install # ou bun install
    ```

3.  **Configure o Supabase:**
    Certifique-se de ter um arquivo `.env` na raiz do projeto com as chaves do Supabase.
    ```
    VITE_SUPABASE_PROJECT_ID="irudppcivhjmxdvtosse"
    VITE_SUPABASE_PUBLISHABLE_KEY="..."
    VITE_SUPABASE_URL="[https://irudppcivhjmxdvtosse.supabase.co](https://irudppcivhjmxdvtosse.supabase.co)"
    ```

4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

O projeto será iniciado em `http://localhost:8080`.
