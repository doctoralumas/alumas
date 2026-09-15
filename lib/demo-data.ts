export const demoUser = {
  id: "demo-user",
  name: "Alumas Kullanıcısı",
  email: "demo@alumas.app",
};

export const doctors = [
  {
    id: "dr-aylin-kaya",
    name: "Dr. Aylin Kaya",
    title: "Uzm. Dr.",
    specialty: "İç Hastalıkları",
    hospital: "Alumas Sağlık Ağı",
    city: "İstanbul",
    rating: 4.9,
    reviewCount: 184,
    bio: "Koruyucu sağlık, metabolik takip ve kronik hastalık yönetimi alanlarında çalışan iç hastalıkları uzmanı.",
    price: 1450,
    nextSlot: "Bugün 18:30",
    initials: "AK",
  },
  {
    id: "dr-kerem-demir",
    name: "Dr. Kerem Demir",
    title: "Doç. Dr.",
    specialty: "Kardiyoloji",
    hospital: "Alumas Sağlık Ağı",
    city: "İstanbul",
    rating: 4.8,
    reviewCount: 132,
    bio: "Kalp sağlığı, hipertansiyon ve uzaktan hasta takibi üzerine çalışan kardiyoloji uzmanı.",
    price: 1800,
    nextSlot: "Yarın 10:00",
    initials: "KD",
  },
  {
    id: "dr-selin-arslan",
    name: "Dr. Selin Arslan",
    title: "Uzm. Dr.",
    specialty: "Dermatoloji",
    hospital: "Alumas Sağlık Ağı",
    city: "İstanbul",
    rating: 4.9,
    reviewCount: 221,
    bio: "Klinik dermatoloji, saç ve cilt sağlığı alanlarında hasta odaklı takip sunar.",
    price: 1600,
    nextSlot: "Yarın 14:30",
    initials: "SA",
  }
] as const;


