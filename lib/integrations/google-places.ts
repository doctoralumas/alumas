export type GoogleHealthPlaceType = "hospital"|"doctor"|"pharmacy";

export type GoogleNearbyPlace = {
  id:string;
  displayName:string;
  formattedAddress?:string|null;
  latitude?:number|null;
  longitude?:number|null;
  rating?:number|null;
  userRatingCount?:number|null;
  businessStatus?:string|null;
  openNow?:boolean|null;
  nextOpenTime?:string|null;
  nextCloseTime?:string|null;
  googleMapsUri?:string|null;
  primaryType?:string|null;
};

const TYPE_MAP:Record<GoogleHealthPlaceType,string[]>={
  hospital:["hospital"],
  doctor:["doctor"],
  pharmacy:["pharmacy"]
};

export async function searchNearbyHealthPlaces(args:{
  lat:number; lng:number; type:GoogleHealthPlaceType;
  radiusMeters?:number; maxResultCount?:number;
}):Promise<GoogleNearbyPlace[]>{
  const apiKey=process.env.GOOGLE_PLACES_API_KEY;
  if(!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not configured.");

  const radius=Math.min(50000,Math.max(100,Math.round(args.radiusMeters??10000)));
  const maxResultCount=Math.min(20,Math.max(1,Math.round(args.maxResultCount??10)));

  const fieldMask=[
    "places.id","places.displayName","places.formattedAddress",
    "places.location","places.rating","places.userRatingCount",
    "places.businessStatus","places.currentOpeningHours",
    "places.googleMapsUri","places.primaryType"
  ].join(",");

  const res=await fetch("https://places.googleapis.com/v1/places:searchNearby",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "X-Goog-Api-Key":apiKey,
      "X-Goog-FieldMask":fieldMask
    },
    body:JSON.stringify({
      includedTypes:TYPE_MAP[args.type],
      maxResultCount,
      rankPreference:"DISTANCE",
      languageCode:"tr",
      regionCode:"TR",
      locationRestriction:{
        circle:{center:{latitude:args.lat,longitude:args.lng},radius}
      }
    }),
    cache:"no-store"
  });

  if(!res.ok){
    const text=await res.text();
    throw new Error(`Google Places ${res.status}: ${text.slice(0,500)}`);
  }

  const body=await res.json();
  return (body.places??[]).map((p:any)=>({
    id:p.id,
    displayName:p.displayName?.text ?? "İsimsiz sağlık kuruluşu",
    formattedAddress:p.formattedAddress ?? null,
    latitude:p.location?.latitude ?? null,
    longitude:p.location?.longitude ?? null,
    rating:p.rating ?? null,
    userRatingCount:p.userRatingCount ?? null,
    businessStatus:p.businessStatus ?? null,
    openNow:p.currentOpeningHours?.openNow ?? null,
    nextOpenTime:p.currentOpeningHours?.nextOpenTime ?? null,
    nextCloseTime:p.currentOpeningHours?.nextCloseTime ?? null,
    googleMapsUri:p.googleMapsUri ?? null,
    primaryType:p.primaryType ?? null
  }));
}
