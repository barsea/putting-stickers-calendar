import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database";
import { SupabaseClient } from "@supabase/supabase-js";

// シングルトンインスタンス
let supabaseInstance: SupabaseClient<Database> | null = null;

export function createClient() {
  // 既存のインスタンスがあればそれを返す
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // 初回のみ新しいインスタンスを作成
  supabaseInstance = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
  );

  return supabaseInstance;
}
