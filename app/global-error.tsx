"use client";

// Rede de segurança de último caso: dispara só se o próprio root layout falhar
// ao renderizar. Next não injeta globals.css/Tailwind aqui, então o estilo é
// inline puro — ainda assim precisa parecer com o resto do app (fundo escuro,
// gradiente neon da marca), nunca a tela de erro branca padrão.
export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "0.02em" }}>
          Algo deu errado
        </p>
        <p style={{ color: "#a3a3a3", maxWidth: "28rem" }}>
          Não conseguimos carregar o sistema agora. Tente novamente em instantes.
        </p>
        <button
          onClick={() => unstable_retry()}
          style={{
            marginTop: "0.5rem",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "linear-gradient(90deg, #a21caf, #ec4899, #f97316)",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
