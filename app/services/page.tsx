import Link from "next/link";
import { Pill, Syringe, Heartbeat, Baby, UserCirclePlus, FirstAidKit, ShieldPlus, MagnifyingGlass, VideoCamera, ChatTeardropText, BookOpenText, CalendarCheck, FileText, Bell, Question, PhoneCall, Drop, Ruler, Files, Hospital, Target, UserList, AddressBook, FilePlus, Calendar } from "@phosphor-icons/react/dist/ssr";

export default function ServicesPage(){
  const sections = [
    {
      title: "Klinik Takip",
      desc: "Uzmanlarla salk verilerinizi ve planlarnz ynetin.",
      items: [
        {href:"/appointments",title:"Randevularm",desc:"Yaklaan ve gemi randevular.",tone:"blue2",icon:CalendarCheck},
        {href:"/care-calendar",title:"Ortak Takvim",desc:"Doktorla paylalan grevler.",tone:"pink",icon:Calendar},
        {href:"/messages",title:"Mesajlar",desc:"Salk profesyonelleriyle gvenli mesajlama.",tone:"ice",icon:ChatTeardropText},
        {href:"/notifications",title:"Bildirimler",desc:"Randevu ve takip bildirimlerini ynet.",tone:"sand",icon:Bell},
        {href:"/health/history",title:"Tbbi Gemi",desc:"Alerji, durum, a ve ilem kaytlar.",tone:"mint",icon:BookOpenText},
        {href:"/health-circle",title:"Health Circle",desc:"Benzer salk hedefleri olanlarla ele.",tone:"pink",icon:UserList}
      ]
    },
    {
      title: "Salk Kaytlar",
      desc: "Tm tbbi veri ve dosyalarnz tek bir gvenli merkezde.",
      items: [
        {href:"/health/labs",title:"Laboratuvar",desc:"Tahlil sonular ve trendleri.",tone:"blue2",icon:Drop},
        {href:"/health/imaging",title:"Grntleme",desc:"Rntgen, MR ve raporlarnz.",tone:"purple",icon:Files},
        {href:"/health/body",title:"Vcut",desc:"Kilo, boy ve vcut kitle indeksi.",tone:"pink",icon:UserCirclePlus},
        {href:"/health/blood-pressure",title:"Tansiyon",desc:"Kan basnc ve nabz takibi.",tone:"mint",icon:Heartbeat},
        {href:"/health/medications",title:"lalar",desc:"Reeteler ve dozaj hatrlatclar.",tone:"ice",icon:Pill},
        {href:"/health/vaccinations",title:"Alar",desc:"A gemii ve takvimi.",tone:"blue",icon:Syringe},
        {href:"/health/allergies",title:"Alerjiler",desc:"Alerji kaytlar ve reaksiyonlar.",tone:"sand",icon:ShieldPlus},
        {href:"/health/goals",title:"Hedefler",desc:"Doktorunuzun koyduu takip hedefleri.",tone:"purple",icon:Target}
      ]
    },
    {
      title: "Aile & Paylam",
      desc: "Sevdiklerinizin saln takip edin, verilerinizi doktorlara an.",
      items: [
        {href:"/health/family-hub",title:"Aile Sal Merkezi",desc:"Tm aile yelerinin salk profillerini tek bir yerden ynetin.",tone:"pink",icon:Baby},
        {href:"/health/family",title:"Aile & ocuk",desc:"Baml bireylerin profillerini e-Nabz ile sekronize edin.",tone:"pink",icon:UserCirclePlus},
        {href:"/health/family-access",title:"Aile Eriimi",desc:"Yetikin aile yelerinizden acil durum ve profil eriimi isteyin.",tone:"blue2",icon:ShieldPlus},
        {href:"/health/family-profiles",title:"zel Profiller",desc:"Gebelik ve ocuk profillerini uzmanlarla payla.",tone:"purple",icon:FilePlus},
        {href:"/health/summary",title:"Salk zeti",desc:"Acil durum veya paylam iin verileri sein.",tone:"sand",icon:FileText},
        {href:"/health/reports",title:"Raporlar",desc:"PDF rapor ret ve uzmanlara okuma izni ver.",tone:"ice",icon:FileText}
      ]
    },
    {
      title: "Hizmetler",
      desc: "Acil durum, evde bakm ve hastane randevular.",
      items: [
        {href:"/search",title:"Doktor Bul",desc:"Bran veya isme gre uzman ara.",tone:"blue2",icon:MagnifyingGlass},
        {href:"/video",title:"Video Danmanlk",desc:"Online grmeler ve bekleme odas.",tone:"ice",icon:VideoCamera},
        {href:"/organizations",title:"Hastaneler",desc:"Anlamal kurum ve merkezler.",tone:"purple",icon:Hospital},
        {href:"/home-care",title:"Evde Bakm",desc:"Eve hemire ve tahlil hizmetleri.",tone:"pink",icon:Heartbeat},
        {href:"/emergency",title:"Acil Yardm",desc:"Nbeti eczane ve acil klinik.",tone:"sand",icon:FirstAidKit},
        {href:"/phone-directory",title:"Rehber",desc:"Kurum ve uzman telefonlar.",tone:"mint",icon:AddressBook}
      ]
    }
  ];

  return <div className="page" style={{maxWidth:"1200px"}}>
    <div className="page-title" style={{marginBottom:"48px"}}>
      <span className="kicker">HZMETLER & ARALAR</span>
      <h1>Tm Salk Ekosistemi</h1>
      <p>Klinik takip, veri ynetimi, aile paylam ve randevu aralarn kefet.</p>
    </div>
    
    <div style={{display:"flex",flexDirection:"column",gap:"48px"}}>
      {sections.map((sec, i) => (
        <section key={i}>
          <div style={{marginBottom:"24px", borderBottom:"2px solid #e2e8f0", paddingBottom:"16px"}}>
            <h2 style={{margin:"0 0 8px 0", fontSize:"22px", color:"#0f172a"}}>{sec.title}</h2>
            <p style={{margin:0, color:"#64748b", fontSize:"15px"}}>{sec.desc}</p>
          </div>
          <div className="dashboard-grid">
            {sec.items.map((item, j) => (
              <Link key={j} href={item.href} className={`card ${item.tone}-tone`} style={{textDecoration:"none", display:"flex", alignItems:"flex-start", gap:"16px", padding:"24px"}}>
                <div style={{
                  padding:"12px", 
                  borderRadius:"16px", 
                  background:"var(--tone-bg)", 
                  color:"var(--tone-fg)",
                  boxShadow:"0 4px 6px -1px rgba(0,0,0,0.05)"
                }}>
                  <item.icon size={28} weight="duotone" />
                </div>
                <div>
                  <h3 style={{margin:"0 0 6px 0", fontSize:"17px", fontWeight:700, color:"#0f172a"}}>{item.title}</h3>
                  <p style={{margin:0, fontSize:"14px", color:"#64748b", lineHeight:1.5}}>{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  </div>;
}
