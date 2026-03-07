type Props = {
  title: string
  children: React.ReactNode
}

export function Board({ title, children }: Props) {
  return (
    <div className="border rounded-xl p-5 bg-white">

      <div className="font-semibold mb-4">
        {title}
      </div>

      {children}

    </div>
  )
}