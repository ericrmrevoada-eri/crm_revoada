export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      caixas: {
        Row: {
          created_at: string
          data_abertura: string
          data_fechamento: string | null
          id: string
          status: Database["public"]["Enums"]["status_caixa"]
          updated_at: string
          valor_abertura: number
          valor_fechamento_calculado: number | null
          valor_fechamento_informado: number | null
          vendedor_id: string
        }
        Insert: {
          created_at?: string
          data_abertura?: string
          data_fechamento?: string | null
          id?: string
          status?: Database["public"]["Enums"]["status_caixa"]
          updated_at?: string
          valor_abertura?: number
          valor_fechamento_calculado?: number | null
          valor_fechamento_informado?: number | null
          vendedor_id: string
        }
        Update: {
          created_at?: string
          data_abertura?: string
          data_fechamento?: string | null
          id?: string
          status?: Database["public"]["Enums"]["status_caixa"]
          updated_at?: string
          valor_abertura?: number
          valor_fechamento_calculado?: number | null
          valor_fechamento_informado?: number | null
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "caixas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      despesas: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_despesa"]
          created_at: string
          criado_por: string | null
          data: string
          descricao: string | null
          id: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_despesa"]
          created_at?: string
          criado_por?: string | null
          data?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_despesa"]
          created_at?: string
          criado_por?: string | null
          data?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entradas_estoque: {
        Row: {
          created_at: string
          criado_por: string | null
          data_entrada: string
          fornecedor_id: string | null
          id: string
          lote: string | null
          quantidade: number
          updated_at: string
          variacao_produto_id: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          data_entrada?: string
          fornecedor_id?: string | null
          id?: string
          lote?: string | null
          quantidade: number
          updated_at?: string
          variacao_produto_id: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          data_entrada?: string
          fornecedor_id?: string | null
          id?: string
          lote?: string | null
          quantidade?: number
          updated_at?: string
          variacao_produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entradas_estoque_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entradas_estoque_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entradas_estoque_variacao_produto_id_fkey"
            columns: ["variacao_produto_id"]
            isOneToOne: false
            referencedRelation: "variacoes_produto"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          created_at: string
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      itens_venda: {
        Row: {
          created_at: string
          id: string
          preco_unitario_praticado: number
          quantidade: number
          subtotal: number
          updated_at: string
          variacao_produto_id: string
          venda_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preco_unitario_praticado: number
          quantidade: number
          subtotal: number
          updated_at?: string
          variacao_produto_id: string
          venda_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preco_unitario_praticado?: number
          quantidade?: number
          subtotal?: number
          updated_at?: string
          variacao_produto_id?: string
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_venda_variacao_produto_id_fkey"
            columns: ["variacao_produto_id"]
            isOneToOne: false
            referencedRelation: "variacoes_produto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_venda_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      log_auditoria: {
        Row: {
          acao: string
          criado_em: string
          id: string
          registro_id: string | null
          tabela_afetada: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          criado_em?: string
          id?: string
          registro_id?: string | null
          tabela_afetada: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          criado_em?: string
          id?: string
          registro_id?: string | null
          tabela_afetada?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_caixa: {
        Row: {
          caixa_id: string
          criado_em: string
          descricao: string | null
          id: string
          tipo: Database["public"]["Enums"]["tipo_movimentacao_caixa"]
          updated_at: string
          valor: number
        }
        Insert: {
          caixa_id: string
          criado_em?: string
          descricao?: string | null
          id?: string
          tipo: Database["public"]["Enums"]["tipo_movimentacao_caixa"]
          updated_at?: string
          valor: number
        }
        Update: {
          caixa_id?: string
          criado_em?: string
          descricao?: string | null
          id?: string
          tipo?: Database["public"]["Enums"]["tipo_movimentacao_caixa"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_caixa_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos_venda: {
        Row: {
          created_at: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id: string
          updated_at: string
          valor: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          updated_at?: string
          valor: number
          venda_id: string
        }
        Update: {
          created_at?: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          updated_at?: string
          valor?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_venda_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          created_at: string
          descricao: string | null
          fornecedor_id: string | null
          foto_url: string | null
          id: string
          marca: string | null
          nome: string
          preco_custo: number
          preco_venda: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          descricao?: string | null
          fornecedor_id?: string | null
          foto_url?: string | null
          id?: string
          marca?: string | null
          nome: string
          preco_custo?: number
          preco_venda?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          descricao?: string | null
          fornecedor_id?: string | null
          foto_url?: string | null
          id?: string
          marca?: string | null
          nome?: string
          preco_custo?: number
          preco_venda?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome_completo: string
          papel: Database["public"]["Enums"]["papel_usuario"]
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id: string
          nome_completo: string
          papel?: Database["public"]["Enums"]["papel_usuario"]
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome_completo?: string
          papel?: Database["public"]["Enums"]["papel_usuario"]
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      variacoes_produto: {
        Row: {
          cor: string
          created_at: string
          estoque_minimo: number
          id: string
          produto_id: string
          quantidade_estoque: number
          tamanho: string
          updated_at: string
        }
        Insert: {
          cor: string
          created_at?: string
          estoque_minimo?: number
          id?: string
          produto_id: string
          quantidade_estoque?: number
          tamanho: string
          updated_at?: string
        }
        Update: {
          cor?: string
          created_at?: string
          estoque_minimo?: number
          id?: string
          produto_id?: string
          quantidade_estoque?: number
          tamanho?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "variacoes_produto_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          criado_em: string
          desconto: number
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id: string
          status: Database["public"]["Enums"]["status_venda"]
          updated_at: string
          valor_total: number
          vendedor_id: string
        }
        Insert: {
          criado_em?: string
          desconto?: number
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          status?: Database["public"]["Enums"]["status_venda"]
          updated_at?: string
          valor_total?: number
          vendedor_id: string
        }
        Update: {
          criado_em?: string
          desconto?: number
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          status?: Database["public"]["Enums"]["status_venda"]
          updated_at?: string
          valor_total?: number
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      categoria_despesa: "aluguel" | "frete" | "luz" | "outros"
      forma_pagamento:
        | "pix"
        | "cartao_debito"
        | "cartao_credito"
        | "dinheiro"
        | "misto"
      papel_usuario: "admin" | "vendedor"
      status_caixa: "aberto" | "fechado"
      status_venda: "concluida" | "cancelada"
      tipo_movimentacao_caixa: "sangria" | "suprimento" | "venda" | "despesa"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      categoria_despesa: ["aluguel", "frete", "luz", "outros"],
      forma_pagamento: [
        "pix",
        "cartao_debito",
        "cartao_credito",
        "dinheiro",
        "misto",
      ],
      papel_usuario: ["admin", "vendedor"],
      status_caixa: ["aberto", "fechado"],
      status_venda: ["concluida", "cancelada"],
      tipo_movimentacao_caixa: ["sangria", "suprimento", "venda", "despesa"],
    },
  },
} as const
