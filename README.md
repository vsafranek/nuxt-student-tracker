# 📚 EduGuide

<div align="center">

**Inteligentní platforma s AI asistentem pro efektivní výuku a sledování pokroku studentů v reálném čase**

[![Nuxt](https://img.shields.io/badge/Nuxt-4.2.1-00DC82?style=flat-square&logo=nuxt.js)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3.5.24-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-2.84.0-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Vitest](https://img.shields.io/badge/Vitest-3.2.4-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev)

</div>

---

## 🎯 O aplikaci

EduGuide je moderní vzdělávací platforma, která kombinuje sílu AI asistenta s real-time sledováním pokroku studentů. Umožňuje učitelům efektivně monitorovat práci studentů, zatímco studenti získávají okamžitou pomoc od inteligentního AI asistenta.

### Proč EduGuide?

- 🤖 **AI asistent 24/7** - Studenti dostávají okamžitou pomoc kdykoliv potřebují
- 📊 **Realtime sledování** - Učitelé vidí pokrok studentů v reálném čase
- 🎯 **Inteligentní cíle** - Automatické sledování plnění vzdělávacích cílů
- 📱 **Jednoduchý vstup** - QR kód pro okamžité připojení studentů
- 🔔 **Okamžité notifikace** - Upozornění, když student potřebuje pomoc
- 📈 **Vizuální statistiky** - Přehledné grafy a dashboardy

---

## ✨ Klíčové funkce

### Pro učitele

- 📋 **Správa skupin** - Vytváření a správa studijních skupin
- 🎯 **Nastavení cílů** - Definování vzdělávacích cílů (boolean/percentage)
- 📊 **Dashboard** - Přehledný dashboard s real-time statistikami
- 👥 **Monitorování studentů** - Detailní přehled práce každého studenta
- 🔔 **Notifikace** - Okamžité upozornění, když student potřebuje pomoc
- 📈 **Statistiky pokroku** - Grafy a analýzy pokroku studentů
- 🎨 **Flexibilní režimy** - Uniformní nebo variantní zadání úkolů

### Pro studenty

- 🤖 **AI asistent** - Inteligentní chatbot s GPT-4 pro pomoc s úkoly
- 📱 **QR kód vstup** - Snadné připojení ke skupině bez registrace
- 📊 **Vizualizace pokroku** - Real-time zobrazení vlastního pokroku
- 💬 **Chat s AI** - Přirozená konverzace s AI asistentem
- ✅ **Sledování cílů** - Přehled plnění vzdělávacích cílů
- 🎯 **Relevantní zprávy** - Automatické rozpoznání relevantních odpovědí
- 🔔 **Pomoc na vyžádání** - Možnost požádat o pomoc učitele

---

## 🛠️ Technologie

### Frontend
- **Nuxt 4** - Vue.js framework s SSR
- **Vue 3** - Progresivní JavaScript framework
- **TypeScript** - Typovaný JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Marked** - Markdown parser
- **KaTeX** - Matematické vzorce
- **Prism.js** - Syntax highlighting

### Backend
- **Nuxt Server** - Server-side rendering a API routes
- **Supabase** - Backend-as-a-Service (autentizace, real-time)
- **PostgreSQL** - Relační databáze
- **Drizzle ORM** - Type-safe ORM
- **OpenAI GPT-4** - AI asistent (podporuje i Azure OpenAI)

### Nástroje
- **Vitest** - Unit a integration testy
- **Drizzle Kit** - Database migrations
- **ESLint** - Linting
- **TypeScript** - Type checking

---

## 📋 Požadavky

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 nebo **pnpm** >= 8.0.0
- **PostgreSQL** >= 14.0 (nebo Supabase cloud)
- **Supabase účet** (pro autentizaci a real-time)
- **OpenAI API klíč** (nebo Azure OpenAI)

---

## 🚀 Instalace

### 1. Klonování repozitáře

```bash
git clone https://github.com/your-username/eduguide.git
cd eduguide
```

### 2. Instalace závislostí

```bash
npm install
# nebo
pnpm install
```

### 3. Konfigurace prostředí

Vytvořte soubor `.env` v kořenovém adresáři:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/eduguide

# OpenAI (nebo Azure OpenAI)
OPENAI_API_KEY=your_openai_api_key

# Azure OpenAI (volitelné, pokud používáte Azure místo OpenAI)
AZURE_OPENAI_API_BASE=your_azure_openai_endpoint
AZURE_OPENAI_API_KEY=your_azure_api_key
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=models-gpt-4o
```

### 4. Nastavení databáze

```bash
# Push schématu do databáze
npm run db:push

# Nebo generujte migrace
npm run db:generate
```

### 5. Spuštění vývojového serveru

```bash
npm run dev
```

Aplikace bude dostupná na `http://localhost:3000`

---

## 📖 Použití

### Pro učitele

1. **Registrace/Přihlášení**
   - Klikněte na "Začít jako učitel"
   - Přihlaste se pomocí Google OAuth nebo emailu

2. **Vytvoření skupiny**
   - V dashboardu klikněte na "Vytvořit skupinu"
   - Zadejte název a popis skupiny
   - Nastavte režim zadání (uniformní/variantní)

3. **Nastavení cílů**
   - Vytvořte vzdělávací cíle (boolean nebo percentage)
   - Nebo použijte AI generování cílů

4. **Sdílení QR kódu**
   - Zkopírujte nebo vytiskněte QR kód
   - Sdílejte ho se studenty

5. **Monitorování**
   - Sledujte pokrok studentů v real-time
   - Reagujte na žádosti o pomoc
   - Analyzujte statistiky

### Pro studenty

1. **Připojení ke skupině**
   - Naskenujte QR kód od učitele
   - Zadejte své jméno

2. **Práce s AI asistentem**
   - Začněte konverzaci s AI asistentem
   - Ptejte se na úkoly a cíle
   - Získejte okamžitou pomoc

3. **Sledování pokroku**
   - Sledujte své cíle v reálném čase
   - Vidíte, jak se vám daří plnit úkoly

4. **Žádost o pomoc**
   - Pokud potřebujete pomoc učitele, požádejte o ni
   - Učitel dostane notifikaci

---

## 🏗️ Struktura projektu

```
eduguide/
├── assets/              # Statické assety (CSS, obrázky)
│   └── css/
│       └── main.css
├── components/          # Vue komponenty
│   ├── ChatBot.vue      # AI chat komponenta
│   ├── GoalsDisplay.vue # Zobrazení cílů
│   ├── MessageContent.vue
│   ├── SettingsModal.vue
│   ├── StudentDetail.vue
│   └── ToastContainer.vue
├── composables/         # Vue composables
│   ├── useAuth.ts       # Autentizace
│   ├── useChat.ts       # Chat logika
│   ├── useDatabase.ts   # Databázové operace
│   ├── useSupabase.ts   # Supabase klient
│   └── useToast.ts      # Toast notifikace
├── layouts/             # Layout komponenty
│   └── defaults.vue
├── middleware/          # Route middleware
│   ├── auth.js         # Autentizace middleware
│   └── guest.ts        # Guest middleware
├── pages/               # Stránky (routing)
│   ├── auth/           # Autentizační stránky
│   ├── index.vue       # Domovská stránka
│   ├── join/           # Připojení ke skupině
│   ├── student/         # Student rozhraní
│   └── teacher/         # Učitel rozhraní
├── server/              # Server-side kód
│   ├── api/            # API endpoints
│   │   ├── chat/       # Chat API
│   │   ├── groups/     # Skupiny API
│   │   ├── messages/   # Zprávy API
│   │   ├── progress/   # Pokrok API
│   │   └── settings/   # Nastavení API
│   ├── database/       # Databázové schéma
│   └── utils/          # Utility funkce
├── tests/               # Testy
│   ├── integration/    # Integration testy
│   └── unit/           # Unit testy
├── drizzle/             # Database migrace
├── public/              # Veřejné soubory
├── nuxt.config.ts       # Nuxt konfigurace
├── package.json         # NPM závislosti
└── README.md            # Tento soubor
```

---

## 🧪 Testování

### Spuštění testů

```bash
# Všechny testy
npm test

# Unit testy
npm run test:unit

# Integration testy
npm run test:integration

# S pokrytím kódu
npm run test:coverage

# UI režim (interaktivní)
npm run test:ui
```

### Pokrytí kódu

Po spuštění `npm run test:coverage` se vygeneruje report v `coverage/` adresáři.

---

## 🗄️ Databáze

### Migrace

```bash
# Generování migrace ze změn v schema.ts
npm run db:generate

# Push změn přímo do databáze (vývoj)
npm run db:push

# Otevření Drizzle Studio (GUI pro databázi)
npm run db:studio
```

### Schéma databáze

Hlavní tabulky:
- `users` - Uživatelé (učitelé a studenti)
- `groups` - Studijní skupiny
- `goals` - Vzdělávací cíle
- `messages` - Zprávy mezi studenty a AI
- `student_progress` - Pokrok studentů
- `group_members` - Členství ve skupinách

---

## 🔧 Konfigurace

### Nuxt konfigurace

Hlavní konfigurace je v `nuxt.config.ts`:

- **Supabase modul** - Autentizace a real-time
- **Tailwind CSS** - Styling
- **Runtime config** - Environment proměnné
- **WebSocket** - Real-time komunikace

### Environment proměnné

Viz sekce [Instalace](#-instalace) pro kompletní seznam proměnných.

---

## 🚢 Deployment

### Build pro produkci

```bash
npm run build
```

### Preview produkční build

```bash
npm run preview
```

### Generování statického webu

```bash
npm run generate
```

### Doporučené platformy

- **Vercel** - Doporučeno pro Nuxt aplikace
- **Netlify** - Jednoduchý deployment
- **Railway** - S podporou PostgreSQL
- **DigitalOcean App Platform**
- **AWS/GCP** - S vlastní konfigurací

### Environment proměnné v produkci

Ujistěte se, že jsou nastaveny všechny potřebné environment proměnné na hosting platformě.

---

## 📚 API Dokumentace

### Hlavní endpoints

#### Skupiny
- `GET /api/groups` - Seznam skupin
- `POST /api/groups/create` - Vytvoření skupiny
- `GET /api/groups/[id]/info` - Informace o skupině
- `GET /api/groups/[id]/stats` - Statistiky skupiny
- `POST /api/groups/join` - Připojení ke skupině

#### Cíle
- `GET /api/groups/[id]/goals` - Seznam cílů
- `POST /api/groups/[id]/goals` - Vytvoření cíle
- `POST /api/groups/generate-goals` - AI generování cílů

#### Chat
- `POST /api/chat` - Odeslání zprávy AI asistentovi
- `POST /api/chat/analyze` - Analýza relevance zprávy
- `POST /api/chat/generate-assignment` - Generování zadání

#### Pokrok
- `POST /api/progress/update` - Aktualizace pokroku
- `GET /api/groups/[id]/goals-with-progress` - Cíle s pokrokem

#### Zprávy
- `GET /api/messages/history` - Historie zpráv
- `POST /api/messages/save` - Uložení zprávy

---

## 🤝 Contributing

Příspěvky jsou vítány! Pro větší změny prosím:

1. Forkněte projekt
2. Vytvořte feature branch (`git checkout -b feature/AmazingFeature`)
3. Commitněte změny (`git commit -m 'Add some AmazingFeature'`)
4. Pushněte do branch (`git push origin feature/AmazingFeature`)
5. Otevřete Pull Request

### Coding standards

- Používejte TypeScript pro všechny nové soubory
- Dodržujte ESLint pravidla
- Pište testy pro nové funkce
- Používejte konvenční commit messages


<div align="center">


[⬆ Zpět nahoru](#-eduguide)

</div>

