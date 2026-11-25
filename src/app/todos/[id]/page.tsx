import { Suspense } from "react";
import { TodoDetail } from "@/components/TodoDetail";

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="mx-auto w-full max-w-6xl px-4 py-10 text-sm text-muted">正在打开待办…</p>}>
      <TodoRoute params={props.params} />
    </Suspense>
  );
}

async function TodoRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TodoDetail todoId={id} />;
}
