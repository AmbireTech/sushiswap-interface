import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import {
  ChainId,
  Currency,
  CurrencyAmount,
  JSBI,
  Percent,
  SUSHI_ADDRESS,
  Trade as V2Trade,
  TradeType,
  WNATIVE_ADDRESS,
} from '@sushiswap/core-sdk'
import { tryParseAmount } from 'app/functions/parse'
import { isAddress } from 'app/functions/validate'
import { useCurrency } from 'app/hooks/Tokens'
import useENS from 'app/hooks/useENS'
import useParsedQueryString from 'app/hooks/useParsedQueryString'
import useSwapSlippageTolerance from 'app/hooks/useSwapSlippageTollerence'
import { useV2TradeExactIn as useTradeExactIn, useV2TradeExactOut as useTradeExactOut } from 'app/hooks/useV2Trades'
import { useActiveWeb3React } from 'app/services/web3'
import { AppState } from 'app/state'
import { useAppDispatch, useAppSelector } from 'app/state/hooks'
import { useExpertModeManager, useUserSingleHopOnly } from 'app/state/user/hooks'
import { useCurrencyBalances } from 'app/state/wallet/hooks'
import { ParsedQs } from 'qs'
import { useCallback, useEffect, useState } from 'react'

import { ADX, ADX_LOYALTY, ADX_STAKING, WALLET, xWALLET } from '../../config/tokens'
// import {
//   EstimatedSwapCall,
//   SuccessfulCall,
//   useSwapCallArguments,
// } from "../../hooks/useSwapCallback";
import { Field, replaceSwapState, selectCurrency, setRecipient, switchCurrencies, typeInput } from './actions'
import { SwapState } from './reducer'

export function useSwapState(): AppState['swap'] {
  return useAppSelector((state) => state.swap)
}

export function useSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onSwitchTokens: () => void
  onUserInput: (field: Field, typedValue: string) => void
  onChangeRecipient: (recipient?: string) => void
} {
  const dispatch = useAppDispatch()
  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      dispatch(
        selectCurrency({
          field,
          currencyId: currency.isToken
            ? currency.address
            : currency.isNative && currency.chainId !== ChainId.CELO
            ? 'ETH'
            : '',
        })
      )
    },
    [dispatch]
  )

  const onSwitchTokens = useCallback(() => {
    dispatch(switchCurrencies())
  }, [dispatch])

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  const onChangeRecipient = useCallback(
    (recipient?: string) => {
      dispatch(setRecipient(recipient))
    },
    [dispatch]
  )

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRecipient,
  }
}

// TODO: Swtich for ours...
const BAD_RECIPIENT_ADDRESSES: { [chainId: string]: { [address: string]: true } } = {
  [ChainId.ETHEREUM]: {
    '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac': true, // v2 factory
    '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F': true, // v2 router 02
  },
}

/**
 * Returns true if any of the pairs or tokens in a trade have the given checksummed address
 * @param trade to check for the given address
 * @param checksummedAddress address to check in the pairs and tokens
 */
