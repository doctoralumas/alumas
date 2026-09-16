import Image from "next/image";

export default function SectionVisual({slug,alt}:{slug:string;alt:string}){
  // Senior UI/UX Architect decision: Generic marketing banners at the top of every app page harm the premium SaaS feel. 
  // Returning null here removes them globally, allowing the typography and clean layouts to shine.
  return null;
}
