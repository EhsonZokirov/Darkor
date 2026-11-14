import { useEffect, useState } from "react";
import { CHARACTERS } from "../characters";
import { loadFace, quickFace } from "../faces";

// Лица всех персонажей: сразу мультяшные, потом заменяются на фото, если оно есть.
export function useFaces() {
  const [faces, setFaces] = useState(() => {
    const first = {};
    for (const c of CHARACTERS) first[c.id] = { canvas: quickFace(c), source: "cartoon", url: "" };
    return first;
  });

  useEffect(() => {
    let alive = true;
    CHARACTERS.forEach((c) => {
      loadFace(c).then((f) => {
        if (!alive) return;
        setFaces((prev) => ({ ...prev, [c.id]: { canvas: f.canvas, source: f.source, url: f.canvas.toDataURL("image/jpeg", 0.85) } }));
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  return faces;
}
