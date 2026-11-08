import { useState } from "react";
import { sendForm } from "../lib/submit";

const COOLDOWN_KEY = "darkor_last_send";
const COOLDOWN_SECONDS = 20;

// Сколько секунд осталось ждать до следующей отправки (0 — можно отправлять).
function secondsLeft() {
  try {
    const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    return Math.max(0, Math.ceil(COOLDOWN_SECONDS - (Date.now() - last) / 1000));
  } catch {
    return 0;
  }
}

function markSent() {
  try {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  } catch {
    // хранилище недоступно — защита по паузе просто не работает
  }
}

// status: "idle" | "sending" | "done" | "error"
//
// Защита от спама:
// - trap: значение скрытого поля-ловушки (его видят только боты);
//   если оно заполнено, заявка тихо «отправляется» в никуда;
// - waitSeconds: пауза между отправками, чтобы форму нельзя было спамить.
export function useFormSubmit() {
  const [status, setStatus] = useState("idle");
  const [via, setVia] = useState("");
  const [trap, setTrap] = useState("");
  const [waitSeconds, setWaitSeconds] = useState(0);

  async function submit(subject, fields, remote) {
    if (trap) {
      setVia("backend");
      setStatus("done");
      return true;
    }

    const wait = secondsLeft();
    if (wait > 0) {
      setWaitSeconds(wait);
      setStatus("error");
      return false;
    }

    setWaitSeconds(0);
    setStatus("sending");
    const result = await sendForm(subject, fields, remote);
    if (result.ok) markSent();
    setVia(result.via);
    setStatus(result.ok ? "done" : "error");
    return result.ok;
  }

  function reset() {
    setStatus("idle");
    setVia("");
    setWaitSeconds(0);
  }

  return { status, via, submit, reset, trap, setTrap, waitSeconds };
}
