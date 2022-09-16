import React, { FC, Fragment } from 'react'

interface OneInchRate {
  rate: number
  percentDiff: number
}

const Link: FC = () => {
  return (
    <a className="text-blue" target="_blank" rel="noreferrer" href="https://app.1inch.io/">
      1inch
    </a>
  )
}

const OneInchRate: FC<OneInchRate> = ({ rate, percentDiff }) => {
  return (
    <Fragment>
      {percentDiff > 2 && (
        <div className="border border-orange-700 p-2">
          <p>
            The rate at <Link /> is better: {rate} ({percentDiff} %)
          </p>
          <p>
            You should consider swapping at <Link />
          </p>
        </div>
      )}
    </Fragment>
  )
}

export default OneInchRate
