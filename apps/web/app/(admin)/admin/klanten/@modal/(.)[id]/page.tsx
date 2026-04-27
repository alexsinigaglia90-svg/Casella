import { notFound } from "next/navigation";

import { ClientDetailCrumbs } from "@/features/clients/drawer/client-detail-crumbs";
import { InterceptedEditDrawer } from "@/features/clients/drawer/intercepted-edit-drawer";
import { getClientById } from "@/lib/clients/get-by-id";

export default async function InterceptedClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();
  return (
    <>
      <ClientDetailCrumbs name={client.name} />
      <InterceptedEditDrawer client={client} />
    </>
  );
}
