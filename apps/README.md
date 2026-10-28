# Primary Key applications

The application code is split into two folders:

- `web/` - React/Vite frontend. Only browser-safe `VITE_*` values belong here.
- `api/` - Express/TypeScript backend. MySQL and SMTP credentials belong only in `api/.env`.

Run the applications separately:

```powershell
cd "C:\Users\jeffr\Desktop\Jeffrey Clg\DBMS-Project-Lockin\apps\api"
npm run dev
```

```powershell
cd "C:\Users\jeffr\Desktop\Jeffrey Clg\DBMS-Project-Lockin\apps\web"
npm run dev
```

The backend `.env` files are intentionally ignored. Share `.env.example` files with the team, then each developer creates their own local `.env`.
