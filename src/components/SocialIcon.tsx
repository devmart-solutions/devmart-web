import { siFacebook, siGithub, siInstagram, siTiktok, siWhatsapp, siX, siYoutube } from "simple-icons";
import type { RedSocial } from "@/lib/site";

// Logos de marca (simple-icons, CC0). LinkedIn no está en simple-icons: se dibuja su monograma.
const LINKEDIN =
  "M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z";

const paths: Record<RedSocial | "whatsapp", string> = {
  instagram: siInstagram.path,
  youtube: siYoutube.path,
  linkedin: LINKEDIN,
  tiktok: siTiktok.path,
  facebook: siFacebook.path,
  github: siGithub.path,
  x: siX.path,
  whatsapp: siWhatsapp.path,
};

export function SocialIcon({ red, size = 20, className }: { red: RedSocial | "whatsapp"; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d={paths[red]} />
    </svg>
  );
}
