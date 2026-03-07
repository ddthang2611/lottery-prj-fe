type Props = {
  id: string
  type: string
  reward: string
  countdown?: string
}

export function LotteryCard({ id, type, reward, countdown }: Props) {

  return (
    <div className="border rounded-lg p-4">

      <div className="font-semibold">
        {id}
      </div>

      <div className="text-sm text-gray-500">
        {type}
      </div>

      <div className="flex justify-between mt-2">

        <span className="text-gray-500">
          Giải thưởng
        </span>

        <span className="text-blue-600 font-semibold">
          {reward}
        </span>

      </div>

      {countdown && (
        <div className="text-sm mt-2">
          {countdown}
        </div>
      )}

    </div>
  )
}