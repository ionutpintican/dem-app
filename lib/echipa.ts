export type Categorie =
  | "radiologie"
  | "oncologie"
  | "chirurgie_oncologica"
  | "chirurgie_plastica"
  | "radioterapie"
  | "genetica"
  | "psihologie"
  | "anatomie_patologica";

export type Doctor = {
  nume: string;
  specialitate: string;
  imgUrl: string | null;
  categorie: Categorie;
  esteCoordonator?: boolean;
};

export const CATEGORII_ETICHETE: Record<Categorie, string> = {
  radiologie: "Radiologie și imagistică",
  oncologie: "Oncologie medicală",
  chirurgie_oncologica: "Chirurgie oncologică",
  chirurgie_plastica: "Chirurgie plastică și reconstructivă",
  radioterapie: "Radioterapie",
  genetica: "Genetică",
  psihologie: "Psiho-oncologie",
  anatomie_patologica: "Anatomie patologică",
};

export const ORDINEA_CATEGORII: Categorie[] = [
  "radiologie",
  "oncologie",
  "chirurgie_oncologica",
  "chirurgie_plastica",
  "radioterapie",
  "genetica",
  "psihologie",
  "anatomie_patologica",
];

export const ECHIPA: Doctor[] = [
  // Radiologie și imagistică
  {
    nume: "Dr. Roman Andrei",
    specialitate: "Medic primar radiologie și imagistică",
    imgUrl: null,
    categorie: "radiologie",
    esteCoordonator: true,
  },
  {
    nume: "Dr. Carmen Lisencu",
    specialitate: "Medic primar radioterapie, competență senologie imagistică",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2023/01/Dr.-Carmen-Lisencu_ctm.jpg",
    categorie: "radiologie",
  },
  {
    nume: "Dr. Pintican Roxana",
    specialitate: "Medic specialist radiologie și imagistică medicală, senologie",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2024/10/dr-pintican-roxana.png",
    categorie: "radiologie",
  },
  {
    nume: "Dr. Popița Cristian",
    specialitate: "Medic primar radiologie și imagistică medicală",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2023/01/Dr-Cristian-Popita-ctm.jpg",
    categorie: "radiologie",
  },
  {
    nume: "Dr. Alexandra Andries",
    specialitate: "Medic specialist radiologie și imagistică medicală",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2023/01/dr-Alexandra-Andries_ctm.jpg",
    categorie: "radiologie",
  },

  // Oncologie medicală
  {
    nume: "Dr. Nicoleta Zenovia Antone",
    specialitate: "Medic primar oncologie medicală",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2022/11/Nicoleta-Antone-scaled.jpeg",
    categorie: "oncologie",
    esteCoordonator: true,
  },
  {
    nume: "Dr. Gabriela Morar-Bolba",
    specialitate: "Medic primar oncologie medicală",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2022/11/Gabriela-Morar-Bolba-scaled.jpeg",
    categorie: "oncologie",
  },
  {
    nume: "Dr. Rohozneanu Emanuela",
    specialitate: "Medic oncologie medicală",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2024/10/dr_rohozneanu_emanuela_2.png",
    categorie: "oncologie",
  },
  {
    nume: "Dr. Daniela Grecea",
    specialitate: "Medic primar radioterapie și oncologie medicală",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2022/12/Daniela-Grecea2-600x1065.jpg",
    categorie: "oncologie",
  },
  {
    nume: "Dr. Miruna Grecea",
    specialitate: "Medic oncologie medicală",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2022/11/Miruna-Grecea-scaled.jpeg",
    categorie: "oncologie",
  },
  {
    nume: "Dr. Dragoș Goada",
    specialitate: "Medic oncologie medicală",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2025/10/Dr.-Dragos-Goada.jpg",
    categorie: "oncologie",
  },
  {
    nume: "Dr. Alecsandra Gorzo",
    specialitate: "Medic oncologie medicală",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2025/10/Dr.-Alecsandra-Gorzo.jpg",
    categorie: "oncologie",
  },

  // Chirurgie oncologică
  {
    nume: "Conf. Dr. Lisencu Cosmin",
    specialitate: "Medic primar chirurgie oncologică",
    imgUrl: null,
    categorie: "chirurgie_oncologica",
    esteCoordonator: true,
  },
  {
    nume: "Dr. Pușcaș Marius Emil",
    specialitate: "Medic chirurgie oncologică",
    imgUrl: null,
    categorie: "chirurgie_oncologica",
  },

  // Chirurgie plastică și reconstructivă
  {
    nume: "Dr. Maximilian Muntean",
    specialitate: "Medic primar chirurgie plastică și reconstructivă",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2022/11/Maximilian-Muntean-v2-600x1066.jpg",
    categorie: "chirurgie_plastica",
  },

  // Radioterapie
  {
    nume: "Dr. Daniela Martin",
    specialitate: "Medic primar radioterapie",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2022/11/Daniela-Martin_bun-scaled.jpeg",
    categorie: "radioterapie",
    esteCoordonator: true,
  },
  {
    nume: "Dr. Carmen Popa",
    specialitate: "Medic primar radioterapie",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2022/11/Carmen-Popa-scaled.jpeg",
    categorie: "radioterapie",
  },
  {
    nume: "Dr. Marius Maxin",
    specialitate: "Medic radioterapie",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2022/12/marius-maxin-2-600x1065.jpg",
    categorie: "radioterapie",
  },

  // Genetică
  {
    nume: "Dr. Adrian Trifa",
    specialitate: "Medic primar genetică medicală",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2022/11/Adrian-Trifa-scaled.jpeg",
    categorie: "genetica",
  },
  {
    nume: "Dr. Maria Micluș",
    specialitate: "Medic specialist genetică medicală și endocrinologie",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2025/10/Dr.-Maria-Miclaus.jpg",
    categorie: "genetica",
  },
  {
    nume: "Dr. Andreea Catană",
    specialitate: "Medic genetică medicală",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2022/11/Andreea-Catana.jpeg",
    categorie: "genetica",
  },

  // Psiho-oncologie
  {
    nume: "Psh. Florina Pop",
    specialitate: "Psiholog clinician, psiho-oncologie",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2024/10/dr-florina-pop.png",
    categorie: "psihologie",
  },
  {
    nume: "Psh. Nicoleta Pașca",
    specialitate: "Psiholog clinician, psihoterapeut",
    imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2024/10/Psh-nicoleta-pasca.png",
    categorie: "psihologie",
  },

  // Anatomie patologică
  {
    nume: "Dr. Buiga-Potcoava Rareș",
    specialitate: "Medic primar anatomie patologică",
    imgUrl: null,
    categorie: "anatomie_patologica",
    esteCoordonator: true,
  },
];
