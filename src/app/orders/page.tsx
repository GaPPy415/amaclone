export default function OrdersPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6">Your Orders</h1>
      <div className="p-8 text-center bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">You have no orders yet.</p>
      </div>
    </div>
  );
}
