import { redirect } from "next/navigation"

// Trang tạo được thay bằng hộp thoại ở tab "Tạo" của /member/bio.
export default function CreateLinkInBioPage() {
  redirect("/member/bio?tab=create")
}
