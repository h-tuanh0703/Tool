import './globals.css'

export const metadata = {
  title: 'MerchantWords Crawler',
  description: 'Search and extract keyword data from MerchantWords',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}