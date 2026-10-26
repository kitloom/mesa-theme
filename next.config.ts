import type { NextConfig } from 'next'

const config: NextConfig = {
  // A kitloom site's addresses end in a slash, as WordPress's do: the theme's links keep them.
  trailingSlash: true,
  // The slash is added in proxy.ts for the site's pages only: the theme's own routes under /api
  // answer at the same addresses as every kitloom theme's (`/api/page`, `/api/cart/add`).
  skipTrailingSlashRedirect: true,
}

export default config
