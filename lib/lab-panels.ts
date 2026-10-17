export type LabPanelTemplate = {
  id: string;
  name: string;
  description: string;
  tests: { id: string; name: string; unit?: string }[];
};

export const labPanelTemplates: LabPanelTemplate[] = [
  {
    id: "hemogram",
    name: "Hemogram",
    description: "Temel tam kan sayımı testlerini hızlı seç.",
    tests: [
      { id: "hemoglobin", name: "Hemoglobin", unit: "g/dL" },
      { id: "hematocrit", name: "Hematokrit", unit: "%" },
      { id: "leukocyte", name: "Lökosit", unit: "10^3/µL" },
      { id: "platelet", name: "Trombosit", unit: "10^3/µL" },
      { id: "mcv", name: "MCV", unit: "fL" },
    ],
  },
  {
    id: "lipid",
    name: "Lipid",
    description: "Kolesterol ve trigliserid sonuçlarını birlikte takip et.",
    tests: [
      { id: "totalCholesterol", name: "Total Kolesterol", unit: "mg/dL" },
      { id: "ldlCholesterol", name: "LDL Kolesterol", unit: "mg/dL" },
      { id: "hdlCholesterol", name: "HDL Kolesterol", unit: "mg/dL" },
      { id: "triglyceride", name: "Trigliserid", unit: "mg/dL" },
    ],
  },
  {
    id: "thyroid",
    name: "Tiroid",
    description: "Sık kullanılan tiroid testlerini seç.",
    tests: [
      { id: "tsh", name: "TSH", unit: "mIU/L" },
      { id: "freeT4", name: "Serbest T4", unit: "ng/dL" },
      { id: "freeT3", name: "Serbest T3", unit: "pg/mL" },
    ],
  },
  {
    id: "liver",
    name: "Karaciğer",
    description: "Karaciğer fonksiyon testlerini bir arada tut.",
    tests: [
      { id: "alt", name: "ALT", unit: "U/L" },
      { id: "ast", name: "AST", unit: "U/L" },
      { id: "ggt", name: "GGT", unit: "U/L" },
      { id: "totalBilirubin", name: "Total Bilirubin", unit: "mg/dL" },
    ],
  },
  {
    id: "kidney",
    name: "Böbrek",
    description: "Böbrek fonksiyonu ile ilişkili temel testleri seç.",
    tests: [
      { id: "creatinine", name: "Kreatinin", unit: "mg/dL" },
      { id: "urea", name: "Üre", unit: "mg/dL" },
      { id: "egfr", name: "eGFR", unit: "mL/dk/1.73m²" },
    ],
  },
];
