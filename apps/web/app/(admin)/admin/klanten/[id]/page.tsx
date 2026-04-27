import { notFound } from "next/navigation";

import { ClientDetailCrumbs } from "@/features/clients/drawer/client-detail-crumbs";
import { ClientDetailFallback } from "@/features/clients/drawer/client-detail-fallback";
import { getClientById } from "@/lib/clients/get-by-id";

export default async function ClientDetailPage({
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
      <ClientDetailFallback client={client} />
    </>
  );
}