function involvesAddress(trade: V2Trade<Currency, Currency, TradeType>, checksummedAddress: string): boolean {
  const path = trade.route.path
  return (
    path.some((token) => token.address === checksummedAddress) ||
    (trade instanceof V2Trade
      ? trade.route.pairs.some((pair) => pair.liquidityToken.address === checksummedAddress)
      : false)
  )
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(): {
  to?: string
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  parsedAmount: CurrencyAmount<Currency> | undefined
  inputError?: string
  v2Trade: V2Trade<Currency, Currency, TradeType> | undefined
  allowedSlippage: Percent
} {
  console.log(123123111)
  const { i18n } = useLingui()
  const { account, chainId } = useActiveWeb3React()
  const [singleHopOnly] = useUserSingleHopOnly()
  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient,
  } = useSwapState()
  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  const recipientLookup = useENS(recipient ?? undefined)

  const to = (recipient === undefined ? account : recipientLookup.address) ?? undefined

  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    inputCurrency ?? undefined,
    outputCurrency ?? undefined,
  ])

  const isExactIn: boolean = independentField === Field.INPUT

  const parsedAmount = tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined)

  const bestTradeExactIn = useTradeExactIn(isExactIn ? parsedAmount : undefined, outputCurrency ?? undefined, {
    maxHops: singleHopOnly ? 1 : undefined,
  })

  const bestTradeExactOut = useTradeExactOut(inputCurrency ?? undefined, !isExactIn ? parsedAmount : undefined, {
    maxHops: singleHopOnly ? 1 : undefined,
  })

  const v2Trade = isExactIn ? bestTradeExactIn : bestTradeExactOut

  const currencyBalances = {
    [Field.INPUT]: relevantTokenBalances[0],
    [Field.OUTPUT]: relevantTokenBalances[1],
  }

  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [Field.OUTPUT]: outputCurrency ?? undefined,
  }

  let inputError: string | undefined

  if (!account) {
    inputError = 'Connect Wallet'
  }

  if (!parsedAmount) {
    inputError = inputError ?? i18n._(t`Enter an amount`)
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? i18n._(t`Select a token`)
  }

  const formattedTo = isAddress(to)
  if (!to || !formattedTo) {
    inputError = inputError ?? i18n._(t`Enter a recipient`)
  } else {
    if (
      // @ts-ignore TYPE NEEDS FIXING
      BAD_RECIPIENT_ADDRESSES?.[chainId]?.[formattedTo] ||
      (bestTradeExactIn && involvesAddress(bestTradeExactIn, formattedTo)) ||
      (bestTradeExactOut && involvesAddress(bestTradeExactOut, formattedTo))
    ) {
      inputError = inputError ?? i18n._(t`Invalid recipient`)
    }
  }

  // @ts-ignore TYPE NEEDS FIXING
  const allowedSlippage = useSwapSlippageTolerance(v2Trade)

  // compare input balance to max input based on version
  const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], v2Trade?.maximumAmountIn(allowedSlippage)]

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = i18n._(t`Insufficient Balance`)
  }

  return {
    to,
    currencies,
    currencyBalances,
    parsedAmount,
    inputError,
    v2Trade: v2Trade ?? undefined,
    allowedSlippage,
  }
}

function parseCurrencyFromURLParameter(urlParam: any): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) return valid
    if (urlParam.toUpperCase() === 'ETH') return 'ETH'
  }
  return ''
}

function parseTokenAmountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
}

function parseIndependentFieldURLParameter(urlParam: any): Field {
  return typeof urlParam === 'string' && urlParam.toLowerCase() === 'output' ? Field.OUTPUT : Field.INPUT
}

const ENS_NAME_REGEX = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
function validatedRecipient(recipient: any): string | undefined {
  if (typeof recipient !== 'string') return undefined
  const address = isAddress(recipient)
  if (address) return address
  if (ENS_NAME_REGEX.test(recipient)) return recipient
  if (ADDRESS_REGEX.test(recipient)) return recipient
  return undefined
}

function getDefaultOutputCurrency(chainId: ChainId): string {
  const sushi = SUSHI_ADDRESS[chainId]
  const currency =
    WALLET[chainId]?.address ||
    xWALLET[chainId]?.address ||
    ADX[chainId]?.address ||
    ADX_STAKING[chainId]?.address ||
    ADX_LOYALTY[chainId]?.address ||
    sushi ||
    ''

  return currency
}

export function queryParametersToSwapState(parsedQs: ParsedQs, chainId: ChainId = ChainId.ETHEREUM): SwapState {
  let inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency)
  let outputCurrency = parseCurrencyFromURLParameter(parsedQs.outputCurrency)
  const eth = chainId === ChainId.CELO ? WNATIVE_ADDRESS[chainId] : 'ETH'
  const defaultCurrency = getDefaultOutputCurrency(chainId)
  if (inputCurrency === '' && outputCurrency === '') {
    inputCurrency = eth
    outputCurrency = defaultCurrency
  } else if (inputCurrency === '') {
    inputCurrency = outputCurrency === eth ? defaultCurrency : eth
  } else if (outputCurrency === '' || inputCurrency === outputCurrency) {
    outputCurrency = inputCurrency === eth ? defaultCurrency : eth
  }

  const recipient = validatedRecipient(parsedQs.recipient)

  return {
    [Field.INPUT]: {
      currencyId: inputCurrency,
    },
    [Field.OUTPUT]: {
      currencyId: outputCurrency,
    },
    typedValue: parseTokenAmountURLParameter(parsedQs.exactAmount),
    independentField: parseIndependentFieldURLParameter(parsedQs.exactField),
    recipient,
  }
}

