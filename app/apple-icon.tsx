import { ImageResponse } from "next/og";

// Apple ignora o manifest.webmanifest para "Adicionar à Tela de Início" — só
// esse arquivo (convenção do Next, auto-injeta <link rel="apple-touch-icon">)
// resolve isso no iOS. iOS aplica sua própria máscara/arredondamento, então
// aqui fica quadrado e sem transparência (recomendação da Apple).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        <div style={{ fontSize: 104, fontWeight: 700, color: "#ec4899" }}>R</div>
      </div>
    ),
    size,
  );
}
