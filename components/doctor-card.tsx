import Link from "next/link";
import { Star, Clock3, ChevronRight } from "./icons";
import type { doctors } from "@/lib/demo-data";
type Doctor = (typeof doctors)[number];
export default function DoctorCard({doctor}:{doctor:Doctor}){return <Link className="doctor-card" href={`/doctors/${doctor.id}`}><div className="avatar">{doctor.initials}</div><div className="doctor-copy"><div className="row between"><div><b>{doctor.title} {doctor.name.replace(/^Dr\. /,"")}</b><p>{doctor.specialty}</p></div><ChevronRight size={20}/></div><div className="meta"><span><Star size={15} fill="currentColor"/> {doctor.rating} ({doctor.reviewCount})</span><span><Clock3 size={15}/> {doctor.nextSlot}</span></div></div></Link>}
