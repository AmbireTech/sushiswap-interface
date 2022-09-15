import React, { FC } from 'react'

interface OneInchRate {
  rate: number
  percentDiff: number
}

const OneInchRate: FC<OneInchRate> = ({ rate, percentDiff }) => {
  return (
    <div>
      {rate !== 0 && (
        <div>
          One inch rate is: {rate} ({percentDiff} %)
        </div>
      )}
    </div>
  )
}

export default OneInchRate
