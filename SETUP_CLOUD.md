# VITA — Cloud-ის ჩართვა (Supabase + Sentry), მფლობელის 30-წუთიანი გზამკვლევი

კოდი უკვე მზადაა (v140): სანამ env ცარიელია, აპი ზუსტად ისე მუშაობს, როგორც აქამდე (ლოკალური/demo რეჟიმი). ქვემოთ მოცემული ნაბიჯების შემდეგ ჩაირთვება რეალური ანგარიშები და მოწყობილობებს შორის სინქრონიზაცია.

## 1. Supabase (≈15 წთ)
1. https://supabase.com → New project → **Region: EU (Frankfurt)** → ძლიერი DB პაროლი (შეინახე — აპს არ სჭირდება).
2. **SQL Editor** → New query → ჩასვი `supabase/schema.sql`-ის შიგთავსი → Run. (ქმნის profiles / state_snapshots / consults / ehr_records / access_log / orders ცხრილებს RLS-ით და realtime-ს.)
3. **Authentication → Providers**:
   - **Email**: ჩართე; „Confirm email" → OFF არ არის საჭირო — OTP-ისთვის საკმარისია default; **Email OTP length 6**, expiry 600 წმ. Templates → „Magic Link" შაბლონში დარწმუნდი, რომ არის `{{ .Token }}` (კოდი), მაგ.: `შენი VITA-კოდი: {{ .Token }}`.
   - **Google**: Google Cloud Console → OAuth client (Web) → Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` → Client ID/Secret ჩასვი Supabase-ში.
   - **Apple** (სთორისთვის მოგვიანებით შეიძლება): Apple Developer → Services ID + key → Supabase-ში.
4. **Authentication → URL Configuration**: Site URL = `https://vita-health-ai.onrender.com`; Redirect URLs: `https://vita-health-ai.onrender.com/app.html`, `http://localhost:4170/app.html`.
5. **Project Settings → API**: დააკოპირე **Project URL** და **anon public** key (service_role key **არასდროს** გამოიყენო აპში).

## 2. Sentry (≈5 წთ, არასავალდებულო)
1. https://sentry.io → New project → Platform: **JavaScript (Browser)** → DSN.
2. (სურვილისამებრ) მეორე პროექტი **Python** backend-ისთვის → DSN; Render-ზე `pip install sentry-sdk` — `requirements.txt`-ში დაამატე `sentry-sdk`.

## 3. Render → Environment (≈5 წთ)
Service `vita-health-ai` → Environment → Add:
```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon public key>
SENTRY_DSN=<browser dsn>            # ცარიელი = გამორთული
SENTRY_DSN_BACKEND=<python dsn>     # ცარიელი = გამორთული
```
Save → Render გადატვირთავს სერვისს. `serve.py` ამ მნიშვნელობებიდან აგენერირებს `/js/config.js`-ს (public მნიშვნელობებია, არ იქეშება).

## 4. შემოწმება (≈5 წთ)
- `https://vita-health-ai.onrender.com/js/config.js` → უნდა ჩანდეს შენი supabaseUrl.
- აპი → Splash → „დაწყება" → ელფოსტა → კოდი მოდის → შესვლა → Me-ში „სინქრონიზებულია · შენი ელფოსტა".
- მეორე მოწყობილობაზე იმავე ელფოსტით შესვლა → იგივე მონაცემები; ერთზე წყალი დაამატე → მეორეზე რამდენიმე წამში ჩანს.
- Supabase → Table editor → `state_snapshots` → შენი row (JSON), `profiles` → შენი row.
- Sentry → პროექტში ჩანს „vita@140" release (თუ DSN დააყენე).

## ლოკალურად ტესტი Supabase-ის გარეშე
ბრაუზერის კონსოლში: `localStorage.setItem("vita.mockCloud","1"); location.reload()` — მერე `eval(await (await fetch("/tools/supabase_mock.js")).text()); await VITA.cloud.init(); VITA.render()`. OTP-კოდი ყოველთვის `123456`. (QA-აგენტი ამას ავტომატურად აკეთებს.)

## რა ხდება მონაცემებთან
- ანგარიშის გარეშე: მხოლოდ მოწყობილობაზე (localStorage), როგორც აქამდე.
- ანგარიშით: ყოველი შენახვის შემდეგ 1.5 წმ-ში მთელი `V.state` (ფოტოების გარეშე) იწერება შენს row-ში; შესვლისას და სხვა მოწყობილობის ჩანაწერისას (realtime) უახლესი იგება (`saved_at` last-write-wins). Row Level Security: მხოლოდ შენი ანგარიში კითხულობს/წერს შენს row-ს.
- Privacy/Terms: `privacy.html`, `terms.html` (DRAFT — იურისტთან გადასამოწმებელი გამოშვებამდე).
