import React, { FC } from 'react'

interface OneInchRate {
  rate: number
}

const OneInchRate: FC<OneInchRate> = ({ rate }) => {
  return <div>{rate !== 0 && <div>One inch rate is: {rate}</div>}</div>
}

export default OneInchRate
