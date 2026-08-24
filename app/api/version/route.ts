import {NextResponse} from "next/server";
import {appVersion,buildSha,releaseChannel,maintenanceEnabled} from "@/lib/release-config";
export async function GET(){return NextResponse.json({service:"alumas",version:appVersion(),buildSha:buildSha(),channel:releaseChannel(),maintenance:maintenanceEnabled(),time:new Date().toISOString()},{headers:{"cache-control":"no-store"}})}
