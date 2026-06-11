# 010 — Admin: resetare parolă + clarificare flux cont nou

**Status:** Implemented — de verificat manual (build OK)
**Prioritate:** Medie
**Effort:** M (~50 min)
**Data:** 2026-05-28
**Autor:** SDD Pilot — Roxana + Claude

---

## Context

`AdminPanel` (`components/dashboard/AdminPanel.tsx`) gestionează crearea, editarea, activarea și ștergerea conturilor de medici. Funcționalitatea curentă acoperă cazurile uzuale, dar are câteva inconsistențe și lacune:

1. **Mesaj înșelător despre transmiterea credențialelor:** modalul „Cont nou" zice (linia 124) „Completează datele — doctorul va primi credențialele pe email." În realitate, parola e doar generată client-side, afișată și copiabilă din modal — **NU se trimite email automat cu credențialele**. Administratorul trebuie să o transmită manual (telefon, SMS, hârtie). Textul din UI sugerează altceva.
2. **Nicio modalitate de resetare parolă din admin:** dacă un medic uită parola și nu-și face singur reset prin `/resetare-parola`, admin-ul nu are buton „Trimite link de resetare" sau „Resetează parola la una nouă". Trebuie să-i spună medicului să folosească fluxul self-service.
3. **Editarea email-ului din admin nu sincronizează `auth.users`:** modalul de editare (`AdminPanel.tsx` linia 264) face PATCH la `/api/admin/users/[id]` cu `email`. Trebuie verificat dacă endpoint-ul actualizează ȘI `auth.users.email` (Supabase Admin API) — altfel utilizatorul se autentifică cu vechiul email iar tabelul `users` are noul email. Inconsistență gravă.
4. **Confirmare ștergere fără tastare nume:** modalul `ModalStergeCont` (linia 354) cere doar click pe „Șterge contul". Pentru o acțiune ireversibilă (deși medical contribution rămâne, auth credentials se șterg), admin-ul poate accidenta click. Pattern standard: cere tastarea email-ului sau a unui token de confirmare.
5. **Lipsește contor „cazuri asociate" la ștergere:** admin-ul nu vede câte `specialist_inputs` are doctorul respectiv înainte de a-l șterge. Mesajul curent (linia 398) zice generic „contribuțiile vor rămâne" — fără context.
6. **Toggle-uri concurrent fără rollback la eroare:** dacă admin-ul dă toggle pe `is_active` și API-ul eșuează, mesajul de eroare apare global (linia 545), dar starea locală a toggle-ului nu se rollback-uiește. Vizual rămâne actualizat fals.

## User stories

- **Ca administrator**, vreau ca textul modalului „Cont nou" să reflecte realitatea: parola se afișează aici, eu o transmit manual, doctorul nu primește nimic automat.
- **Ca administrator**, vreau un buton „Resetează parola" pe fiecare cont, care fie generează o parolă temporară nouă, fie trimite link de reset prin email, ca să nu mai aștept ca medicul să folosească self-service.
- **Ca administrator**, vreau să tastez emailul doctorului în confirmarea de ștergere pentru a-mi obliga gândirea atentă.
- **Ca administrator care vrea să șteargă un cont vechi**, vreau să văd „Acest doctor are X evaluări în Y cazuri", ca să iau o decizie informată.

## Acceptance criteria

1. **Text corect în `ModalContNou`:**
   - Subtitlul „Completează datele — doctorul va primi credențialele pe email" se înlocuiește cu: „Completează datele. **Notează parola** — o vei transmite separat doctorului (nu se trimite automat pe email)."
   - Sub câmpul parolă, instrucțiunea „Salvează această parolă — o vei transmite doctorului separat" se păstrează (deja accurate).
   - Opțional: dacă în viitor adăugăm trimitere email cu credențiale, devine o decizie de produs documentată în alt spec.

2. **Buton „Resetează parola" pe fiecare rând:**
   - Lângă „Editează" / iconița de ștergere, un buton „Reset parolă" (icon cheie sau text mic).
   - La click, deschide un modal cu 2 opțiuni:
     - **Opțiunea A — „Generează parolă temporară":** generează cu `genereazaParola()`, afișează + copiabil. La confirmare, PATCH la `/api/admin/users/[id]` cu `{ reset_password: "<noua_parolă>" }`. Endpoint-ul folosește Supabase Admin API `auth.admin.updateUserById(id, { password })`.
     - **Opțiunea B — „Trimite email de resetare":** POST la `/api/admin/users/[id]` cu `{ send_reset_email: true }`. Endpoint folosește `auth.resetPasswordForEmail()` cu redirect-ul standard.
   - După succes: notificare verde inline „Parolă resetată" sau „Email trimis".

3. **Sincronizare email în `auth.users`:**
   - În `/api/admin/users/[id]` PATCH, dacă body conține `email` și diferă de `users.email`, apelează ȘI `auth.admin.updateUserById(id, { email })` înainte (sau în paralel cu) update-ul pe `users`.
   - Dacă Supabase Admin API returnează eroare (de ex. email already in use), abandonăm și nu actualizăm `users`. Returnăm 409 cu mesaj clar.

4. **Confirmare ștergere cu tastare email:**
   - În `ModalStergeCont`, sub paragraful explicativ, un input: „Tastează `<email>` pentru a confirma".
   - Butonul „Șterge contul" e dezactivat până când valoarea exact match cu `utilizator.email`.
   - Placeholder-ul nu afișează email-ul (forțează admin-ul să tasteze conștient).