// updates the swap state to use the defaults for a given network
export function useDefaultsFromURLSearch():
  | {
      inputCurrencyId: string | undefined
      outputCurrencyId: string | undefined
    }
  | undefined {
  const { chainId } = useActiveWeb3React()
  const dispatch = useAppDispatch()
  const parsedQs = useParsedQueryString()
  const [expertMode] = useExpertModeManager()
  const [result, setResult] = useState<
    | {
        inputCurrencyId: string | undefined
        outputCurrencyId: string | undefined
      }
    | undefined
  >()

  useEffect(() => {
    if (!chainId) return
    const parsed = queryParametersToSwapState(parsedQs, chainId)

    dispatch(
      replaceSwapState({
        typedValue: parsed.typedValue,
        field: parsed.independentField,
        inputCurrencyId: parsed[Field.INPUT].currencyId,
        outputCurrencyId: parsed[Field.OUTPUT].currencyId,
        recipient: expertMode ? parsed.recipient : undefined,
      })
    )

    setResult({
      inputCurrencyId: parsed[Field.INPUT].currencyId,
      outputCurrencyId: parsed[Field.OUTPUT].currencyId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId])

  return result
}

// fetch 1inch rate and return it along with percent difference compared to sushiswap
export function useOnceInchRate(parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> }): {
  oneInchApiRate: number
  oneInchRatePercentDiff: number
} {
  const [oneInchApiRate, setOneInchApiRate] = useState(0)
  const [oneInchRatePercentDiff, setOneInchRatePercentDiff] = useState(0)

  useEffect(() => {
    const inputCurrencyData = parsedAmounts[Field.INPUT]
    const outputCurrencyData = parsedAmounts[Field.OUTPUT]

    if (inputCurrencyData === undefined || outputCurrencyData === undefined) {
      return
    }

    const fromToken = inputCurrencyData.currency
    const fromTokenAddress = fromToken.isToken ? fromToken.address : fromToken.wrapped.address
    const fromAmount = inputCurrencyData.multiply(10 ** fromToken.decimals).toSignificant()

    const toToken = outputCurrencyData.currency
    const toTokenAddress = toToken.isToken ? toToken.address : toToken.wrapped.address
    const toAmount = outputCurrencyData.multiply(10 ** toToken.decimals).toSignificant()

    // console.log(`--- input: ${fromTokenAddress}, amount: ${fromAmount}`)
    // console.log(`--- output: ${toTokenAddress}, amount: ${toAmount}`)

    // 1inch fetch swap quote
    const oneInchFetch = async () => {
      const response = await fetch(
        `https://api.1inch.io/v4.0/1/quote?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${fromAmount}`
      )
      if (response.status == 200) {
        const responseBody = await response.json()
        // console.log(`--- 1inch quote output amount: ${responseBody.toTokenAmount}`)
        const rate = Number(CurrencyAmount.fromRawAmount(toToken, responseBody.toTokenAmount).toSignificant(6))
        setOneInchApiRate(rate)

        const percentDiff = new Percent(
          JSBI.subtract(JSBI.BigInt(responseBody.toTokenAmount), JSBI.BigInt(toAmount)),
          JSBI.BigInt(toAmount)
        ).toFixed(2)
        setOneInchRatePercentDiff(Number(percentDiff))
        // console.log(`--- percentDiff: ${percentDiff}`)
      }
    }

    oneInchFetch()
  }, [parsedAmounts])

  return {
    oneInchApiRate,
    oneInchRatePercentDiff,
  }
}
