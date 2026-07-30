import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function Sitemap() {
  const [open, setOpen] = useState(null);

  const sections = [
    {
      title: "Home",
      description:
        "Landing page — hero, swing-tag signature element, 'What We Brand' category strip, services preview, why-choose-us, blog/Instagram teaser, WhatsApp CTA.",
      children: [],
    },
    {
      title: "Catalogue",
      description:
        "Live product grid pulling from data/products.json (National Flag reseller feed, 30% markup applied at build time). Paystack checkout, WhatsApp order confirmation.",
      children: [
        {
          title: "Categories",
          children: [
            "Apparel",
            "Headwear",
            "Tech",
            "Notebooks",
            "Display",
            "Workwear",
            "Umbrellas",
            "Sublimation (Dye-Sub)",
          ],
        },
      ],
    },
    {
      title: "Services",
      description:
        "Overview page linking to five dedicated service pages, reflecting the three-layer model: Strategic Marketing, Brand Activation, Digital Marketing — plus Merchandise and Concierge.",
      children: [
        "service-physical.html — Branded Merchandise",
        "service-activation.html — Marketing Activations",
        "service-strategic.html — Strategic Services",
        "service-concierge.html — Business Concierge",
        "service-digital.html — Digital Marketing",
      ],
    },
    {
      title: "Blog",
      description:
        "Nine published posts with Open Graph, Twitter Card, canonical, and Article JSON-LD schema tags.",
      children: [
        "blog-1.html",
        "blog-3.html",
        "post-1.html",
        "post-2.html",
        "post-3.html",
        "post-4.html",
        "post-5.html",
        "post-6.html",
        "post-7.html",
      ],
    },
    {
      title: "About",
      description: "Company background and positioning.",
      children: [],
    },
  ];

  const notes = [
    "No standalone Contact/Get-a-Quote page — every CTA routes to WhatsApp (wa.me/27732746135) instead of a form.",
    "No Projects/Portfolio page currently exists on the live site.",
    "Legacy shop.html and the old catalogue/ subfolder are deprecated in favor of catalogue.html; flagged for removal.",
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-center">Grippx Website Sitemap</h1>
      <p className="text-center text-sm text-gray-500 mb-6">
        Reflects the live site structure as of the current build.
      </p>
      <div className="space-y-4">
        {sections.map((section, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow p-4 border hover:shadow-lg transition cursor-pointer"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${open === i ? "rotate-180" : ""}`}
              />
            </div>
            <p className="text-gray-600 text-sm mt-1">{section.description}</p>
            {open === i && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="pl-4 mt-3 space-y-2"
              >
                {section.children.length > 0 ? (
                  section.children.map((child, j) =>
                    typeof child === "string" ? (
                      <p key={j} className="text-gray-700 ml-3">
                        • {child}
                      </p>
                    ) : (
                      <div key={j}>
                        <p className="font-medium text-gray-800">{child.title}</p>
                        <ul className="ml-5 list-disc text-gray-600">
                          {child.children.map((sub, k) => (
                            <li key={k}>{sub}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  )
                ) : (
                  <p className="text-gray-500 italic ml-3">No sub-items</p>
                )}
              </motion.div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="font-semibold text-amber-900 mb-2">Known gaps / deprecated paths</p>
        <ul className="ml-5 list-disc text-amber-800 text-sm space-y-1">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
