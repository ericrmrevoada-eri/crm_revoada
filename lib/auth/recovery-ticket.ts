// Nome e validade do cookie que marca uma sessão como originada de um link de
// recuperação de senha (achado F4 da auditoria). Compartilhado entre
// app/auth/confirm/route.ts (quem grava), actions/auth.ts (quem exige e
// consome) e proxy.ts (quem gate-keeps a rota /redefinir-senha), para as três
// pontas nunca divergirem sobre o nome do cookie.
export const RECOVERY_TICKET_COOKIE = "pwd_reset_ticket";

// 10 minutos: tempo de sobra pra digitar a senha nova, curto o bastante pra
// não virar uma segunda sessão de longa duração.
export const RECOVERY_TICKET_MAX_AGE = 60 * 10;
