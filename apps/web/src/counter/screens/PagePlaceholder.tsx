/**
 * A screen that a later step builds (Checkout, Canteen, Players, Today's totals, Expense, Pause all, Close sheet).
 * It sits inside the frame, so the top bar and action bar around it are the real ones.
 */
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <h1 className="text-c-title font-semibold">{title}</h1>
    </main>
  );
}
