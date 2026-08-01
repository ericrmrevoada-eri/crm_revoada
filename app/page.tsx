import { redirect } from "next/navigation";

// O middleware já redireciona "/" para /dashboard ou /pdv conforme o papel do
// usuário logado (ou para /login se não houver sessão). Este fallback só é
// alcançado se, por algum motivo, o middleware não interceptar a rota.
export default function RootPage() {
  redirect("/login");
}
