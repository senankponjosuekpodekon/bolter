type Props = { title?: string }

export default function SkeletonPage({ title }: Props) {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        {title && <div className="h-6 w-1/3 bg-gray-200 rounded" />}
        <div className="h-6 w-1/4 bg-gray-200 rounded" />
        <div className="h-40 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}
