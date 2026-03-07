type Props = {
  numbers: number[]
}

export function WinningNumbers({ numbers }: Props) {

  return (
    <div className="flex gap-2">

      {numbers.map(n => (
        <span
          key={n}
          className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs"
        >
          {n}
        </span>
      ))}

    </div>
  )
}