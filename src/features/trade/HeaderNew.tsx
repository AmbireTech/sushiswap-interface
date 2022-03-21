import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Currency } from '@sushiswap/core-sdk'
import Settings from 'app/components/Settings'
import React, { FC } from 'react'

import Typography from '../../components/Typography'
import { useExpertModeManager } from '../../state/user/hooks'

const getQuery = (input?: Currency, output?: Currency) => {
  if (!input && !output) return

  if (input && !output) {
    // @ts-ignore
    return { inputCurrency: input.address || 'ETH' }
  } else if (input && output) {
    // @ts-ignore
    return { inputCurrency: input.address, outputCurrency: output.address }
  }
}

interface HeaderNewProps {
  inputCurrency?: Currency
  outputCurrency?: Currency
  trident?: boolean
}

const HeaderNew: FC<HeaderNewProps> = ({ inputCurrency, outputCurrency, trident = false }) => {
  const { i18n } = useLingui()
  // const { asPath } = useRouter()
  // const isLimitOrder = asPath.startsWith('/limit-order')
  const [isExpertMode] = useExpertModeManager()

  return (
    <div className="flex items-center justify-between gap-1">
      <div className="flex gap-4 text-blue">
        {/* <NavLink
          activeClassName="text-high-emphesis"
          href={{
            pathname: trident ? '/trident/swap' : '/swap',
            query: getQuery(inputCurrency, outputCurrency),
          }}
        >
          <Typography weight={700} className="text-secondary hover:text-white">
            {i18n._(t`Swap`)}
          </Typography>
        </NavLink> */}
        {/* <NavLink
          activeClassName="text-high-emphesis"
          href={{
            pathname: '/limit-order',
            query: getQuery(inputCurrency, outputCurrency),
          }}
        >
          <Typography weight={700} className="text-secondary hover:text-white">
            {i18n._(t`Limit`)}
          </Typography>
        </NavLink> */}
        <Typography variant="lg">{isExpertMode && i18n._(t`Expert mode`)}</Typography>
      </div>
      <div className="flex gap-4">
        {/* {isLimitOrder && <MyOrders />} */}
        <Settings className="!w-6 !h-6" trident={trident} />
      </div>
    </div>
  )
}

export default HeaderNew