5. **Contor evaluări la ștergere:**
   - În `app/api/admin/users/[id]/route.ts`, înainte de DELETE, un query `count`: `service.from("specialist_inputs").select("id", { count: "exact", head: true }).eq("user_id", id)`.
   - Returnăm numărul în payload-ul de GET (pentru un endpoint dedicat `GET /api/admin/users/[id]/stats`) SAU calculăm la deschiderea modalului printr-un fetch suplimentar.
   - Modalul afișează: „Doctorul are **N evaluări** în baza de date. Acestea vor rămâne marcate cu rolul de la momentul evaluării."

6. **Rollback toggle la eroare:**
   - În `AdminPanel.tsx`, funcția `toggle()` (linia 465) face optimistic update DUPĂ răspuns. Modificare: aplic update local înainte, iar la eroare revert. Sau, mai simplu, păstrez patternul actual dar arăt vizual că toggle-ul e în loading state (icon spinner peste toggle pe durata `pending`).

7. **Build + endpoint coverage:**
   - Toate endpoint-urile admin (`/api/admin/users` + `/api/admin/users/[id]`) verifică `profil.role === "admin"` (deja făcut în pagina, dar și server-side în API).
   - TS + ESLint + build clean.

## Non-goals

- **NU adăugăm** logging-ul acțiunilor admin în `audit_logs` în acest spec (face obiectul unui spec separat — pattern similar cu 009 pentru cazuri).
- **NU permitem** ștergerea contului `admin` propriu (admin-ul nu se poate șterge pe sine — verificare server-side).
- **NU adăugăm** bulk actions („dezactivează 5 conturi simultan") — overkill pentru număr mic de utilizatori.
- **NU modificăm** structura tabelei `users`.
- **NU adăugăm** invitație prin link unic (magic invite link) — alternativă posibilă viitoare.

## Test plan

**Manual / Browser:**
- [ ] Creez cont nou — citesc atent textul modalului, confirm că zice „nu se trimite automat".
- [ ] Pe un cont existent, apăs „Reset parolă" → aleg „Generează parolă temporară" → primesc parolă afișată + copiabilă. Verific că noua parolă funcționează la `/autentificare`.
- [ ] Reset parolă → aleg „Trimite email" → verific că emailul ajunge (folosesc cont test).
- [ ] Editez emailul unui cont → verific că noul email funcționează la login, iar vechiul nu.
- [ ] Încerc să șterg un cont — input-ul de confirmare gol → buton dezactivat. Tastez email greșit → tot dezactivat. Tastez corect → activ.
- [ ] Modalul de ștergere afișează „X evaluări în Y cazuri".
- [ ] Toggle `is_active` pe un cont — simulez eroare server (oprire temporară) → toggle revine la starea anterioară + eroare vizibilă.

**Static:**
- [ ] TS clean
- [ ] `npm run build` clean
- [ ] `app/api/admin/users/[id]/route.ts` verifică server-side că caller-ul are `role === "admin"`.

**Securitate:**
- [ ] Un user cu rol non-admin care face manual `POST /api/admin/users` primește 403.
- [ ] Admin-ul nu se poate șterge pe sine (server-side check).

## Files afectate

- `components/dashboard/AdminPanel.tsx` — modal nou „Reset parolă", input confirmare ștergere, contor evaluări, text actualizat.
- `app/api/admin/users/[id]/route.ts` — handle `reset_password`, `send_reset_email`, sincronizare email la `auth.users`, count evaluări, guard self-delete.
- `app/api/admin/users/route.ts` — verificare server-side `role === "admin"` (dacă nu există deja).

## Diff plan (esența implementării)

**Text actualizat în `ModalContNou`:**
```tsx
<p className="text-sm text-slate-500 mb-6">
  Completează datele. <strong>Notează parola</strong> — o vei transmite separat
  doctorului (nu se trimite automat pe email).
</p>
```

**Modal `ModalResetParola` (nou):**
```tsx
function ModalResetParola({ utilizator, onClose, onSuccess }: ...) {
  const [optiune, setOptiune] = useState<"parola_noua" | "email">("parola_noua");
  const [parolaTemporara, setParolaTemporara] = useState(genereazaParola());
  // ...
  async function handleSubmit() {
    const body = optiune === "parola_noua"
      ? { reset_password: parolaTemporara }
      : { send_reset_email: true };
    const res = await fetch(`/api/admin/users/${utilizator.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    // ... handle response
  }
}
```

**Confirmare ștergere cu tastare email:**
```tsx
const [confirmEmail, setConfirmEmail] = useState("");
const matchExact = confirmEmail === utilizator.email;
// ...
<input
  value={confirmEmail}
  onChange={(e) => setConfirmEmail(e.target.value)}
  placeholder="Tastează emailul pentru a confirma"
  className="..."
/>
<button disabled={!matchExact || pending} onClick={handleSterge}>
  Șterge contul
</button>
```

**API PATCH cu reset_password în `/api/admin/users/[id]/route.ts`:**
```ts
const body = await req.json();

if (body.reset_password) {
  const { error } = await serviceAuth.admin.updateUserById(params.id, {
    password: body.reset_password,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

if (body.send_reset_email) {
  const { data: u } = await service.from("users").select("email").eq("id", params.id).single();
  if (!u) return NextResponse.json({ error: "Nu există" }, { status: 404 });
  const { error } = await supabase.auth.resetPasswordForEmail(u.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/resetare-parola/actualizeaza`,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// Sincronizare email la auth.users
if (body.email && body.email !== currentEmail) {
  const { error } = await serviceAuth.admin.updateUserById(params.id, { email: body.email });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
}

// Apoi update normal pe users.
```

**Guard self-delete:**
```ts
// În DELETE handler
if (user.id === params.id) {
  return NextResponse.json(
    { error: "Nu poți șterge propriul cont." },
    { status: 400 }
  );
}
```
