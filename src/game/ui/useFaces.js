import { useEffect, useState } from "react";
import { CHARACTERS } from "../characters";
import { loadFace, quickFace } from "../faces";
import { loadSprite } from "../sprites";

// Лица и готовые спрайты всех персонажей: сразу мультяшные, потом заменяются на фото, если оно есть.
export function useFaces() {
  const [faces, setFaces] = useState(() => {
    const first = {};
    for (const c of CHARACTERS) first[c.id] = { canvas: quickFace(c), source: "cartoon", url: "", sprite: null };
    return first;
  });

  useEffect(() => {
    let alive = true;
    CHARACTERS.forEach((c) => {
      loadFace(c).then((f) => {
        if (!alive) return;
        setFaces((prev) => ({ ...prev, [c.id]: { ...prev[c.id], canvas: f.canvas, source: f.source, url: f.canvas.toDataURL("image/jpeg", 0.85) } }));
      });
      loadSprite(c).then((sprite) => {
        if (alive && sprite) setFaces((prev) => ({ ...prev, [c.id]: { ...prev[c.id], sprite } }));
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  return faces;
}
