import { useState } from "react";
import { sendForm } from "../lib/submit";

// status: "idle" | "sending" | "done" | "error"
export function useFormSubmit() {
  const [status, setStatus] = useState("idle");
  const [via, setVia] = useState("");

  async function submit(subject, fields, remote) {
    setStatus("sending");
    const result = await sendForm(subject, fields, remote);
    setVia(result.via);
    setStatus(result.ok ? "done" : "error");
    return result.ok;
  }

  function reset() {
    setStatus("idle");
    setVia("");
  }

  return { status, via, submit, reset };
}
