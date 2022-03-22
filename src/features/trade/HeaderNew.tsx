import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Currency } from '@sushiswap/core-sdk'
import QuestionHelper from 'app/components/QuestionHelper'
import Settings from 'app/components/Settings'
import React, { FC } from 'react'

import Typography from '../../components/Typography'
import { useExpertModeManager, useUserSingleHopOnly } from '../../state/user/hooks'

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
  const [singleHopOnly] = useUserSingleHopOnly()

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
        <div className="flex flex-col">
          {isExpertMode && (
            <div className="flex items-center">
              <Typography variant="xs" className="text-high-emphesis" weight={700}>
                {i18n._(t`Expert mode is ON`)}
              </Typography>
              <QuestionHelper
                text={i18n._(
                  t`Allows high slippage trades. Use at your own risk. You can turn it OFF from settings menu.`
                )}
              />
            </div>
          )}
          {singleHopOnly && (
            <div className="flex items-center">
              <Typography variant="xs" className="text-high-emphesis" weight={700}>
                {i18n._(t`Disable multihops is ON`)}
              </Typography>
              <QuestionHelper
                text={i18n._(t`Restricts swaps to direct pairs only. You can turn it OFF from settings menu.`)}
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-4">
        {/* {isLimitOrder && <MyOrders />} */}
        <Settings className="!w-6 !h-6" trident={trident} />
      </div>
    </div>
  )
}

export default HeaderNew
