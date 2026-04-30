/**
 * Generated Supabase database types.
 *
 * In development, regenerate with:
 *   `supabase gen types typescript --local > src/types/database.ts`
 *
 * Until the local Supabase stack is initialised and types are generated,
 * we relax the inner shape so insert/update/select operations type-check
 * without per-table definitions. After running `npm run db:types` the
 * generator will overwrite this file with strict, per-column typings.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type GenericTable = {
  Row: Record<string, any>;
  Insert: Record<string, any>;
  Update: Record<string, any>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: { [key: string]: GenericTable };
    Views: { [key: string]: { Row: Record<string, any>; Relationships: [] } };
    Functions: { [key: string]: { Args: Record<string, any>; Returns: any } };
    Enums: Record<string, string>;
    CompositeTypes: Record<string, any>;
  };
}
