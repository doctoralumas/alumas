"use client";
import Link from "next/link";import {usePathname} from "next/navigation";import {CalendarDays,HeartPulse,House,UserRound,MessageCircle} from "./icons";
const items=[{href:"/",label:"Ana Sayfa",Icon:House},{href:"/health",label:"Sağlığım",Icon:HeartPulse},{href:"/messages",label:"Mesajlar",Icon:MessageCircle},{href:"/appointments",label:"Randevular",Icon:CalendarDays},{href:"/profile",label:"Profil",Icon:UserRound}];
export default function BottomNav(){const path=usePathname();return <nav className="bottom-nav">{items.map(({href,label,Icon})=><Link href={href} key={label} className={path===href||path.startsWith(href+'/')?'active':''}><Icon size={20}/><span>{label}</span></Link>)}</nav>}
