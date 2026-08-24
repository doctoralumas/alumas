export type LabPanelTemplate={name:string;description:string;tests:{name:string;unit?:string}[]};
export const labPanelTemplates:LabPanelTemplate[]=[
  {name:'Hemogram',description:'Temel tam kan sayımı testlerini hızlı seç.',tests:[{name:'Hemoglobin',unit:'g/dL'},{name:'Hematokrit',unit:'%'},{name:'Lökosit',unit:'10^3/µL'},{name:'Trombosit',unit:'10^3/µL'},{name:'MCV',unit:'fL'}]},
  {name:'Lipid',description:'Kolesterol ve trigliserid sonuçlarını birlikte takip et.',tests:[{name:'Total Kolesterol',unit:'mg/dL'},{name:'LDL Kolesterol',unit:'mg/dL'},{name:'HDL Kolesterol',unit:'mg/dL'},{name:'Trigliserid',unit:'mg/dL'}]},
  {name:'Tiroid',description:'Sık kullanılan tiroid testlerini seç.',tests:[{name:'TSH',unit:'mIU/L'},{name:'Serbest T4',unit:'ng/dL'},{name:'Serbest T3',unit:'pg/mL'}]},
  {name:'Karaciğer',description:'Karaciğer fonksiyon testlerini bir arada tut.',tests:[{name:'ALT',unit:'U/L'},{name:'AST',unit:'U/L'},{name:'GGT',unit:'U/L'},{name:'Total Bilirubin',unit:'mg/dL'}]},
  {name:'Böbrek',description:'Böbrek fonksiyonu ile ilişkili temel testleri seç.',tests:[{name:'Kreatinin',unit:'mg/dL'},{name:'Üre',unit:'mg/dL'},{name:'eGFR',unit:'mL/dk/1.73m²'}]}
];
