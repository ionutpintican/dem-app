export type CampFormular = {
  id: string;
  label: string;
  tip: "text" | "textarea";
  obligatoriu?: boolean;
  placeholder?: string;
};

export const CAMPURI_PER_ROL: Record<string, CampFormular[]> = {
  radiolog: [
    {
      id: "tip_imagistica",
      label: "Tip imagistică utilizată",
      tip: "text",
      placeholder: "CT, RMN, PET-CT, ecografie...",
    },
    {
      id: "observatii_imagistice",
      label: "Observații imagistice",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Descrieți principalele constatări imagistice...",
    },
    {
      id: "dimensiuni_leziune",
      label: "Dimensiuni leziune (mm)",
      tip: "text",
      placeholder: "ex. 35 × 28 × 22 mm",
    },
    {
      id: "extensie_locala",
      label: "Extensie locală",
      tip: "textarea",
      placeholder: "Descrieți extinderea locală a leziunii...",
    },
    {
      id: "adenopatie",
      label: "Adenopatie / metastaze",
      tip: "textarea",
      placeholder: "Prezență/absență ganglioni regionali, metastaze...",
    },
    {
      id: "recomandari",
      label: "Recomandări imagistice suplimentare",
      tip: "textarea",
      placeholder: "Investigații imagistice suplimentare recomandate...",
    },
    {
      id: "concluzie",
      label: "Concluzie",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Concluzia radiologică...",
    },
  ],

  oncolog: [
    {
      id: "diagnostic",
      label: "Diagnostic oncologic",
      tip: "text",
      obligatoriu: true,
      placeholder: "ex. Carcinom mamar invaziv NST, grad III",
    },
    {
      id: "stadializare",
      label: "Stadializare TNM",
      tip: "text",
      placeholder: "ex. T2N1M0, Stadiu IIb",
    },
    {
      id: "markeri_tumorali",
      label: "Receptori / markeri tumorali",
      tip: "textarea",
      placeholder: "ER, PR, HER2, Ki67, CA 19-9...",
    },
    {
      id: "recomandare_tratament",
      label: "Recomandare tratament sistemic",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Chimioterapie, hormonoterapie, imunoterapie, terapie țintită...",
    },
    {
      id: "secventa_tratament",
      label: "Secvența de tratament propusă",
      tip: "textarea",
      placeholder: "Neoadjuvant / adjuvant / paliativ, ordine scheme...",
    },
    {
      id: "concluzie",
      label: "Concluzie",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Concluzia oncologică...",
    },
  ],

  chirurg_oncolog: [
    {
      id: "indicatie_chirurgicala",
      label: "Indicație chirurgicală",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Motivul indicației și oportunitatea intervenției...",
    },
    {
      id: "interventie_propusa",
      label: "Intervenție propusă",
      tip: "text",
      placeholder: "ex. Mastectomie totală + limfadenectomie axilară nivel II",
    },
    {
      id: "abord_chirurgical",
      label: "Abord chirurgical",
      tip: "textarea",
      placeholder: "Tehnica chirurgicală propusă, laparoscopic/deschis...",
    },
    {
      id: "moment_interventie",
      label: "Moment optim intervenție",
      tip: "text",
      placeholder: "Imediat / după chimioterapie neoadjuvantă / post-radioterapie...",
    },
    {
      id: "riscuri_evaluate",
      label: "Riscuri evaluate",
      tip: "textarea",
      placeholder: "Scor ASA, comorbidități relevante, riscuri specifice intervenției...",
    },
    {
      id: "concluzie",
      label: "Concluzie",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Concluzia chirurgicală...",
    },
  ],

  chirurg_plastician: [
    {
      id: "posibilitate_reconstructie",
      label: "Posibilitate reconstrucție",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Indicat imediat / amânat / contraindicat — motivație...",
    },
    {
      id: "tehnica_reconstructie",
      label: "Tehnica de reconstrucție propusă",
      tip: "textarea",
      placeholder: "Implant, lambou TRAM, lambou DIEP, lambou latissimus dorsi...",
    },
    {
      id: "moment_reconstructie",
      label: "Moment reconstrucție",
      tip: "text",
      placeholder: "Imediat / amânat 6 luni / după finalizarea radioterapiei...",
    },
    {
      id: "conditii_necesare",
      label: "Condiții necesare pentru reconstrucție",
      tip: "textarea",
      placeholder: "Cerințe de țesut, status vascular, pregătire prealabilă...",
    },
    {
      id: "concluzie",
      label: "Concluzie",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Concluzia chirurgiei plastice...",
    },
  ],

  radioterapeut: [
    {
      id: "indicatie_radioterapie",
      label: "Indicație radioterapie",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Indicație curativă / paliativă / profilactică, motivație...",
    },
    {
      id: "tehnica_propusa",
      label: "Tehnică propusă",
      tip: "text",
      placeholder: "3DCRT, IMRT, VMAT, SBRT, SRS, brahiterapie...",
    },
    {
      id: "doza_totala",
      label: "Doză totală (Gy)",
      tip: "text",
      placeholder: "ex. 50 Gy",
    },
    {
      id: "fractionare",
      label: "Fracționare",
      tip: "text",
      placeholder: "ex. 25 fracțiuni × 2 Gy/fracție",
    },
    {
      id: "volume_tinta",
      label: "Volume țintă / organe la risc",
      tip: "textarea",
      placeholder: "GTV, CTV, PTV; organe la risc relevante și limitele de doză...",
    },
    {
      id: "concluzie",
      label: "Concluzie",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Concluzia radioterapeutică...",
    },
  ],

  genetician: [
    {
      id: "indicatie_testare",
      label: "Indicație testare genetică",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Motivul indicației testării, istoric familial relevant...",
    },
    {
      id: "mutatii_investigate",
      label: "Mutații investigate / relevante",
      tip: "textarea",
      placeholder: "BRCA1, BRCA2, TP53, PALB2, MLH1, MSH2...",
    },
    {
      id: "rezultat_testare",
      label: "Rezultat testare genetică",
      tip: "textarea",
      placeholder: "Mutație patogenă / variantă de semnificație incertă (VUS) / negativ / în așteptare...",
    },
    {
      id: "risc_rude",
      label: "Risc pentru rude de gradul I",
      tip: "textarea",
      placeholder: "Implicații pentru membrii familiei, recomandare testare rude...",
    },
    {
      id: "recomandare_consiliere",
      label: "Recomandare consiliere genetică",
      tip: "textarea",
      placeholder: "Tip consiliere, urgență, screening recomandat...",
    },
    {
      id: "concluzie",
      label: "Concluzie",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Concluzia genetică...",
    },
  ],

  psiholog: [
    {
      id: "evaluare_psihologica",
      label: "Evaluare psihologică",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Starea psihologică actuală, mecanisme de coping, resurse personale...",
    },
    {
      id: "nivel_distres",
      label: "Nivel distres (Termometrul Distresului, 0–10)",
      tip: "text",
      placeholder: "ex. 7/10",
    },
    {
      id: "dificultati_identificate",
      label: "Dificultăți identificate",
      tip: "textarea",
      placeholder: "Anxietate, depresie, teamă de recurență, probleme de somn, izolare socială...",
    },
    {
      id: "suport_recomandat",
      label: "Suport psihologic recomandat",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Tip intervenție, frecvență sesiuni, grup de suport, trimitere psihiatrie...",
    },
    {
      id: "concluzie",
      label: "Concluzie",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Concluzia psihologică...",
    },
  ],

  nutritionist: [
    {
      id: "status_nutritional",
      label: "Status nutrițional",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Scor NRS-2002 / MNA, greutate actuală, IMC, albumină serică...",
    },
    {
      id: "riscuri_nutritionale",
      label: "Riscuri nutriționale identificate",
      tip: "textarea",
      placeholder: "Malnutriție, cașexie, sarcopenie, deficiențe specifice de vitamine/minerale...",
    },
    {
      id: "plan_nutritional",
      label: "Plan nutrițional propus",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Aport caloric țintă (kcal/zi), proteine (g/kg), tip dietă recomandat...",
    },
    {
      id: "suplimente",
      label: "Suplimente nutritive recomandate",
      tip: "textarea",
      placeholder: "ONS (suplimente nutriționale orale), vitamine, minerale, doze...",
    },
    {
      id: "suport_enteral_parenteral",
      label: "Nutriție enterală / parenterală",
      tip: "textarea",
      placeholder: "Indicație, tip formulă, cale de administrare, durată estimată...",
    },
    {
      id: "concluzie",
      label: "Concluzie",
      tip: "textarea",
      obligatoriu: true,
      placeholder: "Concluzia nutrițională...",
    },
  ],
};
