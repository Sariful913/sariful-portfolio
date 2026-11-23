// /pdf and /pdf/<slug> -> pdf.html with that PDF's own share-preview tags.
import { handleShare, pdfBase } from "../../cf-lib/share-meta.js";

export async function onRequestGet(context) {
  return handleShare(context, {
    section: "pdf",
    page: "/pdf",
    data: "/content/resources.json",
    listKey: "resources",
    base: pdfBase,
    fallbackTitle: "Free PDF",
    fallbackDesc: "পুরো পোস্ট পড়ুন, PDF দেখুন আর ডাউনলোড করুন।",
    descField: "description",
    imageField: null,
  });
}
