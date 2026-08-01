"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ImageOff, ImageUp, Plus, Trash2 } from "lucide-react";
import {
  listarVariacoes,
  criarVariacao,
  excluirVariacao,
  atualizarFotoVariacao,
  type Variacao,
} from "@/actions/variacoes";
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

// Só o necessário para o cabeçalho do diálogo e o formulário de entrada — não
// os campos agregados (categoria, total de variações etc.) que só existem
// depois que a lista de produtos é recarregada do servidor.
type ProdutoResumo = { id: string; nome: string };

// Botão que troca só a foto de uma variação já existente — sem diálogo
// próprio, o clique já abre o seletor de arquivo do sistema e envia direto.
function TrocarFotoButton({ variacaoId, onSuccess }: { variacaoId: string; onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();
  const inputId = `trocar-foto-${variacaoId}`;

  function aoSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const foto = e.target.files?.[0];
    e.target.value = "";
    if (!foto) return;
    startTransition(async () => {
      const result = await atualizarFotoVariacao(variacaoId, foto);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Foto atualizada");
        onSuccess();
      }
    });
  }

  return (
    <>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={aoSelecionar}
        disabled={isPending}
      />
      <Button
        size="icon-sm"
        variant="outline"
        disabled={isPending}
        title="Trocar foto desta variação"
        asChild
      >
        <label htmlFor={inputId} className="cursor-pointer">
          <ImageUp className="h-4 w-4" />
        </label>
      </Button>
    </>
  );
}

export function VariacoesDialog({
  produto,
  fornecedores,
  abrirAoMontar = false,
  semGatilho = false,
  aoFechar,
}: {
  produto: ProdutoResumo;
  fornecedores: Fornecedor[];
  // Usados para abrir o diálogo direto depois de cadastrar um produto novo,
  // sem precisar caçar o botão "Variações" na tabela.
  abrirAoMontar?: boolean;
  semGatilho?: boolean;
  aoFechar?: () => void;
}) {
  // Estado inicial já nasce aberto/carregando quando chamado logo após criar
  // um produto — evita um setState síncrono dentro de efeito só para isso.
  const [open, setOpen] = useState(abrirAoMontar);
  const [variacoes, setVariacoes] = useState<Variacao[]>([]);
  const [loading, setLoading] = useState(abrirAoMontar);
  const [novaFoto, setNovaFoto] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  async function carregar() {
    setLoading(true);
    const data = await listarVariacoes(produto.id);
    setVariacoes(data);
    setLoading(false);
  }

  useEffect(() => {
    // setState roda dentro do callback do .then, não direto no corpo do
    // efeito — busca de dados é exatamente o caso de uso que useEffect existe
    // para resolver, então isso não é o padrão que a regra quer evitar.
    if (abrirAoMontar) {
      listarVariacoes(produto.id).then((data) => {
        setVariacoes(data);
        setLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VariacaoInput>({ resolver: zodResolver(variacaoSchema) });

  async function onSubmitNovaVariacao(values: VariacaoInput) {
    const result = await criarVariacao(produto.id, values, novaFoto);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Variação criada");
    reset();
    setNovaFoto(null);
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) carregar();
        if (!next) aoFechar?.();
      }}
    >
      {!semGatilho && (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            Variações
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Variações — {produto.nome}</DialogTitle>
          <DialogDescription>
            Tamanho × cor, quantidade em estoque, estoque mínimo e foto — cada
            variação pode ter uma foto própria; sem foto, o PDV usa a do
            produto.
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
                  <TableHead className="w-12"></TableHead>
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
                    <TableCell>
                      {v.foto_url ? (
                        <Image
                          src={v.foto_url}
                          alt={`${produto.nome} ${v.tamanho}/${v.cor}`}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                          <ImageOff className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
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
                        <TrocarFotoButton variacaoId={v.id} onSuccess={carregar} />
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
          className="grid grid-cols-2 gap-3 rounded-lg border border-dashed border-border p-3 sm:grid-cols-6"
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
          <div className="space-y-1">
            <Label htmlFor="novaFoto">Foto</Label>
            <Input
              id="novaFoto"
              type="file"
              accept="image/*"
              onChange={(e) => setNovaFoto(e.target.files?.[0] ?? null)}
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
