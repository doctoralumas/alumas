import { NextResponse } from "next/server";
import { reverseGeocodeAddress } from "@/lib/maps";

export async function POST(req: Request) {
  try {
    const { lat, lng } = await req.json();
    if (!lat || !lng) {
      return NextResponse.json({ error: 'Lat and lng are required' }, { status: 400 });
    }
    const addressName = await reverseGeocodeAddress(Number(lat), Number(lng));
    if (!addressName) {
      return NextResponse.json({ error: 'Adres bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({ address: addressName });
  } catch (error) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
