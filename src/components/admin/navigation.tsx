"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tags,
  Layers,
  Images,
  BookOpen,
  Settings,
  FileText,
  ArrowUpLeft,
} from "lucide-react";
import { resourceLabels } from "@/lib/admin-fields";
const icons = {
  products: Package,
  categories: FolderTree,
  tags: Tags,
  collections: Layers,
  slides: Images,
  articles: BookOpen,
  settings: Settings,
  pages: FileText,
};
export function AdminNavigation() {
  const path = usePathname();
  return (
    <nav aria-label="التنقل في لوحة الإدارة">
      <Link href="/admin" aria-current={path === "/admin" ? "page" : undefined}>
        <LayoutDashboard size={19} />
        نظرة عامة
      </Link>
      {Object.entries(resourceLabels).map(([key, label]) => {
        const Icon = icons[key as keyof typeof icons];
        return (
          <Link
            key={key}
            href={`/admin/${key}`}
            aria-current={path.startsWith(`/admin/${key}`) ? "page" : undefined}
          >
            <Icon size={19} />
            {label}
          </Link>
        );
      })}
      <Link
        href="/ar"
        target="_blank"
        rel="noopener noreferrer"
        className="admin-store-link"
      >
        <ArrowUpLeft size={19} />
        عرض المتجر
      </Link>
    </nav>
  );
}
