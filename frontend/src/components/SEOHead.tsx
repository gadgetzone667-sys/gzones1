import { useEffect } from "react";

export interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "product" | "article";
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Array<Record<string, any>> | object;
  schemaData?: Record<string, any> | Array<Record<string, any>> | object;
}

const DEFAULT_TITLE = "GadgetZone | Premium Gaming PCs, Laptops, Tech Spares & Repair Services";
const DEFAULT_DESCRIPTION =
  "GadgetZone is your trusted destination for custom gaming PCs, laptops, computer components, professional repair services, and CCTV installations with warranty across India.";
const DEFAULT_OG_IMAGE = "https://gzones.in/Gadgetzone.png";
const BASE_URL = "https://gzones.in";

export default function SEOHead({
  title,
  description,
  canonicalUrl,
  canonical,
  ogImage,
  ogType = "website",
  noIndex = false,
  jsonLd,
  schemaData,
}: SEOHeadProps) {
  useEffect(() => {
    // 1. Page Title
    const finalTitle = title ? (title.includes("GadgetZone") ? title : `${title} | GadgetZone`) : DEFAULT_TITLE;
    document.title = finalTitle;

    // Helper to create or update meta tags
    const setMetaTag = (attrName: "name" | "property", attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // 2. Meta Description
    const finalDesc = description || DEFAULT_DESCRIPTION;
    setMetaTag("name", "description", finalDesc);

    // 3. Robots meta (noindex for admin / private pages)
    setMetaTag("name", "robots", noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large");

    // 4. Canonical Link
    const targetCanonical = canonical || canonicalUrl;
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    const finalCanonical = targetCanonical
      ? (targetCanonical.startsWith("http") ? targetCanonical : `${BASE_URL}${targetCanonical}`)
      : `${BASE_URL}${currentPath}`;

    let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", finalCanonical);

    // 5. Open Graph Meta Tags
    const finalImage = ogImage || DEFAULT_OG_IMAGE;
    setMetaTag("property", "og:title", finalTitle);
    setMetaTag("property", "og:description", finalDesc);
    setMetaTag("property", "og:image", finalImage);
    setMetaTag("property", "og:url", finalCanonical);
    setMetaTag("property", "og:type", ogType);
    setMetaTag("property", "og:site_name", "GadgetZone");

    // 6. Twitter Card Meta Tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", finalTitle);
    setMetaTag("name", "twitter:description", finalDesc);
    setMetaTag("name", "twitter:image", finalImage);

    // 7. Structured Data (JSON-LD)
    const activeSchema = jsonLd || schemaData;
    let jsonLdScript = document.querySelector<HTMLScriptElement>('script[id="gadgetzone-jsonld"]');
    if (activeSchema) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement("script");
        jsonLdScript.id = "gadgetzone-jsonld";
        jsonLdScript.type = "application/ld+json";
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(activeSchema);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }
  }, [title, description, canonicalUrl, canonical, ogImage, ogType, noIndex, jsonLd, schemaData]);

  return null;
}
