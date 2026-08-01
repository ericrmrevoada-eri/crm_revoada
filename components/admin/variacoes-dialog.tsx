"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  listarVariacoes,
  criarVariacao,
  excluirVariacao,
  type Variacao,
} from "@/actions/variacoes";
import type { Produto } from "@/actions/produtos";
import type { Fornecedor } from "@/actions/fornecedores";
import { variacaoSchema, type VariacaoInput } from "@/lib/validations/estoque";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EntradaEstoqueForm } from "@/components/admin/entrada-estoque-form";

export function VariacoesDialog({
  produto,
  fornecedores,
}: {
  produto: Produto;
  fornecedores: Fornecedor[];
}) {
  const [open, setOpen] = useState(false);
  const [variacoes, setVariacoes] = useState<Variacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function carregar() {
    setLoading(true);
    const data = await listarVariacoes(produto.id);
    setVariacoes(data);
    setLoading(false);
  }

  useEffect(() => {
    if (open) carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VariacaoInput>({ resolver: zodResolver(variacaoSchema) });

  async function onSubmitNovaVariacao(values: VariacaoInput) {
    const result = await criarVariacao(produto.id, values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Variação criada");
    reset();
    carregar();
  }

  function excluir(id: string) {
    startTransition(async () => {
      const result = await excluirVariacao(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Variação excluída");
        carregar();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Variações
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Variações — {produto.nome}</DialogTitle>
          <DialogDescription>
            Tamanho × cor, quantidade em estoque e estoque mínimo.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : variacoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma variação cadastrada ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variacoes.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.tamanho}</TableCell>
                    <TableCell>{v.cor}</TableCell>
                    <TableCell className="text-right tabular-nums-tight">
                      <span className="inline-flex items-center gap-1">
                        {v.quantidade_estoque}
                        {v.quantidade_estoque <= v.estoque_minimo && (
                          <Badge variant="destructive">baixo</Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums-tight">
                      {v.estoque_minimo}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <EntradaEstoqueForm
                          variacao={v}
                          produtoNome={produto.nome}
                          fornecedores={fornecedores}
                          onSuccess={carregar}
                        />
                        <Button
                          size="icon-sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => excluir(v.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmitNovaVariacao)}
          className="grid grid-cols-2 gap-3 rounded-lg border border-dashed border-border p-3 sm:grid-cols-5"
          noValidate
        >
          <div className="space-y-1">
            <Label htmlFor="tamanho">Tamanho</Label>
            <Input id="tamanho" placeholder="M" {...register("tamanho")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cor">Cor</Label>
            <Input id="cor" placeholder="Preto" {...register("cor")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="quantidadeEstoque">Estoque</Label>
            <Input
              id="quantidadeEstoque"
              inputMode="numeric"
              placeholder="0"
              {...register("quantidadeEstoque")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="estoqueMinimo">Mínimo</Label>
            <Input
              id="estoqueMinimo"
              inputMode="numeric"
              placeholder="0"
              {...register("estoqueMinimo")}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {(errors.tamanho || errors.cor || errors.quantidadeEstoque || errors.estoqueMinimo) && (
            <p className="col-span-full text-sm text-destructive">
              {errors.tamanho?.message ||
                errors.cor?.message ||
                errors.quantidadeEstoque?.message ||
                errors.estoqueMinimo?.message}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
