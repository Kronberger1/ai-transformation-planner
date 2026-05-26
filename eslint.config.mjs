import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '../lib/supabase/admin',
              message:
                'Admin client forbidden in app code. Use /lib/supabase/server.ts instead.',
            },
            {
              name: '../../lib/supabase/admin',
              message:
                'Admin client forbidden in app code. Use /lib/supabase/server.ts instead.',
            },
            {
              name: '@/lib/supabase/admin',
              message:
                'Admin client forbidden in app code. Use /lib/supabase/server.ts instead.',
            },
          ],
        },
      ],
    },
  },
])

export default eslintConfig
