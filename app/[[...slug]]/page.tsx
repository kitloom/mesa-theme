import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { jsonLd, metadataOf } from '@/lib/metadata'
import { getPage, pathOf } from '@/lib/page'
import { resolveTemplate } from '@/lib/templates'

type Props = {
  params: Promise<{ slug?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Every address of the site is this page: the site says which template the address is. */
async function load(props: Props) {
  const path = (await headers()).get('x-theme-path') ?? pathOf((await props.params).slug, await props.searchParams)
  return { path, page: await getPage(path) }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { page } = await load(props)
  return page?.kind === 'not-found' ? {} : metadataOf(page)
}

export default async function SitePage(props: Props) {
  const { path, page } = await load(props)

  if (!page) throw new Error('The site could not be read.')
  if (page.kind === 'not-found') notFound()

  const Template = resolveTemplate(page)

  return (
    <Shell page={page} path={path}>
      {page.schema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(page.schema) }} /> : null}
      <Template page={page} path={path} />
    </Shell>
  )
}
