export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl p-5 border ${className}`}
      style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="skeleton h-10 w-10 rounded-xl mb-3" />
      <div className="skeleton h-3 w-24 rounded mb-2" />
      <div className="skeleton h-6 w-16 rounded" />
    </div>
  );
}
export function SkeletonLine({ w = 'full', h = 4 }: { w?: string; h?: number }) {
  return <div className={`skeleton rounded w-${w} h-${h}`} />;
}
