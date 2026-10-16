/* Catalogue des sujets d'Archive.Sujets.
   Réglez les années ici : */
const DEBUT=2012, FIN=2026;

const SERIES=["A","C","D","F4BA","F4BE","GT","MHB"];
const NIVEAUX=[
  {classe:"3ème (BEPC)", series:[""]},
  {classe:"1ère (Probatoire)", series:SERIES},
  {classe:"Terminale (BAC)", series:SERIES}
];

/* Matières détaillées par classe et série. Sans liste, la ligne couvre "Toutes les matières". */
const F4BE_1=["Procédés de construction","Exploitation des chantiers","Mécanique appliquée","Topographie","Métré","Dessin","Laboratoire","Mathématiques","Sciences physiques","Français","Anglais","ECM","Histoire","Informatique"];
const MATIERES={
  "1ère (Probatoire)|F4BE":F4BE_1,
  "1ère (Probatoire)|F4BA":F4BE_1.filter(m=>m!=="Topographie"),
  "Terminale (BAC)|F4BE":[...F4BE_1,"Réglementation","Béton armé"],
  "Terminale (BAC)|F4BA":[...F4BE_1,"Réglementation","Béton armé"]
};

const SUJETS=[];
for(let an=FIN;an>=DEBUT;an--){
  NIVEAUX.forEach(n=>n.series.forEach(se=>{
    (MATIERES[n.classe+"|"+se]||["Toutes les matières"]).forEach(m=>{
      SUJETS.push({classe:n.classe,serie:se,matiere:m,annee:an,acces:"payant"});
    });
  }));
}
