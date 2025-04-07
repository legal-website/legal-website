export default function StructuredData() {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Orizen Inc",
      url: "https://orizeninc.com",
      logo: "https://orizeninc.com/logo.png",
      description: "Orizen Inc provides fast, affordable LLC formation and business services.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "7901, N STE 15322",
        addressLocality: "St. Petersburg",
        addressRegion: "FL",
        postalCode: "33701",
        addressCountry: "US",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+1-123-456-789",
        contactType: "customer service",
      },
    }
  
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  }
  
  