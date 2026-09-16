import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 server/.env에 설정하세요.')
}

// 서비스 역할 키는 서버 내부에서만 사용하며, 프론트엔드 코드에는 절대 전달하지 않는다.
export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
