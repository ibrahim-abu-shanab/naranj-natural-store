import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { isResource } from "@/lib/validation";
import { adminRecords, adminOptions } from "@/lib/admin-data";
import { resourceLabels } from "@/lib/admin-fields";
import { Editor } from "@/components/admin/editor";
export default async function EditPage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  await requireAdmin();
  const { resource, id } = await params;
  if (!isResource(resource) || resource === "settings") notFound();
  const record =
    id === "new" ? {} : (await adminRecords(resource)).find((r) => r.id === id);
  if (!record) notFound();
  return (
    <>
      <div className="admin-top">
        <h1>{resourceLabels[resource]}</h1>
        <p>{id === "new" ? "إضافة سجل جديد" : "تعديل السجل"}</p>
      </div>
      <Editor
        resource={resource}
        id={id}
        initial={JSON.parse(JSON.stringify(record))}
        options={await adminOptions()}
      />
    </>
  );
}
