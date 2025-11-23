# Supabase Realtime Setup Guide

## Problém
Pokud vidíte, že heartbeat se aktualizuje v databázi (vidíte logy v terminálu), ale realtime aktualizace nefunguje (nevidíte logy `Realtime UPDATE event` v konzoli prohlížeče), je potřeba povolit Realtime pro potřebné tabulky v Supabase Dashboard.

## Které tabulky zapnout pro Realtime?

Aplikace potřebuje Realtime pro následující tabulky:

### Povinné tabulky:
1. **`group_members`** 
   - Použití: Online/offline status, help requests, heartbeat aktualizace
   - Kde se používá: Monitor stránka (zobrazení online statusu studentů)

2. **`student_progress`**
   - Použití: Aktualizace pokroku studentů, průměrný pokrok skupin
   - Kde se používá: Dashboard (průměrný pokrok skupin), Monitor stránka (pokrok jednotlivých studentů)

### Volitelné tabulky:
- **`groups`** - pouze pokud chcete sledovat změny v nastavení skupin
- **`messages`** - pouze pokud chcete realtime zobrazování zpráv v chatu

## Jak povolit Realtime v Supabase

### 1. Otevřete Supabase Dashboard
1. Jděte na [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Přihlaste se a vyberte svůj projekt

### 2. Povolte Realtime pro potřebné tabulky
1. V levém menu klikněte na **Database**
2. Klikněte na **Replication** (nebo **Realtime** v některých verzích)
3. Zapněte Realtime pro následující tabulky:

#### Povinné tabulky:
- **`group_members`** - pro online/offline status, help requests a heartbeat aktualizace
- **`student_progress`** - pro realtime aktualizace pokroku studentů a průměrného pokroku skupin

#### Volitelné tabulky:
- **`groups`** - pokud chcete sledovat změny v nastavení skupin (obvykle není potřeba)
- **`messages`** - pokud chcete realtime zobrazování zpráv v chatu (obvykle není potřeba)

### 3. Alternativně přes SQL
Můžete také povolit Realtime přímo přes SQL editor:

```sql
-- Povolit Realtime pro group_members (povinné)
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;

-- Povolit Realtime pro student_progress (povinné)
ALTER PUBLICATION supabase_realtime ADD TABLE student_progress;
```

**Poznámka:** Pokud tabulka už je v publication, příkaz může vrátit chybu. V takovém případě je tabulka už povolená a můžete pokračovat.

### 4. Ověření
Po povolení Realtime:
1. Restartujte Nuxt dev server
2. Otevřete monitor stránku v prohlížeči
3. V konzoli byste měli vidět: `Successfully subscribed to realtime updates`
4. Když student pošle heartbeat, měli byste vidět: `Realtime UPDATE event for group_members:`

## Fallback mechanismus
Aplikace má vestavěný fallback mechanismus:
- Pokud Realtime nefunguje, aplikace automaticky načte data každých 30 sekund
- To zajistí, že online status se aktualizuje i bez Realtime
- V konzoli uvidíte: `Realtime not working, using fallback refresh`

## Troubleshooting

### Realtime subscription se nepřipojí
- Zkontrolujte, zda je Realtime povolené v Supabase Dashboard
- Zkontrolujte, zda máte správné `SUPABASE_URL` a `SUPABASE_ANON_KEY` v `.env`
- Zkontrolujte console logy pro status subscription (`SUBSCRIBED`, `CHANNEL_ERROR`, atd.)

### Realtime events nepřicházejí
- Zkontrolujte, zda se heartbeat skutečně aktualizuje v DB (logy v terminálu)
- Zkontrolujte, zda je tabulka `group_members` přidaná do `supabase_realtime` publication
- Zkontrolujte Row Level Security (RLS) policies - možná blokují realtime events

### RLS Policies
Pokud máte zapnuté RLS (Row Level Security), ujistěte se, že máte správné policies:
```sql
-- Příklad policy pro čtení group_members (pro realtime)
CREATE POLICY "Allow teachers to view group members"
ON group_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_members.group_id
    AND groups.teacher_id = auth.uid()
  )
);
```

## Poznámky
- Realtime funguje pouze přes WebSocket připojení
- Pokud je Realtime vypnuté, aplikace použije fallback refresh mechanismus
- Fallback refresh se spustí pouze pokud Realtime nefunguje (žádné events za 2 minuty)

