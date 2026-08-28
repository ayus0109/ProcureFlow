# ProcureFlow — SIH slide content

Copy-paste ready. Keep the phrasing short on the slide; expand verbally.

---

## EXPECTED SOLUTION

Develop a platform that:
- **Enables farmer registration and slot booking**
- **Provides real-time queue management**
- **Sends SMS/app notifications**
- **Tracks procurement and payment status**
- **Reduces congestion and waiting time at procurement centres**

---

## TECHNICAL APPROACH

**Technologies used**

- Frontend: React 19 + Vite, Tailwind CSS — mobile-first, 3 languages (English / हिंदी / मराठी)
- Backend: Node.js + Express, REST API
- Database: SQLite (prototype) → PostgreSQL (production)
- Live updates: lightweight HTTP polling (4–6 s) — no sockets, works on 2G
- Deployment: single container per district; runs on any low-end Android browser

**Process flow**

Farmer books slot → token auto-issued → live queue position + ETA → arrival time advised →
centre check-in → quality assay + weighment → amount auto-computed from grade × weight →
digital receipt → payment tracked till paid → season record updated

**Engineering decisions that make it trustworthy**

- Queue position **derived** from the database on every read — it can never drift
- Amount computed **server-side** from the rate table — the form cannot alter what a farmer is paid
- **Quality grade sets the rate**, applied on the server; the receipt shows the support rate, the
  grade adjustment and the final rate, so a farmer can check the arithmetic themselves
- Season totals are **summed at read time** from the receipts — a total can never disagree with them
- Each sale written in a **single transaction** — no half-recorded procurement
- **Role-scoped API** — an admin can only ever see and act on their own centre
- Full audit trail against every token

*(Prototype uses clearly-labelled demo data, not live government records.)*

---

## FEASIBILITY AND VIABILITY

**Feasibility**

- Working prototype already built: farmer app + centre dashboard, complete booking → payment flow,
  plus each farmer's own season record (quintals sold, earned, paid, awaiting, grade-wise)
- **Zero new hardware** — farmer uses their own phone; centre needs one browser
- Open-source stack, no licence cost; one small server serves a district
- Mirrors the **existing** procurement sequence (token, assay, weighment, receipt, payment) — no process retraining

**Challenges → how we solve them**

| Risk | Mitigation |
|---|---|
| No smartphone / low literacy | 3 local languages, icon-led large-touch UI; operator can book for the farmer; SMS token |
| Weak rural network | Small payloads, polling not streaming; printed token works offline |
| Staff resistance, extra workload | One screen, one press per stage — faster than paper registers |
| Disputes over weight or amount | Server-computed amounts, immutable record, reference number on every payment |
| Peak-season load | Per-window capacity caps; stateless API scales horizontally |
| Fitting existing govt systems | REST design ready to integrate with eNAM / state portals and PFMS-DBT payouts |

**Viability**

- No per-farmer cost; fits inside existing department IT budget
- Scales centre-by-centre: pilot one district → expand statewide
- Benefits: shorter waits, no wasted trips, transparent pricing, faster payments, live congestion data for planners

---

## FINAL PROJECT SCOPE & ROADMAP

### Solution to Improve-

1. Build stable lightweight application.
2. Scalable backend infrastructure.
3. Simply authentication.
4. Multilingual instructor, visual guidance.
5. Add file validation, compression msgs.
6. Improve location/centre selection 
7. SMS confirmation with booking id
8. Ticket tracking, FAQS, support system.
9. Provide real-time approval tracking.
10. Use very simple Ui, multi lingual, voice assistant

### Can Improve in Our App-

1. Huge Product catalogue.
2. Expert advice.
3. Crop diagnosis.
4. Weather
5. Farmer Community
6. Multilingual from start
7. Offline Working
8. Customer support
9. Voice-Based Assistant
10. Mandi Comparison
11. Automatic reminders
