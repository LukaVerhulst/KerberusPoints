# KerberusPoints · 2026–2027

Beheertool voor de temster. Schachten posten foto/video in de Facebookgroep; de temster controleert het bewijs en registreert daarna de punten. Er zijn geen schachtenaccounts of self-service inzendingen.

## Architectuur

- `client/`: React 19 / Vite; mobiele ranglijst → schacht → opdracht → bevestiging. Desktop toont ranglijst en werkruimte naast elkaar.
- `server/`: één Express-app, gedeeld door lokale `server.js` en Vercel `api/index.js`.
- MongoDB Atlas replica set; iedere scoremutatie, voltooiing en cascadeverwijdering gebeurt in één transactie. Er is geen onveilige fallback zonder transacties.
- Vite en Vercel proxyen `/api` naar de backend. De browser gebruikt één origin en een HttpOnly-cookie (`SameSite=Lax`, Secure in productie), zodat login niet afhangt van third-party cookies.
- Alle mutaties vereisen een actuele admin-JWT, een toegelaten Origin en `X-Kerberus-Request: 1`. Een directe score-overwrite wordt geweigerd: gebruik een eigen opdracht als correctie, zodat de activiteit verklaart waar punten vandaan komen.
- De bestaande `ADMINS`-configuratie blijft werken; bcrypt `passwordHash` wordt ook ondersteund. Loginpogingen worden per IP en serverinstantie beperkt.

## Lokaal starten

Gebruik Node 22 of nieuwer. Bewaar de bestaande secrets in `server/.env` en commit ze nooit. De voorbeelden bevatten alleen namen van configuratievelden.

```powershell
cd server
npm ci
npm start
# In een tweede terminal:
cd client
npm ci
npm run dev
```

Voor browsercontrole zonder productiegegevens: `npm run dev:test` in `server/` start een tijdelijke replica set op poort 4000. Dit gebruikt uitsluitend een testaccount, zoals gedocumenteerd in `server/scripts/devTest.js`; nooit gebruiken als productiestartcommando. Stop de gewone backend eerst.

## Opdrachten en herhaalregels

De 39 standaardopdrachten zijn getranscribeerd uit `Schachtenopdrachten Kerberus 2627.docx (1).pdf`. Het originele PDF staat onder `client/public/opdrachten-2026-2027.pdf`; definities staan in `server/data/tasks-2026-2027.js`.

| Regel                             | Servercontrole                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| Eenmalig                          | Unieke sleutel per schacht + opdracht                                                 |
| Onbeperkt                         | Iedere afzonderlijk bevestigde uitvoering; request-id voorkomt dubbele netwerkretries |
| Wekelijks                         | Eén per Belgische kalenderweek, maandag–zondag, inclusief zomer-/wintertijd           |
| Per persoon                       | Vaste persoonsselectie; één per persoon per opdracht, gedeeld over alle varianten     |
| Per evenement/cantus/CVS-opdracht | Vaste selectie en groep; één per evenement per opdracht                               |
| Per aantal                        | Geheel aantal 1–1000 × punten per feut/lint/onderbroek/plaats                         |

Een vaste puntwaarde, variant of variabele waarde vanaf een minimum kan met de regel worden gecombineerd. Winst/verlies, kus/muil, Cara-bonus, 7-sprong en CVS-bonus staan expliciet in de brondefinities. Subject- en eventnamen worden genormaliseerd en hergebruikt; gebruik altijd dezelfde volledige naam/identiteit. De server bewaart `pointsAwarded`, `taskName`, context, hoeveelheid, variant, notitie en beheerder bij iedere voltooiing. Terugdraaien gebruikt deze snapshot, niet een later gewijzigde opdrachtwaarde.

De temster beoordeelt bewijs, lint en formaliteiten buiten de app en bevestigt alleen de punten. Registratie heeft geen verplichte bewijsvelden, vinkjes of notitie; de app controleert geen Facebookuploads automatisch. Het document bevat geen expliciete evenementenlimiet voor opkuisen, woensdagaanwezigheid of reclame: die blijven onbeperkt volgens de bron.

## Nieuw jaar resetten

```powershell
cd server
npm run reset
# Bekijk eerst de aantallen en de exacte collecties. Daarna:
npm run reset -- --apply --confirm=KerberusPoints:2026-2027
```

De reset controleert de database `KerberusPoints` en wijzigt alleen:

- `schachten`: verwijdert alle oude personen en hun score;
- `taskcompletions`: verwijdert alle oude registraties;
- `tasks`: verwijdert oude globale en persoonsgebonden definities en plaatst 39 nieuwe globale opdrachten;
- `appconfigs`: voegt één resetmarker voor 2026–2027 toe.

Andere configuratie en admin-auth blijven behouden. De marker voorkomt dat een herhaald resetcommando nieuwe schachten opnieuw verwijdert. `npm run seed` synchroniseert alleen standaardopdrachten en behoudt personen/registraties; het gebruikt stabiele opdracht-IDs. Voer seed niet gelijktijdig met puntenmutaties uit.

## Controle

```powershell
cd client
npm run lint
npm run build
cd ../server
npm test
npm audit
```

De 17 integratietests gebruiken een geïsoleerde MongoDB replica set en testen limieten, varianten, positieve/negatieve punten, puntensnapshots, auth, CSRF, registratie zonder bewijsvelden, race conditions, cascadeverwijdering en de idempotente jaarreset. GitHub Actions voert lint, build en backendtests uit. `node_modules` worden door npm geïnstalleerd en blijven buiten Git.

## Ontwerpbronnen

- [Circle ranking](https://mobbin.com/screens/cd5daccd-6265-486c-be44-b4c182c6c4f0): rustige ranglijstrijen en duidelijke score.
- [Vinted member selection](https://mobbin.com/screens/1b48cce9-9714-4e3f-9ba7-6f774b4db611): zoekveld, volledige rij als selectiedoel.
- [TextNow quests](https://mobbin.com/screens/788f5684-f9b5-4c5a-9a2e-64c46e9d1667): opdrachtnaam met punten en status.
- [Asana filters](https://mobbin.com/screens/6f81d786-7671-4044-bd70-e29d433452f5): filters boven de lijst.
- [Clerk member detail](https://mobbin.com/screens/11875b65-819e-4e9c-b444-9430bee87d44): geselecteerde persoon en recente activiteit.
- [Beli navigation](https://mobbin.com/screens/f8f1a498-a050-4870-bbf6-3d971dbb7b9e): mobiele ondernavigatie.
- [DoorDash confirmation](https://mobbin.com/screens/245e0575-c7b7-4a6c-a57d-a3b688ea7fd3): duidelijke gevolgen en gescheiden annuleren/bevestigen.

Foto 3 is gekozen vanwege de scherpere/frontale gezichten in de voorste rij. De lucht en lege voorgrond zijn bijgesneden; de hele groep en het schild blijven in beeld. WebP op kwaliteit 91, 2048×830 pixels, circa 458 KiB. De twee andere aangeleverde fotobestanden waren byte-identiek. Geen Figma gebruikt.

## Productie

- Frontend: https://kerberus-points.vercel.app
- Backend: https://kerberus-points-backend.vercel.app
- Health: https://kerberus-points-backend.vercel.app/api/health

Vercel-projecten zijn gekoppeld aan dezelfde GitHub-repo met root directories `client` en `server`. Push naar `main` start beide deployments. Productie wordt gecontroleerd via health, login, klassement en tijdelijke testregistraties die na afloop worden verwijderd.
