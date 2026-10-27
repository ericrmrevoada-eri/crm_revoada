import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const esqueciSenhaSchema = z.object({
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
});
export type EsqueciSenhaInput = z.infer<typeof esqueciSenhaSchema>;

// Espelha a política de senha do Supabase Auth do projeto hospedado
// (Authentication > Policies): mínimo 8 e ao menos uma minúscula, uma
// maiúscula, um número e um símbolo. Se só o app validasse 8 caracteres, a
// senha passaria aqui e seria recusada pelo Supabase com um erro genérico.
export const DICA_SENHA =
  "Mínimo 8 caracteres, com letra maiúscula, minúscula, número e símbolo (ex: !@#$%).";

const senhaForte = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[a-z]/, "A senha precisa ter ao menos uma letra minúscula")
  .regex(/[A-Z]/, "A senha precisa ter ao menos uma letra maiúscula")
  .regex(/[0-9]/, "A senha precisa ter ao menos um número")
  .regex(
    /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/,
    "A senha precisa ter ao menos um símbolo (ex: !@#$%)",
  );

export const redefinirSenhaSchema = z
  .object({
    password: senhaForte,
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });
export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>;

export const novoVendedorSchema = z.object({
  nomeCompleto: z.string().min(3, "Informe o nome completo"),
  telefone: z.string().optional(),
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
  password: senhaForte,
});
export type NovoVendedorInput = z.infer<typeof novoVendedorSchema>;
