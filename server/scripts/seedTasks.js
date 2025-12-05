import mongoose from 'mongoose';
import Task from '../models/Tasks.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const tasks = [
  {
    name: "Iemand meebrengen naar de nadoop",
    points: 50,
    repeatable: true,
    interval: 'none',
    description: "Persoon moet zelf zeggen dat hij/zij meekomt door jou - per feut die je meeneemt 50 punten",
    category: "Recruitment"
  },
  {
    name: "Aanwezig op Kerberus-woensdag",
    points: 5,
    repeatable: true,
    interval: 'none',
    description: "Plaats foto in de facebook groep",
    category: "Events"
  },
  {
    name: "Help kuisen de dag na een feestje in de Zytho",
    points: 15,
    repeatable: true,
    interval: 'none',
    description: "Helpen met opkuisen na feestje in Zytho",
    category: "Maintenance"
  },
  {
    name: "Helpen opkuisen na een cantus",
    points: 20,
    repeatable: true,
    interval: 'none',
    description: "Helpen met opruimen na cantus",
    category: "Maintenance"
  },
  {
    name: "Halve liter binnentrekken MET formaliteiten op je knieën",
    points: 10,
    repeatable: true,
    interval: 'weekly',
    description: "Hij moet in 1 keer op - elke week mag je 1 keer binnentrekken",
    category: "Drinking"
  },
  {
    name: "Foto van de week",
    points: 20,
    repeatable: true,
    interval: 'weekly',
    description: "Het praesidium beslist welke de beste/grappigste foto is van die week",
    category: "Media"
  },
  {
    name: "Taakje doen voor praesidiumlid",
    points: 10,
    repeatable: true,
    interval: 'none',
    description: "Goedkeuring nodig van temster - minstens 10 punten",
    category: "Service"
  },
  {
    name: "Onderbroeken verzamelen op student welcome",
    points: 2,
    repeatable: true,
    interval: 'none',
    description: "Per onderbroek 2 punten",
    category: "Recruitment"
  },
  {
    name: "Helpen op Kerberusevenementen",
    points: 15,
    repeatable: true,
    interval: 'none',
    description: "Vb. BAR LA SASCH - op elk evenement",
    category: "Events"
  },
  {
    name: "Reclame maken voor een Kerberus evenement",
    points: 15,
    repeatable: true,
    interval: 'none',
    description: "Op een ORIGINELE manier (met goedkeuring dat origineel is)",
    category: "Promotion"
  },
  {
    name: "Clublied Kerberus zingen op openbare plaats",
    points: 10,
    repeatable: true,
    interval: 'none',
    description: "Luid en duidelijk zingen op een openbare plaats waar veel mensen aanwezig zijn (filmpje) - per plaats",
    category: "Public"
  },
  {
    name: "BAR LA SASCH roepen door micro op evenement",
    points: 30,
    repeatable: true,
    interval: 'none',
    description: "BAR LA SASCH, BAR LA SASCH, BAR LA SASCH door een micro roepen op een evenement + filmpje!! - per evenement 30 punten",
    category: "Events"
  },
  {
    name: "3 gangen koken voor het hele praesidium",
    points: 35,
    repeatable: false,
    interval: 'none',
    description: "Kerberus betaalt",
    category: "Service"
  },
  {
    name: "Zwaar biertje binnentrekken onder de douche",
    points: 15,
    repeatable: false,
    interval: 'none',
    description: "Trek een zwaar biertje binnen onder de douche",
    category: "Drinking"
  },
  {
    name: "Win een potje clash tegen Dries",
    points: 15,
    repeatable: false,
    interval: 'none',
    description: "Je kan maar 1 keer proberen, dus als je verliest JAMMER",
    category: "Games"
  },
  {
    name: "Pils binnentrekken tegen 1 van je ouders",
    points: 25,
    repeatable: false,
    interval: 'none',
    description: "Pils binnentrekken tegen 1 van je ouders",
    category: "Drinking"
  },
  {
    name: "Koprol doen in de les van een praesidiumlid",
    points: 20,
    repeatable: false,
    interval: 'none',
    description: "Vraag toestemming aan praesidiumlid en MET lint dus mag enkel in het IWT-gebouw",
    category: "Public"
  },
  {
    name: "Formele rating van alle soorten Caras - zonder pak",
    points: 25,
    repeatable: false,
    interval: 'none',
    description: "In een video, elke blikje/glas moet leeg zijn (Cara Pils, Cara Blond, Cara Rouge, Cara 0.0%, Cara NRG)",
    category: "Drinking"
  },
  {
    name: "Formele rating van alle soorten Caras - met pak",
    points: 30,
    repeatable: false,
    interval: 'none',
    description: "In een video, elke blikje/glas moet leeg zijn (Cara Pils, Cara Blond, Cara Rouge, Cara 0.0%, Cara NRG) - in pak gedaan",
    category: "Drinking"
  },
  {
    name: "24u lang om het uur een pint binnentrekken",
    points: 40,
    repeatable: false,
    interval: 'none',
    description: "MET FORMALITEITEN - om het uur een pint binnentrekken gedurende 24 uur",
    category: "Drinking"
  },
  {
    name: "Op het standbeeld zitten van de naakte vrouw voor de expo",
    points: 20,
    repeatable: false,
    interval: 'none',
    description: "Op het standbeeld zitten van de naakte vrouw voor de expo",
    category: "Public"
  },
  {
    name: "Zwenmen in de Vives vijver",
    points: 30,
    repeatable: false,
    interval: 'none',
    description: "Heen en terug zwemmen in de Vives vijver (met aanwezigheid van praesidium)",
    category: "Challenges"
  },
  {
    name: "2 weken lang voor een ei zorgen",
    points: 40,
    repeatable: false,
    interval: 'none',
    description: "Je moet het ALTIJD bij hebben en het mag niet breken gedurende 2 weken",
    category: "Challenges"
  },
  {
    name: "Kroegentocht met minstens 10 cafés",
    points: 30,
    repeatable: false,
    interval: 'none',
    description: "Foto bij elke pint - minstens 10 cafés bezoeken",
    category: "Drinking"
  },
  {
    name: "7 sprong aan galette shots",
    points: 20,
    repeatable: false,
    interval: 'none',
    description: "7 sprong aan galette shots doen",
    category: "Drinking"
  },
  {
    name: "Vrijwillige 7 sprong - zonder spugen",
    points: 40,
    repeatable: true,
    interval: 'weekly',
    description: "Vrijwillig de 7 sprong doen zonder te spugen - elke week nieuwe kans",
    category: "Drinking"
  },
  {
    name: "Vrijwillige 7 sprong - met spugen",
    points: 30,
    repeatable: true,
    interval: 'weekly',
    description: "Vrijwillig de 7 sprong doen maar spugen - elke week nieuwe kans",
    category: "Drinking"
  },
  {
    name: "Vrijwillig aan het radje draaien op een cantus",
    points: 20,
    repeatable: true,
    interval: 'none',
    description: "Vrijwillig aan het radje draaien op een cantus - per cantus 1 x",
    category: "Events"
  },
  {
    name: "Bakdag",
    points: 30,
    repeatable: false,
    interval: 'none',
    description: "Deelnemen aan bakdag",
    category: "Events"
  },
  {
    name: "Sasch binnentrekken tegen praesidiumlid - winst",
    points: 10,
    repeatable: true,
    interval: 'none',
    description: "Trek een sasch binnen tegen een praesidiumlid en WIN - per praesidiumlid 1x punten",
    category: "Drinking"
  },
  {
    name: "Sasch binnentrekken tegen praesidiumlid - verlies",
    points: -5,
    repeatable: true,
    interval: 'none',
    description: "Trek een sasch binnen tegen een praesidiumlid en VERLIES - per praesidiumlid 1x punten",
    category: "Drinking"
  },
  {
    name: "Pint binnentrekken tegen senior of pro-senior - winst",
    points: 10,
    repeatable: true,
    interval: 'none',
    description: "Trek een pint binnen tegen je senior of een pro-senior en WIN - per flosh 1x punten",
    category: "Drinking"
  },
  {
    name: "Pint binnentrekken tegen senior of pro-senior - verlies",
    points: -5,
    repeatable: true,
    interval: 'none',
    description: "Trek een pint binnen tegen je senior of een pro-senior en VERLIES - per flosh 1x punten",
    category: "Drinking"
  },
  {
    name: "Lint van andere club vinden en achter de bar gooien",
    points: 50,
    repeatable: true,
    interval: 'none',
    description: "Lint van andere club vinden en achter de bar in de Zytho gooien (VINDEN, NIET afpakken) - per lint krijg je punten",
    category: "Collection"
  },
  {
    name: "Muilen met PRAESIDIUMLID - muilen",
    points: 30,
    repeatable: true,
    interval: 'none',
    description: "Muilen met PRAESIDIUMLID met bewijs - per praesidiumlid 1x punten",
    category: "Social"
  },
  {
    name: "Muilen met PRAESIDIUMLID - kusje",
    points: 15,
    repeatable: true,
    interval: 'none',
    description: "Muilen met PRAESIDIUMLID met bewijs - alleen kusje - per praesidiumlid 1x punten",
    category: "Social"
  },
  {
    name: "Muilen met PRAESES/PRO-SENIOREN - muilen",
    points: 35,
    repeatable: true,
    interval: 'none',
    description: "Muilen met de PRAESES/PRO-SENIOREN met bewijs - per flosh 1x punten",
    category: "Social"
  },
  {
    name: "Muilen met PRAESES/PRO-SENIOREN - kusje",
    points: 17,
    repeatable: true,
    interval: 'none',
    description: "Muilen met de PRAESES/PRO-SENIOREN met bewijs - alleen kusje - per flosh 1x punten",
    category: "Social"
  },
  {
    name: "Mysterieus Kerberuslint opdrinken in de Villa",
    points: 40,
    repeatable: false,
    interval: 'none',
    description: "Drink het mysterieus Kerberuslint in de Villa terug",
    category: "Drinking"
  },
  {
    name: "Echte tattoo van schild of monogram van Kerberus",
    points: 80,
    repeatable: false,
    interval: 'none',
    description: "ECHTE tattoo van het schild of monogram van Kerberus",
    category: "Commitment"
  },
  {
    name: "Overnachten in het IWT-gebouw",
    points: 60,
    repeatable: false,
    interval: 'none',
    description: "OP EIGEN RISICO EN ZONDER LINT, WIJ HEBBEN ER NIETS MEE TE MAKEN",
    category: "Challenges"
  },
  {
    name: "Help met een CLUB VANT STAD opdracht - deelname",
    points: 10,
    repeatable: true,
    interval: 'none',
    description: "Help met een CLUB VANT STAD opdracht - voor elke CVS opdracht",
    category: "Events"
  },
  {
    name: "Help met een CLUB VANT STAD opdracht - winst",
    points: 20,
    repeatable: true,
    interval: 'none',
    description: "Help met een CLUB VANT STAD opdracht en we winnen - voor elke CVS opdracht",
    category: "Events"
  },
  {
    name: "Wissel volledig van outfit met commi/contra",
    points: 20,
    repeatable: false,
    interval: 'none',
    description: "Wissel volledig van outfit met commi/contra van het andere geslacht (minstens een uur in elkaars kleren)",
    category: "Social"
  },
  {
    name: "4-sprong van elke soort rocketshot op Zytho zondag",
    points: 15,
    repeatable: false,
    interval: 'none',
    description: "Doe op een ZYTHO ZONDAG een 4-sprong van elke soort rocketshot die we in de Zytho hebben",
    category: "Drinking"
  },
  {
    name: "Sprite-banaan challenge",
    points: 15,
    repeatable: false,
    interval: 'none',
    description: "Eet 2 bananen en ad dan een sprite",
    category: "Challenges"
  },
  {
    name: "Aanwezig op kerberus activiteit",
    points: 20,
    repeatable: true,
    interval: 'none',
    description: "Aanwezig op kerberus activiteit",
    category: "Events"
  },
  {
    name: "4000 colorieën challenge",
    points: 30,
    repeatable: false,
    interval: 'none',
    description: "Eet 4000 colorieën in 1 dag (met bewijs)",
    category: "Challenges"
  },
  {
    name: "Kerstmarkt Ipsoc drink met 2 samen 1 pervert op (romantisch met rietjes)",
    points: 15,
    repeatable: false,
    interval: 'none',
    description: "Kerstmarkt Ipsoc drink met 2 samen 1 pervert op (romantisch met rietjes)",
    category: "Kerstmarkt"
  },
  {
    name: "Kerstmarkt doe van elke jenever 1 shotje bij kerberus",
    points: 15,
    repeatable: false,
    interval: 'none',
    description: "doe van elke jenever 1 shotje bij kerberus",
    category: "Kerstmarkt"
  },
  {
    name: "Kerstmarkt Trek een flugelcoctail binnen tegen een mercurius praesidium lid",
    points: 15,
    repeatable: false,
    interval: 'none',
    description: "Trek een flugelcoctail binnen tegen een mercurius praesidium lid",
    category: "Kerstmarkt"
  },
  {
    name: "Kerstmarkt Vraag voor baileys/amaretto met chocomelk idp en drink maar lekker op",
    points: 15,
    repeatable: false,
    interval: 'none',
    description: "Vraag voor baileys/amaretto met chocomelk idp en drink maar lekker op",
    category: "Kerstmarkt"
  },
  {
    name: "Kerstmarkt Trek een foto met minstens 2 andere kerstmutsen (jij ook 1)",
    points: 15,
    repeatable: false,
    interval: 'none',
    description: "Trek een foto met minstens 2 andere kerstmutsen (jij ook 1)",
    category: "Kerstmarkt"
  },
  {
    name: "Kleed je 24u lang als de kerstman",
    points: 20,
    repeatable: false,
    interval: 'none',
    description: "Kleed je 24u lang als de kerstman",
    category: "Kerstmarkt"
  },
];

const seedTasks = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(`${process.env.MONGODB_URI}/KerberusPoints`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Upsert each task (update if exists by name, otherwise insert)
    console.log('Seeding tasks...');
    for (const task of tasks) {
      await Task.updateOne(
        { name: task.name, ownerSchachtId: null },
        { $set: { ...task, ownerSchachtId: null } },
        { upsert: true }
      );
    }

    console.log('Tasks seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding tasks:', err);
    process.exit(1);
  }
};

// Handle connection errors
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

seedTasks();
