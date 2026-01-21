import type { Metadata } from "next";
import "./globals.css";
import Header from './components/Header';
import Footer from './components/Footer';

export const metadata: Metadata = {
  title: "Primavet - Prêt à Porter de Qualité",
  description: "Conception, développement et commercialisation de produits prêt à porter de qualité. Découvrez notre savoir-faire et nos collections.",
  keywords: "Primavet, prêt à porter, vêtements, mode, qualité, professionnel",
  authors: [{ name: "Primavet" }],
  openGraph: {
    title: "Primavet - Prêt à Porter de Qualité",
    description: "Conception, développement et commercialisation de produits prêt à porter de qualité.",
    type: "website",
    url: "https://primavet.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Open+Sans:wght@400;500;600&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"
          rel="stylesheet"
        />
        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        {/* Favicon */}
        <link rel="icon" type="image/png" href="/assets/Gemini_Generated_Image_2t7y2l2t7y2l2t7y.png" />
      </head>
      <body>
        <Header />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
