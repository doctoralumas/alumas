import {NextResponse} from "next/server";
import {appVersion,buildSha,releaseChannel,maintenanceEnabled,publicFeatureFlags} from "@/lib/release-config";
export async function GET(){return NextResponse.json({version:appVersion(),buildSha:buildSha(),channel:releaseChannel(),maintenance:maintenanceEnabled(),features:publicFeatureFlags()},{headers:{"cache-control":"no-store"}})}
