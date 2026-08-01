"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { criarProduto, atualizarProduto, type Produto } from "@/actions/produtos";
import type { Categoria } from "@/actions/categorias";
import type { Fornecedor } from "@/actions/fornecedores";
import { produtoSchema, type ProdutoInput } from "@/lib/validations/estoque";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const SEM_VALOR = "__none__";

export function ProdutoForm({
  produto,
  categorias,
  fornecedores,
}: {
  produto?: Produto;
  categorias: Categoria[];
  fornecedores: Fornecedor[];
}) {
  const [open, setOpen] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const editando = !!produto;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProdutoInput>({
    resolver: zodResolver(produtoSchema),
    defaultValues: produto
      ? {
          nome: produto.nome,
          descricao: produto.descricao ?? "",
          categoriaId: produto.categoria_id ?? SEM_VALOR,
          fornecedorId: produto.fornecedor_id ?? SEM_VALOR,
          marca: produto.marca ?? "",
          precoCusto: String(produto.preco_custo),
          precoVenda: String(produto.preco_venda),
          ativo: produto.ativo,
        }
      : { ativo: true, categoriaId: SEM_VALOR, fornecedorId: SEM_VALOR },
  });

  async function onSubmit(values: ProdutoInput) {
    setServerError(null);
    const payload = {
      ...values,
      categoriaId: values.categoriaId === SEM_VALOR ? undefined : values.categoriaId,
      fornecedorId: values.fornecedorId === SEM_VALOR ? undefined : values.fornecedorId,
    };
    const result = editando
      ? await atualizarProduto(produto!.id, payload, foto)
      : await criarProduto(payload, foto);

    if (result?.error) {
      setServerError(result.error);
      return;
    }
    toast.success(editando ? "Produto atualizado" : "Produto cadastrado");
    reset();
    setFoto(null);
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset();
          setFoto(null);
          setServerError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        {editando ? (
          <Button size="sm" variant="outline">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="bg-gradient-neon h-11 text-white hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            Novo produto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar produto" : "Cadastrar produto"}</DialogTitle>
          <DialogDescription>
            As variações (tamanho/cor) são cadastradas depois, em &quot;Gerenciar
            variações&quot;.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" {...register("nome")} />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" rows={2} {...register("descricao")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Controller
                control={control}
                name="categoriaId"
                render={({ field }) => (
                  <Select value={field.value ?? SEM_VALOR} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SEM_VALOR}>Sem categoria</SelectItem>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Controller
                control={control}
                name="fornecedorId"
                render={({ field }) => (
                  <Select value={field.value ?? SEM_VALOR} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SEM_VALOR}>Sem fornecedor</SelectItem>
                      {fornecedores.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="marca">Marca</Label>
            <Input id="marca" placeholder="Nike, Adidas, Lacoste..." {...register("marca")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="precoCusto">Preço de custo</Label>
              <Input id="precoCusto" inputMode="decimal" placeholder="0,00" {...register("precoCusto")} />
              {errors.precoCusto && (
                <p className="text-sm text-destructive">{errors.precoCusto.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="precoVenda">Preço de venda</Label>
              <Input id="precoVenda" inputMode="decimal" placeholder="0,00" {...register("precoVenda")} />
              {errors.precoVenda && (
                <p className="text-sm text-destructive">{errors.precoVenda.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="foto">Foto do produto</Label>
            <Input
              id="foto"
              type="file"
              accept="image/*"
              onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="ativo">Produto ativo</Label>
            <Controller
              control={control}
              name="ativo"
              render={({ field }) => (
                <Switch id="ativo" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-neon text-white hover:opacity-90"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
