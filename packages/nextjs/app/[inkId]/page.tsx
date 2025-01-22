import { notFound, redirect } from "next/navigation";

export default function HashPage({ params }: { params: { inkId: string } }) {
  const { inkId } = params;

  if (inkId?.length === 46) {
    redirect(`/ink/${inkId}`);
  }

  notFound();
}
