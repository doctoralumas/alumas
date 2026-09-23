"use client";import {useState} from "react";import {useRouter} from "next/navigation";
import { DocumentUploadFields } from "@/components/verification-document-fields";
const ORG_TYPES=["HOSPITAL","CLINIC","PHARMACY","IMAGING_CENTER","LABORATORY"] as const;
export default function BusinessApplicationForm({initialType}:{initialType?:string}){const start=ORG_TYPES.includes(String(initialType||"").toUpperCase() as typeof ORG_TYPES[number])?String(initialType).toUpperCase():"CLINIC";const [type,setType]=useState(start),[msg,setMsg]=useState("");const router=useRouter();async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=e.currentTarget;const tooLarge=[...f.querySelectorAll('input[type="file"]')].some((input)=>(input as HTMLInputElement).files?.[0]&&(input as HTMLInputElement).files![0].size>4.5*1024*1024);if(tooLarge){setMsg('Dosya boyutu çok büyük (Maksimum 4.5 MB yüklenebilir).');return}setMsg("Gönderiliyor...");try{const r=await fetch("/api/organizations",{method:"POST",body:new FormData(f)});if(r.status===413){setMsg('Dosya boyutu çok büyük (Vercel sınırı 4.5 MB).');return}if(!r.ok){const t=await r.text();try{const j=JSON.parse(t);setMsg(j.error||"Başvuru gönderilemedi")}catch{setMsg(`Sunucu hatası (${r.status})`)}return}await r.json();setMsg("Başvurunuz alındı. Admin incelemesine gönderildi.");setTimeout(()=>router.push("/business"),700)}catch(err:any){setMsg(err.message||'Bir hata oluştu.')}}
const Req = () => <span style={{color:'#ef4444', marginLeft:'4px', fontWeight:'bold'}}>*</span>;
return <form className="business-form premium-form" onSubmit={submit} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
<div className="org-type-select" style={{marginBottom:'12px'}}>{[["HOSPITAL","Hastane"],["CLINIC","Klinik"],["PHARMACY","Eczane"],["IMAGING_CENTER","Görüntüleme"],["LABORATORY","Laboratuvar"]].map(x=><button type="button" className={type===x[0]?"selected":""} key={x[0]} onClick={()=>setType(x[0])}>{x[1]}</button>)}</div>
<input type="hidden" name="type" value={type}/>
<label><span style={{fontWeight:'500'}}>Kurum adı <Req/></span><input name="name" required placeholder="Örn: Alumas Görüntüleme Merkezi" style={{padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', marginTop:'6px'}}/></label>
<div className="form-pair" style={{display:'flex', gap:'16px'}}>
<label style={{flex:1}}><span style={{fontWeight:'500'}}>Şehir <Req/></span><input name="city" required placeholder="Örn: İstanbul" style={{padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', marginTop:'6px'}}/></label>
<label style={{flex:1}}><span style={{fontWeight:'500'}}>İlçe</span><input name="district" placeholder="Örn: Kadıköy" style={{padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', marginTop:'6px'}}/></label>
</div>
<label><span style={{fontWeight:'500'}}>Açık Adres <Req/></span><input name="address" required placeholder="Örn: Alumas Mahallesi, Sağlık Sokak, No:1" style={{padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', marginTop:'6px'}}/></label>
<div className="form-pair" style={{display:'flex', gap:'16px'}}>
<label style={{flex:1}}><span style={{fontWeight:'500'}}>Kurumsal Telefon <Req/></span><input name="phone" required placeholder="Örn: 0850 123 45 67" style={{padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', marginTop:'6px'}}/></label>
<label style={{flex:1}}><span style={{fontWeight:'500'}}>Kurumsal E-posta <Req/></span><input name="email" type="email" required placeholder="iletisim@alumas.com" style={{padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', marginTop:'6px'}}/></label>
</div>
<label><span style={{fontWeight:'500'}}>Web sitesi (İsteğe bağlı)</span><input name="website" placeholder="Örn: https://www.alumas.com" style={{padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', marginTop:'6px'}}/></label>
<label><span style={{fontWeight:'500'}}>Kurum Açıklaması</span><textarea name="description" rows={4} placeholder="Kurumunuz hakkında kısa bir bilgilendirme yazısı..." style={{padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', marginTop:'6px'}}/></label>
<DocumentUploadFields kind="organization" entityType={type}/>
{msg&&<div className="inline-message" style={{padding:'12px', borderRadius:'8px', background: msg.includes('Başvurunuz alındı') ? '#dcfce3' : '#fee2e2', color: msg.includes('Başvurunuz alındı') ? '#166534' : '#991b1b', fontWeight:'500'}}>{msg}</div>}
<button className="primary" type="submit" style={{padding:'14px', fontSize:'16px', fontWeight:'600', marginTop:'8px', borderRadius:'8px'}}>Başvuruyu gönder</button>
</form>}
