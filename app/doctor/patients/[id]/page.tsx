import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import DoctorPatientTrends from "@/components/doctor-patient-trends";
import DoctorPatientNotes from "@/components/doctor-patient-notes";
import HealthGoals from "@/components/health-goals";
import DoctorLabReview from "@/components/doctor-lab-review";
import ClinicalQuestions from "@/components/clinical-questions";
import ImagingCenter from "@/components/imaging-center";
import DiagnosticRequests from "@/components/diagnostic-requests";

export default async function Page({params}:{params:Promise<{id:string}>}){
  const u=await currentUser();
  if(!u||u.role!=="DOCTOR"||!u.doctorProfile)redirect('/login');
  const {id}=await params;
  const now=new Date();
  const [patient,consent,reportShare,summaryShare]=await Promise.all([
    prisma.user.findUnique({where:{id},select:{name:true}}),
    prisma.healthShareConsent.findUnique({where:{patientId_doctorId:{patientId:id,doctorId:u.doctorProfile.id}}}),
    prisma.healthReportShare.findFirst({where:{patientId:id,doctorId:u.doctorProfile.id,status:"active",OR:[{expiresAt:null},{expiresAt:{gt:now}}]},orderBy:{createdAt:"desc"}}),
    prisma.healthSummaryShare.findFirst({where:{patientId:id,doctorId:u.doctorProfile.id,status:"active",OR:[{expiresAt:null},{expiresAt:{gt:now}}]},orderBy:{createdAt:"desc"}})
  ]);
  const activeConsent=consent?.status==="active"?consent:null;
  if(!activeConsent&&!reportShare&&!summaryShare)return <div className="page"><div className="page-title"><span className="kicker">Hasta kaydı</span><h1>{patient?.name||'Hasta'}</h1><p>Bu hasta sağlık verilerine veya rapor trendlerine henüz erişim izni vermedi.</p></div><a className="secondary" href="/doctor">Uzman paneline dön</a></div>;
  const scopes=activeConsent?.scopes||[];
  const summarySections=summaryShare?.sections||[];const sharedProfileIds=summaryShare?.profileIds||[];
  const [m,l,d,summaryAllergies,summaryConditions,summaryMeds,summaryVaccines,summaryProcedures,summaryProfiles,summaryBp,summaryGlucose]=await Promise.all([
    scopes.includes('measurements')?prisma.healthEntry.findMany({where:{userId:id},orderBy:{measuredAt:'desc'},take:20}):[],
    scopes.includes('labs')?prisma.labResult.findMany({where:{userId:id},orderBy:{measuredAt:'desc'},take:20}):[],
    scopes.includes('documents')?prisma.healthDocument.findMany({where:{userId:id},orderBy:{createdAt:'desc'},take:20}):[],
    summarySections.includes('allergies')?prisma.allergyRecord.findMany({where:{userId:id,isActive:true},orderBy:{createdAt:'desc'}}):[],
    summarySections.includes('conditions')?prisma.medicalCondition.findMany({where:{userId:id,status:'active'},orderBy:{createdAt:'desc'}}):[],
    summarySections.includes('medications')?prisma.medication.findMany({where:{userId:id,isActive:true},orderBy:{createdAt:'desc'}}):[],
    summarySections.includes('vaccinations')?prisma.vaccinationRecord.findMany({where:{userId:id},orderBy:{administeredAt:'desc'},take:12}):[],
    summarySections.includes('procedures')?prisma.procedureHistory.findMany({where:{userId:id},orderBy:{performedAt:'desc'},take:12}):[],
    summarySections.includes('profiles')?prisma.specialHealthProfile.findMany({where:{userId:id,isActive:true,...(sharedProfileIds.length?{id:{in:sharedProfileIds}}:{id:{in:[]}})},orderBy:{createdAt:'desc'}}):[],
    summarySections.includes('measurements')?prisma.bloodPressureReading.findFirst({where:{userId:id},orderBy:{measuredAt:'desc'}}):null,
    summarySections.includes('measurements')?prisma.glucoseReading.findFirst({where:{userId:id},orderBy:{measuredAt:'desc'}}):null
  ]);
  return <div className="page">
    <div className="page-title"><span className="kicker">İzinli sağlık kaydı</span><h1>{patient?.name}</h1><p>{activeConsent?`Sürekli izin kapsamları: ${scopes.join(', ')}`:reportShare?'Hasta belirli tarih aralığındaki sağlık raporunu seninle paylaştı.':'Hasta yalnızca seçilmiş Sağlık Özeti bölümlerini seninle paylaştı.'}</p></div>
    {summaryShare&&<section className="panel health-section"><h2>Paylaşılan Sağlık Özeti</h2><p>Hasta yalnızca şu özet bölümlerini paylaştı: {summarySections.join(', ')}</p><div className="dashboard-grid">{summarySections.includes('measurements')&&<div><h3>Son ölçümler</h3><p>{summaryBp?`Tansiyon ${summaryBp.systolic}/${summaryBp.diastolic} mmHg`:'Tansiyon kaydı yok'}</p><p>{summaryGlucose?`Kan şekeri ${summaryGlucose.value} ${summaryGlucose.unit}`:'Şeker kaydı yok'}</p></div>}{summarySections.includes('allergies')&&<div><h3>Alerjiler</h3>{summaryAllergies.map((x:any)=><p key={x.id}>{x.allergen}{x.reaction?` · ${x.reaction}`:''}</p>)}</div>}{summarySections.includes('conditions')&&<div><h3>Aktif durumlar</h3>{summaryConditions.map((x:any)=><p key={x.id}>{x.name}</p>)}</div>}{summarySections.includes('medications')&&<div><h3>İlaçlar</h3>{summaryMeds.map((x:any)=><p key={x.id}>{x.name} · {x.dose}</p>)}</div>}{summarySections.includes('vaccinations')&&<div><h3>Aşılar</h3>{summaryVaccines.map((x:any)=><p key={x.id}>{x.vaccineName} · {new Date(x.administeredAt).toLocaleDateString('tr-TR')}</p>)}</div>}{summarySections.includes('procedures')&&<div><h3>İşlemler</h3>{summaryProcedures.map((x:any)=><p key={x.id}>{x.procedureName}</p>)}</div>}{summarySections.includes('profiles')&&<div><h3>Paylaşılan aile profilleri</h3>{summaryProfiles.map((x:any)=><p key={x.id}>{x.type==='CHILD'?'Çocuk':'Gebelik'} · {x.name}</p>)}{!summaryProfiles.length&&<p>Profil seçilmemiş.</p>}</div>}</div></section>}
    {activeConsent&&<div className="dashboard-grid"><section className="panel"><h2>Ölçümler</h2>{m.map(x=><div className="share-row" key={x.id}><b>{x.type}</b><span>{x.value} {x.unit}</span></div>)}</section><section className="panel"><h2>Laboratuvar</h2>{l.map(x=><div className="share-row" key={x.id}><b>{x.testName}</b><span>{x.value} {x.unit||''}</span></div>)}</section><section className="panel"><h2>Belgeler</h2>{d.map(x=><div className="share-row" key={x.id}><b>{x.title}</b><span>{x.fileName}</span></div>)}</section></div>}
    {(activeConsent||reportShare)&&<DoctorPatientTrends patientId={id}/>}
    {(activeConsent||reportShare)&&<><HealthGoals patientId={id}/><DoctorLabReview patientId={id}/><ImagingCenter patientId={id} doctorMode/><DiagnosticRequests patientId={id} doctorMode/><ClinicalQuestions patientId={id} doctorMode/><DoctorPatientNotes patientId={id}/></>}
  </div>
}
