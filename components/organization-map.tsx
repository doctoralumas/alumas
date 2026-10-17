'use client';
import InteractiveOrganizationMap from '@/components/interactive-organization-map';
import { useTranslations } from 'next-intl';

export default function OrganizationMap({lat,lng,name,address}:{lat?:number|null;lng?:number|null;name:string;address:string}){
  const t = useTranslations("organizationMap");
  if(lat==null||lng==null)return <div className="map-placeholder"><b>{t("mapPlaceholder")}</b><span>{address}</span></div>;
  const token=process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const directions=`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  return <div className="organization-map-wrap"><InteractiveOrganizationMap token={token} rows={[{id:name,slug:'',name,type:'ORGANIZATION',latitude:lat,longitude:lng}]}/><a className="primary compact map-directions" href={directions} target="_blank" rel="noreferrer">{t("directions")}</a></div>;
}
