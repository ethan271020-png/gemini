# צ'אט Gemini — פריסה עצמאית ב-Netlify

## מה יש כאן
- `index.html` — ממשק הצ'אט (עברית, RTL), שומר את היסטוריית השיחות בדפדפן (localStorage).
- `netlify/functions/chat.js` — פונקציית שרת (serverless) שמקבלת את ההודעות ומעבירה אותן ל-Gemini API, כדי שמפתח ה-API לא ייחשף בצד הלקוח.
- `netlify.toml` — מגדיר את הפרוקסי מ-`/api/chat` לפונקציה.

## פריסה
1. דחפו את התיקייה הזו לריפו ב-GitHub (או גררו אותה ישירות לממשק הפריסה הידנית של Netlify).
2. ב-Netlify: **Add new site → Import an existing project**, ובחרו את הריפו. הגדרות ה-build כבר מוגדרות בקובץ `netlify.toml`, אין צורך לשנות דבר.
3. לכו ל-**Site configuration → Environment variables** והוסיפו משתנה:
   - Key: `GEMINI_API_KEY`
   - Value: המפתח שלכם מ-[Google AI Studio](https://aistudio.google.com/app/apikey)
4. פרסו מחדש (Deploy site / Trigger deploy) כדי שהמשתנה החדש ייכנס לתוקף.

## הרצה מקומית (אופציונלי)
עם [Netlify CLI](https://docs.netlify.com/cli/get-started/):
```bash
npm install -g netlify-cli
netlify dev
```
זה יריץ גם את הפונקציה וגם את הדף הסטטי יחד, עם אותו `/api/chat`.

## הערות
- המודלים הזמינים בתפריט הם `gemini-2.5-flash` ו-`gemini-2.5-pro`. אפשר להוסיף עוד מודלים בקובץ `index.html` (ה-`<select>`) וב-`ALLOWED_MODELS` בתוך `chat.js`.
- אם מתקבלת שגיאת "מפתח API לא תקין" — ודאו שה-API מופעל ב-Google AI Studio ושה-Environment Variable הוגדר לפני הפריסה האחרונה.
- היסטוריית השיחות נשמרת רק בדפדפן של כל משתמש (אין מסד נתונים משותף).
