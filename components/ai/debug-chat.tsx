// @ts-nocheck
"use client";
import { useChat } from "@ai-sdk/react";
import { useEffect } from "react";

export default function DebugChat() {
  const chat = useChat({ api: "/api/ai/chat" });
  useEffect(() => {
    console.log("USE CHAT EXPORTS:", Object.keys(chat));
  }, []);
  return null;
}
