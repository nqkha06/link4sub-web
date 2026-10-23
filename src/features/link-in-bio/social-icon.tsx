import {
  SiApplemusic,
  SiCashapp,
  SiDiscord,
  SiFacebook,
  SiInstagram,
  SiPaypal,
  SiReddit,
  SiSpotify,
  SiTiktok,
  SiTwitch,
  SiVenmo,
  SiX,
  SiYoutube,
} from "@icons-pack/react-simple-icons";
import { Banknote, BriefcaseBusiness, Users } from "lucide-react";

/**
 * Icon của nền tảng mạng xã hội, dùng chung cho trang công khai và trình chỉnh sửa.
 * LinkedIn không có icon thương hiệu trong bộ icon đang dùng nên dùng icon chung.
 */
export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  switch (platform.trim().toLowerCase()) {
    case "youtube": return <SiYoutube className={className} />;
    case "instagram": return <SiInstagram className={className} />;
    case "facebook": return <SiFacebook className={className} />;
    case "tiktok": return <SiTiktok className={className} />;
    case "twitter":
    case "x": return <SiX className={className} />;
    case "linkedin": return <BriefcaseBusiness className={className} />;
    case "reddit": return <SiReddit className={className} />;
    case "discord": return <SiDiscord className={className} />;
    case "twitch": return <SiTwitch className={className} />;
    case "spotify": return <SiSpotify className={className} />;
    case "apple music": return <SiApplemusic className={className} />;
    case "paypal": return <SiPaypal className={className} />;
    case "venmo": return <SiVenmo className={className} />;
    case "cashapp": return <SiCashapp className={className} />;
    case "money":
    case "payment": return <Banknote className={className} />;
    default: return <Users className={className} />;
  }
}
