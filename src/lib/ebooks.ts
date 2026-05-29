import path from "path";
import { existsSync } from "fs";
import { EBOOKS, type EbookListing } from "./business";
import { EBOOKS_CONTENT_DIR } from "./paths";

/** Maps catalogue id → PDF filename on disk */
export const EBOOK_PDF_FILES: Record<string, string> = {
  "ebook-support-prompts": "customer-support-chatgpt-prompts.pdf",
  "ebook-pixel-war-playbook": "pixel-war-playbook.pdf",
  "ebook-instagram-viral-stunt": "instagram-viral-stunt-site.pdf",
  "ebook-india-digital-starter": "india-digital-product-starter.pdf",
  "ebook-kamal-cockroach-copy": "kamal-cockroach-copy-toolkit.pdf",
};

export function getEbookById(productId: string): EbookListing | undefined {
  return EBOOKS.find((e) => e.id === productId);
}

export function getEbookBySlug(slug: string): EbookListing | undefined {
  return EBOOKS.find((e) => e.slug === slug);
}

export function getEbookPdfPath(productId: string): string | null {
  const filename = EBOOK_PDF_FILES[productId];
  if (!filename) return null;
  const full = path.join(EBOOKS_CONTENT_DIR, filename);
  return existsSync(full) ? full : null;
}

export function assertEbookPdfExists(productId: string): string {
  const pdfPath = getEbookPdfPath(productId);
  if (!pdfPath) {
    throw new Error("This ebook file is not available yet. Please contact support.");
  }
  return pdfPath;
}
