#  ImobSim Pro

> **Plataforma Web e Mobile para corretores de imóveis e correspondentes bancários.**  
> Realize simulações precisas de financiamento habitacional (SAC e PRICE), compare as condições dos principais bancos brasileiros em tempo real, gerencie imóveis e leads, e gere propostas comerciais prontas para impressão ou envio direto via WhatsApp.

---

##  Funcionalidades Principais

### 🧮 Simulador Financeiro Completo
- **Sistemas de Amortização:** Alternância instantânea entre **SAC** (parcelas decrescentes) e **PRICE** (parcelas fixas).
- **Seguros Obrigatórios:** Cálculo automático do seguro **MIP** (Morte e Invalidez Permanente) com alíquotas escalonadas pela idade do proponente, e seguro **DFI** (Danos Físicos ao Imóvel) sobre o valor de avaliação.
- **Entrada & FGTS:** Cálculo do percentual de entrada em tempo real, abatimento com saldo de FGTS e atalhos rápidos (`20%`, `30%`, `40%`, `50%`).
- **Análise de Risco e Renda:** Alerta visual de comprometimento de renda (limite prudencial de 30%) e cálculo da renda familiar mínima recomendada.
- **Gráfico de Evolução:** Visualização interativa da amortização, juros e saldo devedor ao longo do prazo contratado.

### 🏦 Comparador de Bancos Brasileiros
Comparação automática e simultânea entre as principais instituições financeiras com taxas vigentes e regras de elegibilidade:
- **Caixa Econômica Federal (MCMV):** Linha habitacional Faixa 3 com teto por município.
- **Caixa Econômica Federal (SBPE):** Regras operacionais atualizadas com limite de financiamento de até **70% no SAC** (mínimo de 30% de entrada) e até **50% na Tabela Price** (mínimo de 50% de entrada) para imóveis até R$ 1,5 milhão.
- **Banco do Brasil:** Condições balcão com bonificação por relacionamento.
- **Banco Santander:** Opções sem tarifa mensal de administração e composição de renda.
- **Itaú Unibanco:** Isenção de taxa de administração e esteira digital.
- **Banco Bradesco:** Linhas tradicionais com avaliação ágil.
- **Custo Efetivo Total (CET):** Estimativa anualizada considerando juros nominais, seguros e tarifas administrativas.

### 📜 Custos Notariais e de Documentação
- Estimativa detalhada de despesas iniciais: **ITBI**, **Emolumentos de Registro de Imóveis** e **Tarifa Bancária de Avaliação**.
- Opção para aplicar automaticamente o benefício de **50% de desconto no registro e escritura** para aquisição do primeiro imóvel (Art. 290 da Lei nº 6.015/73).

### 🏢 Catálogo de Imóveis
- Cadastro detalhado de carteira de imóveis (fotos, código, valores de venda, condomínio e IPTU, metragem, dormitórios e vagas).
- Ação rápida para carregar dados do imóvel diretamente no simulador com um clique.

### 👥 Mini CRM de Leads
- Gestão do funil de clientes (Novo, Qualificado, Em Simulação, Análise de Crédito, Proposta Enviada, Ganho, Perdido).
- Registro de renda familiar, capacidade de entrada, valor de FGTS e imóvel de interesse.

### 📄 Propostas Comerciais & WhatsApp
- **Geração de Proposta em PDF:** Layout limpo e pronto para impressão com cabeçalho personalizado da imobiliária/corretor.
- **Disparo via WhatsApp:** Formatação automática com resumo dos valores (primeira parcela, taxa de juros, custos de entrada e documentação) com link direto para o WhatsApp do cliente.
- **Personalização de Branding:** Configuração de nome, CRECI, logotipo/foto, telefone, e-mail e dados da imobiliária.

---

##  Tecnologias Utilizadas

- **Frontend:** [React 19](https://react.dev/) com [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite 8](https://vitejs.dev/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Componentes & Ícones:** [Lucide React](https://lucide.dev/)
- **Animações:** [Motion](https://motion.dev/)
- **Persistência de Dados:** Web Storage API (`localStorage`) com carregamento automático de dados de demonstração (seed).

---

##  Estrutura do Projeto

```
ImobSim/
├── public/                 # Arquivos estáticos
├── src/
│   ├── components/         # Componentes modulares da interface
│   │   ├── SimulatorView.tsx      # Simulador principal e comparativo de bancos
│   │   ├── AmortizationChart.tsx  # Gráfico da curva de amortização
│   │   ├── PropertiesView.tsx     # Gestão da carteira de imóveis
│   │   ├── LeadsView.tsx          # Gestão do funil de leads/clientes
│   │   ├── HistoryView.tsx        # Histórico de simulações salvas
│   │   ├── ProposalModal.tsx      # Modal de envio e visualização da proposta
│   │   ├── PrintableProposal.tsx  # Template de impressão / exportação PDF
│   │   └── BrokerProfileModal.tsx # Edição de dados do corretor e CRECI
│   ├── data/
│   │   └── banks.ts               # Parâmetros e taxas dos bancos parceiros
│   ├── utils/
│   │   ├── finance.ts             # Cálculos matemáticos (SAC, PRICE, MIP, DFI, CET)
│   │   └── storage.ts             # Gerenciamento de persistência local
│   ├── types.ts                   # Interfaces e definições de tipos TypeScript
│   ├── App.tsx                    # Componente raiz e navegação por abas
│   ├── main.tsx                   # Ponto de entrada da aplicação
│   └── index.css                  # Estilos globais e tokens Tailwind
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🏁 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada)
- `npm` ou gerenciador de pacotes equivalente (`pnpm`, `yarn`)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/karla08C/ImobSim.git
   cd ImobSim
   ```

2. **Acesse a branch de desenvolvimento:**
   ```bash
   git checkout develop
   ```

3. **Instale as dependências:**
   ```bash
   npm install
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Acesse no navegador:**
   - Local: `http://localhost:3000/`

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento Vite na porta 3000 |
| `npm run build` | Compila o projeto em arquivos estáticos otimizados para produção em `/dist` |
| `npm run preview` | Executa o servidor local de visualização da build de produção |
| `npm run lint` | Executa a verificação estática de tipos com o compilador TypeScript (`tsc --noEmit`) |

---

## ⚖️ Licença

Este projeto é desenvolvido para fins profissionais e educacionais no mercado imobiliário brasileiro. Consulte os termos de uso no repositório.
