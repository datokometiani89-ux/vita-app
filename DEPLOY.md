# VITA — Deploy / გაშვება ონლაინ

`serve.py` ერთ სერვისად ემსახურება **საიტს + აპს + AI proxy-ს**, ამიტომ ერთი
deploy საკმარისია — ყველაფერი ერთ URL-ზე იმუშავებს (`/index.html`, `/app.html`, `/api/*`).

> ერთ-ერთი AI გასაღები რომ დააყენო — ჩატი და ანალიზების ინტერპრეტაცია ცოცხალი იქნება.
> გასაღების გარეშეც გაეშვება, უბრალოდ ასისტენტი offline რეჟიმში იმუშავებს.
> **უფასო გასაღები:** https://aistudio.google.com → "Get API key" (ბარათი არ სჭირდება).

---

## 0) ჯერ GitHub-ზე ატვირთვა (ერთხელ)

```bash
cd "VITA AI APP"
git init
git add -A
git commit -m "VITA Health AI"
# შექმენი ცარიელი repo GitHub-ზე, შემდეგ:
git remote add origin https://github.com/<you>/vita.git
git branch -M main
git push -u origin main
```

---

## 1) Render.com  ⭐ (რეკომენდებული — უფასო, ერთ სერვისად)

1. შედი **render.com** → **New** → **Blueprint** → აირჩიე შენი GitHub repo.
2. Render წაიკითხავs `render.yaml`-ს ავტომატურად.
3. **Environment** სექციაში ჩასვი **`GEMINI_API_KEY`** (უფასო) ან `ANTHROPIC_API_KEY`.
4. **Create** → 1–2 წუთში მიიღებ URL-ს: `https://vita-health-ai.onrender.com`
   - ვებსაიტი: `…/index.html`  ·  აპი: `…/app.html`

> Render-ის უფასო სერვისი უმოქმედობისას „იძინებს" — პირველი მოთხოვნა ~30წმ ნელია, შემდეგ სწრაფი.

---

## 2) Railway  (ალტერნატივა — უფასო კრედიტი)

1. **railway.app** → **New Project** → **Deploy from GitHub repo**.
2. Railway თვითონ აღმოაჩენს Python-ს და `Procfile`-ს (`web: python serve.py`).
3. **Variables**: `HOST=0.0.0.0` და `GEMINI_API_KEY=…` (PORT ავტომატურია).
4. **Settings → Networking → Generate Domain** → მიიღებ public URL-ს.

---

## 3) მხოლოდ სტატიკური (Netlify / Vercel / GitHub Pages) — AI-ის გარეშე

თუ მხოლოდ საიტი/აპი გინდა (ასისტენტი offline რეჟიმში):

- **Netlify / Vercel:** ჩააგდე საქაღალდე (drag-and-drop) ან დააკავშირე repo. Build command: ცარიელი. Publish dir: `.`
- **GitHub Pages:** Settings → Pages → Branch `main` / root.
- გახსნი `…/app.html`-ს. AI offline იქნება (backend არ არის).

> AI რომ გინდა ცალკე static + ცალკე backend — backend Render-ზე გაუშვი (ზემოთ),
> და `js/api.js`-ში `/api/...`-ის ნაცვლად ჩასვი backend-ის სრული URL. ერთ სერვისად ჯობია.

---

## ცვლადები / Environment variables

| ცვლადი | რა | სად |
|---|---|---|
| `HOST` | `0.0.0.0` | სავალდებულო ჰოსტინგზე (render.yaml-ში უკვე წერია) |
| `PORT` | პორტი | ავტომატური (Render/Railway თვითონ ანიჭებს) |
| `GEMINI_API_KEY` | უფასო AI გასაღები | aistudio.google.com |
| `ANTHROPIC_API_KEY` | Claude (ფასიანი) | console.anthropic.com |
| `VITA_GEMINI_MODEL` | მოდელი (default `gemini-2.0-flash`) | არასავალდებულო |
| `VITA_CLAUDE_MODEL` | მოდელი (default `claude-opus-4-8`) | არასავალდებულო |

პრიორიტეტი: **Claude > Gemini > offline**.

---

## ლოკალურად production-რეჟიმის ტესტი

```bash
HOST=0.0.0.0 PORT=8080 GEMINI_API_KEY=AIza... python3 serve.py
# გახსენი http://127.0.0.1:8080/app.html
```
