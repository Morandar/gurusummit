# Load Testing Guide - O2 Guru Summit 2025

Tento průvodce vysvětluje, jak otestovat aplikaci pod zátěží 200 současných uživatelů.

## 🎯 Cíle testování

- **200 současných uživatelů** po dobu 10+ minut
- **95% požadavků** rychleji než 2 sekundy
- **Chybovost** menší než 5%
- **Databázový výkon** pod vysokou zátěží

## 📋 Předpoklady

1. **Node.js** 18+ nainstalovaný
2. **k6** load testing tool nainstalovaný
3. **Databázové tabulky** vytvořené (spusťte `database_migration.sql`)
4. **Ukázková data** připravená v databázi

## 🚀 Instalace k6

### macOS (Homebrew)
```bash
brew install k6
```

### Windows (Chocolatey)
```bash
choco install k6
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install k6
```

### Nebo globálně přes npm
```bash
npm install -g k6
```

## ⚙️ Nastavení prostředí

1. **Zkopírujte environment soubor:**
```bash
cp .env.local .env.test
```

2. **Nastavte Supabase klíče v `.env.test`:**
```env
VITE_SUPABASE_URL=https://jclbonbkpthbckjctyre.supabase.co
VITE_SUPABASE_ANON_KEY=váš-anon-key-zde
SUPABASE_SERVICE_ROLE_KEY=váš-service-role-key-zde
```

## 🏃 Spuštění load testu

### Základní test (200 uživatelů)
```bash
npm run loadtest
```

### CI/CD test s výsledky
```bash
npm run loadtest:ci
```

### Vlastní konfigurace
```bash
# Přímé spuštění s k6
k6 run load_test_api.js

# S vlastními proměnnými
k6 run -e SUPABASE_ANON_KEY=your-key-here load_test_api.js
```

## 📊 Test scénáře

Load test simuluje **200 současných uživatelů** s následujícím chováním:

### Fáze testu:
1. **1 min**: Zahřívání (20 uživatelů)
2. **2 min**: Nárůst na 50 uživatelů
3. **3 min**: Nárůst na 100 uživatelů
4. **5 min**: Nárůst na 150 uživatelů
5. **5 min**: Vrchol (200 uživatelů)
6. **3 min**: Udržení vrcholu
7. **2 min**: Ochlazení (0 uživatelů)

### Uživatelské scénáře (40% / 30% / 30%):

#### 📖 **Čtení dat (40%)**
- Načítání stánků
- Načítání programu
- Načítání bannerů
- Načítání notifikací

#### 🔐 **Autentifikace (30%)**
- Registrace nových uživatelů
- Přihlašování existujících uživatelů

#### ✍️ **Zápis dat (30%)**
- Návštěvy stánků
- Aktualizace pokroku uživatelů

## 📈 Metriky sledování

### Klíčové ukazatele:
- **Response Time**: p95 < 2000ms
- **Error Rate**: < 5%
- **Requests/Second**: Stabilní pod zátěží
- **Database Connections**: < limit Supabase

### Supabase monitoring:
- **Database CPU**: < 80%
- **Memory Usage**: < 85%
- **Active Connections**: < 100
- **Query Latency**: < 500ms

## 🔍 Analýza výsledků

### Úspěšné testy:
```
✓ http_req_duration..............: avg=450ms    min=120ms    med=380ms    max=1.8s    p(95)=890ms
✓ http_req_failed................: 2.1%        210 out of 10000 requests
✓ errors........................: 0.02%       2 out of 10000 requests
```

### Problémové testy:
```
✗ http_req_duration..............: avg=2.1s     p(95)=4.5s
✗ http_req_failed................: 8.7%
```

## 🛠️ Troubleshooting

### Běžné problémy:

#### 1. **401 Unauthorized**
```json
{
  "code": "PGRST301",
  "message": "JWT expired"
}
```
**Řešení**: Zkontrolujte Supabase klíče v `.env.test`

#### 2. **429 Too Many Requests**
```
HTTP 429: Too Many Requests
```
**Řešení**: Supabase rate limiting - počkejte nebo upgradujte plán

#### 3. **Timeout chyby**
```
Request timeout after 30s
```
**Řešení**: Zkontrolujte síťové připojení nebo snižte zátěž

#### 4. **Database connection limit**
```
FATAL: remaining connection slots are reserved for non-replication superuser connections
```
**Řešení**: Supabase connection pooling problém - kontaktujte podporu

## 📋 Checklist před testováním

- [ ] Databázové tabulky vytvořené
- [ ] Supabase klíče nastavené
- [ ] k6 nainstalovaný (`k6 version`)
- [ ] Síťové připojení stabilní
- [ ] Supabase projekt v produkčním plánu (pro 200 uživatelů)

## 🎯 Optimalizace výkonu

### Frontend optimalizace:
- **Code splitting** pro menší bundle
- **Lazy loading** komponent
- **Caching** API odpovědí
- **CDN** pro statické soubory

### Backend optimalizace:
- **Database indexes** na často používané sloupce
- **Connection pooling** v Supabase
- **Query optimization** s EXPLAIN ANALYZE
- **Caching** častých dotazů

### Infrastruktura:
- **Supabase Pro plan** pro vyšší limity
- **CDN** (Vercel) pro globální distribuci
- **Monitoring** s DataDog nebo podobným

## 📞 Kontakt

Při problémech s load testing kontaktujte:
- **Supabase support** pro databázové problémy
- **Vercel support** pro hosting problémy
- **k6 community** pro testovací skripty

---

**Happy testing! 🚀**