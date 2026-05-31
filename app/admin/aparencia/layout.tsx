import { getAllThemesFontsUrl } from '@/lib/theme-fonts'

export default function AparenciaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={getAllThemesFontsUrl()} />
      {children}
    </>
  )
}
