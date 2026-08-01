"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Settings, Trash2 } from "lucide-react";
import { criarCategoria, excluirCategoria, type Categoria } from "@/actions/categorias";
import { criarFornecedor, excluirFornecedor, type Fornecedor } from "@/actions/fornecedores";
import {
  categoriaSchema,
  fornecedorSchema,
  type CategoriaInput,
  type FornecedorInput,
} from "@/lib/validations/estoque";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function ListaComExclusao<T extends { id: string; nome: string }>({
  itens,
  onExcluir,
  pendingId,
}: {
  itens: T[];
  onExcluir: (id: string) => void;
  pendingId: string | null;
}) {
  if (itens.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum cadastro ainda.</p>;
  }
  return (
    <ul className="space-y-1">
      {itens.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
        >
          {item.nome}
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={pendingId === item.id}
            onClick={() => onExcluir(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}

export function CategoriaFornecedorManager({
  categorias,
  fornecedores,
}: {
  categorias: Categoria[];
  fornecedores: Fornecedor[];
}) {
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const categoriaForm = useForm<CategoriaInput>({ resolver: zodResolver(categoriaSchema) });
  const fornecedorForm = useForm<FornecedorInput>({ resolver: zodResolver(fornecedorSchema) });

  async function onNovaCategoria(values: CategoriaInput) {
    const result = await criarCategoria(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Categoria criada");
    categoriaForm.reset();
  }

  async function onNovoFornecedor(values: FornecedorInput) {
    const result = await criarFornecedor(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Fornecedor criado");
    fornecedorForm.reset();
  }

  function removerCategoria(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const result = await excluirCategoria(id);
      if (result?.error) toast.error(result.error);
      setPendingId(null);
    });
  }

  function removerFornecedor(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const result = await excluirFornecedor(id);
      if (result?.error) toast.error(result.error);
      setPendingId(null);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-11">
          <Settings className="mr-2 h-4 w-4" />
          Categorias e fornecedores
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Categorias e fornecedores</DialogTitle>
          <DialogDescription>
            Usados no cadastro de produtos. Só é possível excluir quem não tem
            produto vinculado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide">
            Categorias
          </h3>
          <ListaComExclusao itens={categorias} onExcluir={removerCategoria} pendingId={pendingId} />
          <form
            onSubmit={categoriaForm.handleSubmit(onNovaCategoria)}
            className="flex gap-2"
            noValidate
          >
            <Input placeholder="Nova categoria" {...categoriaForm.register("nome")} />
            <Button type="submit" disabled={categoriaForm.formState.isSubmitting}>
              Adicionar
            </Button>
          </form>
          {categoriaForm.formState.errors.nome && (
            <p className="text-sm text-destructive">
              {categoriaForm.formState.errors.nome.message}
            </p>
          )}
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide">
            Fornecedores
          </h3>
          <ListaComExclusao itens={fornecedores} onExcluir={removerFornecedor} pendingId={pendingId} />
          <form
            onSubmit={fornecedorForm.handleSubmit(onNovoFornecedor)}
            className="space-y-2"
            noValidate
          >
            <div className="flex gap-2">
              <Input placeholder="Nome do fornecedor" {...fornecedorForm.register("nome")} />
              <Button type="submit" disabled={fornecedorForm.formState.isSubmitting}>
                Adicionar
              </Button>
            </div>
            <Label htmlFor="telefone-fornecedor" className="sr-only">
              Telefone
            </Label>
            <Input
              id="telefone-fornecedor"
              placeholder="Telefone (opcional)"
              {...fornecedorForm.register("telefone")}
            />
          </form>
          {fornecedorForm.formState.errors.nome && (
            <p className="text-sm text-destructive">
              {fornecedorForm.formState.errors.nome.message}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
