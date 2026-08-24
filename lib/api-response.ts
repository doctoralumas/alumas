import { inc } from "./metrics";
import { NextResponse } from "next/server";
export type ApiErrorCode = "VALIDATION_ERROR"|"AUTH_REQUIRED"|"FORBIDDEN"|"NOT_FOUND"|"CONFLICT"|"RATE_LIMITED"|"UNSUPPORTED_MEDIA"|"PAYLOAD_TOO_LARGE"|"INTERNAL_ERROR"|"INVALID_CREDENTIALS"|"SLOT_UNAVAILABLE";
export function apiError(message:string,status=400,code:ApiErrorCode="VALIDATION_ERROR",details?:unknown){return NextResponse.json({ok:false,error:message,code,...(details===undefined?{}:{details})},{status})}
export function apiOk<T>(data:T,status=200){return NextResponse.json({ok:true,data},{status})}
