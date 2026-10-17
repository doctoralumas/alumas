import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import DoctorPatientTrends from "@/components/doctor-patient-trends";
import DoctorPatientNotes from "@/components/doctor-patient-notes";
import HealthGoals from "@/components/health-goals";
import DoctorLabReview from "@/components/doctor-lab-review";
import ImagingCenter from "@/components/imaging-center";
import DiagnosticRequests from "@/components/diagnostic-requests";
import { getTranslations, getLocale } from "next-intl/server";

export default async function Page({params}:{params:Promise<{id:string}>}){
  const u=await currentUser();
  if(!u||u.role!=="DOCTOR"||!u.doctorProfile)redirect('/login');
  const t = await getTranslations('professional.doctorPatientDetail');
  const locale = await getLocale();
  const dateLocale = locale === 'en' ? 'en-US' : 'tr-TR';
  const {id}=await params;
  const now=new Date();
  const [patient,consent,reportShare,summaryShare]=await Promise.all([
    prisma.user.findUnique({where:{id},select:{name:true}}),
    prisma.healthShareConsent.findUnique({where:{patientId_doctorId:{patientId:id,doctorId:u.doctorProfile.id}}}),
    prisma.healthReportShare.findFirst({where:{patientId:id,doctorId:u.doctorProfile.id,status:"active",OR:[{expiresAt:null},{expiresAt:{gt:now}}]},orderBy:{createdAt:"desc"}}),
    prisma.healthSummaryShare.findFirst({where:{patientId:id,doctorId:u.doctorProfile.id,status:"active",OR:[{expiresAt:null},{expiresAt:{gt:now}}]},orderBy:{createdAt:"desc"}})
  ]);
  const activeConsent=consent?.status==="active"?consent:null;
  if(!activeConsent&&!reportShare&&!summaryShare)return (
    <div className="page workspace">
      <div className="page-title">
        <span className="kicker">{t('noConsentKicker')}</span>
        <h1>{patient?.name||t('defaultPatient')}</h1>
        <p>{t('noConsentDesc')}</p>
      </div>
      <a className="secondary" href="/doctor">{t('backToDoctor')}</a>
    </div>
  );
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
  return (
    <div className="page workspace">
      <div className="page-title">
        <span className="kicker">{t('kicker')}</span>
        <h1>{patient?.name}</h1>
        <p>{activeConsent?t('consentScopesDesc', { scopes: scopes.join(', ') }):reportShare?t('reportShareDesc'):t('summaryShareDesc')}</p>
      </div>
      {summaryShare&&<section className="panel health-section">
        <h2>{t('sharedSummaryTitle')}</h2>
        <p>{t('sharedSummarySubtitle', { sections: summarySections.join(', ') })}</p>
        <div className="dashboard-grid">
          {summarySections.includes('measurements')&&<div>
            <h3>{t('recentMeasurements')}</h3>
            <p>{summaryBp?t('bpDisplay', { systolic: summaryBp.systolic, diastolic: summaryBp.diastolic }):t('noBp')}</p>
            <p>{summaryGlucose?t('glucoseDisplay', { val: summaryGlucose.value, unit: summaryGlucose.unit }):t('noGlucose')}</p>
          </div>}
          {summarySections.includes('allergies')&&<div>
            <h3>{t('allergiesTitle')}</h3>
            {summaryAllergies.map((x:any)=><p key={x.id}>{x.allergen}{x.reaction?` — ${x.reaction}`:''}</p>)}
          </div>}
          {summarySections.includes('conditions')&&<div>
            <h3>{t('conditionsTitle')}</h3>
            {summaryConditions.map((x:any)=><p key={x.id}>{x.name}</p>)}
          </div>}
          {summarySections.includes('medications')&&<div>
            <h3>{t('medicationsTitle')}</h3>
            {summaryMeds.map((x:any)=><p key={x.id}>{x.name} — {x.dose}</p>)}
          </div>}
          {summarySections.includes('vaccinations')&&<div>
            <h3>{t('vaccinationsTitle')}</h3>
            {summaryVaccines.map((x:any)=><p key={x.id}>{x.vaccineName} — {new Date(x.administeredAt).toLocaleDateString(dateLocale)}</p>)}
          </div>}
          {summarySections.includes('procedures')&&<div>
            <h3>{t('proceduresTitle')}</h3>
            {summaryProcedures.map((x:any)=><p key={x.id}>{x.procedureName}</p>)}
          </div>}
          {summarySections.includes('profiles')&&<div>
            <h3>{t('sharedProfilesTitle')}</h3>
            {summaryProfiles.map((x:any)=><p key={x.id}>{x.type==='CHILD'?t('profileChild', { name: x.name }):t('profilePregnancy', { name: x.name })}</p>)}
            {!summaryProfiles.length&&<p>{t('noProfilesSelected')}</p>}
          </div>}
        </div>
      </section>}
      {activeConsent&&<div className="dashboard-grid">
        <section className="panel">
          <h2>{t('measurementsTitle')}</h2>
          {m.map(x=><div className="share-row" key={x.id}><b>{x.type}</b><span>{x.value} {x.unit}</span></div>)}
        </section>
        <section className="panel">
          <h2>{t('labTitle')}</h2>
          {l.map(x=><div className="share-row" key={x.id}><b>{x.testName}</b><span>{x.value} {x.unit||''}</span></div>)}
        </section>
        <section className="panel">
          <h2>{t('documentsTitle')}</h2>
          {d.map(x=><div className="share-row" key={x.id}><b>{x.title}</b><span>{x.fileName}</span></div>)}
        </section>
      </div>}
      {(activeConsent||reportShare)&&<DoctorPatientTrends patientId={id}/>}
      {(activeConsent||reportShare)&&<><HealthGoals patientId={id}/><DoctorLabReview patientId={id}/><ImagingCenter patientId={id} doctorMode/><DiagnosticRequests patientId={id} doctorMode/><DoctorPatientNotes patientId={id}/></>}
    </div>
  );
}
