import { createElement } from "react";
import { ImageResponse } from "next/og";

// Ícone PNG 512x512 pro array `icons` do manifest.webmanifest — mesmo motivo
// do pwa-icon-192/route.ts (tamanho maior exigido/recomendado pelo Chrome).
const SIZE = 512;

// Nunca muda entre requisições — cacheável/prerenderizável como o resto dos
// ícones (icon.svg, apple-icon), em vez de recalcular a cada request.
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: Math.round(SIZE * 0.1875),
        },
      },
      createElement(
        "div",
        { style: { fontSize: Math.round(SIZE * 0.58), fontWeight: 700, color: "#ec4899" } },
        "R",
      ),
    ),
    { width: SIZE, height: SIZE },
  );
}
