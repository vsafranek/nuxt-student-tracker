# Azure OpenAI Setup Guide

Tento návod vám pomůže nastavit Azure OpenAI pro chatbot v aplikaci.

## Jak získat Azure OpenAI přihlašovací údaje

### 1. Vytvoření Azure OpenAI Resource

1. Přejděte na [Azure Portal](https://portal.azure.com/)
2. Klikněte na **"Create a resource"** (Vytvořit prostředek)
3. Vyhledejte **"Azure OpenAI"**
4. Klikněte na **"Create"** (Vytvořit)
5. Vyplňte formulář:
   - **Subscription**: Vyberte vaše předplatné
   - **Resource group**: Vytvořte novou nebo vyberte existující
   - **Region**: Vyberte oblast (např. East US, West Europe)
   - **Name**: Zadejte název vašeho zdroje (např. `my-student-tracker-openai`)
   - **Pricing tier**: Vyberte tier (Standard S0 je vhodný pro začátek)
6. Klikněte na **"Review + create"** a poté **"Create"**

### 2. Nasazení modelu GPT-4o

1. Po vytvoření zdroje přejděte na jeho stránku
2. V levém menu najděte **"Model deployments"** (Nasazení modelů)
3. Klikněte na **"Create"** nebo **"Manage deployments"**
4. Klikněte na **"Create new deployment"**
5. Vyberte:
   - **Model**: `gpt-4o` nebo `gpt-4o-mini`
   - **Deployment name**: `models-gpt-4o` (nebo jiný název - použijte stejný v .env)
6. Klikněte na **"Create"**

### 3. Získání API klíče a endpoint URL

1. V Azure Portal přejděte na váš Azure OpenAI resource
2. V levém menu klikněte na **"Keys and Endpoint"** (Klíče a koncový bod)
3. Zkopírujte:
   - **Endpoint**: Vypadá jako `https://your-resource-name.openai.azure.com/`
   - **Key 1** nebo **Key 2**: API klíč (můžete použít kterýkoliv)

### 4. Nastavení v aplikaci

Vytvořte nebo upravte `.env` soubor v kořenovém adresáři projektu:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_API_BASE=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=models-gpt-4o
```

**Důležité:**
- `AZURE_OPENAI_API_BASE` musí končit lomítkem `/`
- `AZURE_OPENAI_DEPLOYMENT` musí přesně odpovídat názvu nasazení, které jste vytvořili
- `AZURE_OPENAI_API_VERSION` můžete změnit na nejnovější podporovanou verzi (aktuálně `2024-02-15-preview`)

### 5. Otestování

1. Restartujte vývojový server (`npm run dev`)
2. Otevřete stránku studenta s chatbotem
3. Zkuste poslat zprávu do chatu

## Řešení problémů

### Chyba: "Azure OpenAI is not configured"

- Zkontrolujte, že máte `.env` soubor v kořenovém adresáři projektu
- Ověřte, že všechny proměnné začínají `AZURE_OPENAI_` jsou nastavené
- Restartujte vývojový server po změně `.env` souboru
- Ujistěte se, že hodnoty nemají uvozovky nebo mezery

### Chyba: "404 Not Found" nebo "Deployment not found"

- Zkontrolujte, že `AZURE_OPENAI_DEPLOYMENT` přesně odpovídá názvu nasazení v Azure Portal
- Ověřte, že je model skutečně nasazený v Azure Portal

### Chyba: "401 Unauthorized"

- Zkontrolujte, že `AZURE_OPENAI_API_KEY` je správný
- Zkuste použít druhý klíč (Key 2) místo Key 1

## Účtování a náklady

Azure OpenAI se účtuje podle:
- Počtu tokenů (input + output)
- Modelu (GPT-4o je dražší než GPT-4o-mini)
- Regionu

Pro vývoj můžete použít **GPT-4o-mini**, který je výrazně levnější.

## Alternativní nastavení

Pokud chcete použít jiný model, upravte:

```env
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
```

A ujistěte se, že máte odpovídající nasazení v Azure Portal.

