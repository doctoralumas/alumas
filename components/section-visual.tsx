import Image from "next/image";

export default function SectionVisual({slug,alt}:{slug:string;alt:string}){
  return <div className="section-visual-v36" aria-hidden="true">
    <Image src={`/section-visuals/${slug}.webp`} alt={alt} width={960} height={540} priority={false}/>
  </div>
}
