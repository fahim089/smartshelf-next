import '../styles/globals.css'

export const metadata = {
  title:       'SmartShelf — Inventory Management',
  description: 'SmartShelf v2 inventory management system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <style suppressHydrationWarning>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        `}</style>
        {children}
      </body>
    </html>
  )
}
