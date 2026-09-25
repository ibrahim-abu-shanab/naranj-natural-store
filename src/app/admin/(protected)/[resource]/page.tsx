import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { isResource } from "@/lib/validation";
import { adminRecords, adminOptions } from "@/lib/admin-data";
import { resourceLabels } from "@/lib/admin-fields";
import { Editor } from "@/components/admin/editor";
import { RecordsTable } from "@/components/admin/records-table";
import { demoSettings } from "@/lib/demo";
export default async function AdminList({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  await requireAdmin();
  const { resource } = await params;
  if (!isResource(resource)) notFound();
  const records = await adminRecords(resource);
  if (resource === "settings")
    return (
      <>
        <div className="admin-top">
          <h1>{resourceLabels[resource]}</h1>
        </div>
        <Editor
          resource={resource}
          id="main"
          initial={JSON.parse(JSON.stringify(records[0] || demoSettings))}
          options={await adminOptions()}
        />
      </>
    );
  return (
    <>
      <div className="admin-top">
        <h1>{resourceLabels[resource]}</h1>
        <Link className="button" href={`/admin/${resource}/new`}>
          + إضافة سجل
        </Link>
      </div>
      <RecordsTable
        resource={resource}
        records={JSON.parse(JSON.stringify(records))}
        categories={(await adminOptions()).categories}
      />
    </>
  );
}
