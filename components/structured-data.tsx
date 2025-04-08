export default function StructuredData() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Orizen Inc",
            url: "https://orizeninc.com",
            logo: "https://orizeninc.com/icon-512.png",
            sameAs: [
              "https://www.facebook.com/orizeninc",
              "https://twitter.com/orizeninc",
              "https://www.linkedin.com/company/orizeninc",
            ],
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+92 329 9438557",
              contactType: "customer service",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Orizen Inc",
            url: "https://orizeninc.com",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://orizeninc.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
    </>
  )
}
