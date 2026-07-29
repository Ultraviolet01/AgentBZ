import { redirect } from "next/navigation";

// Keep existing bookmarks working after replacing Wallet with Profile.
export default function WalletPage() {
  redirect("/profile");
}
