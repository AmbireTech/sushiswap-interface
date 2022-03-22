import { ChainId, ChainTokenMap, Token } from '@sushiswap/core-sdk'

export const WALLET: ChainTokenMap = {
  [ChainId.ETHEREUM]: new Token(
    ChainId.ETHEREUM,
    '0x88800092fF476844f74dC2FC427974BBee2794Ae',
    18,
    'WALLET',
    'Ambire WALLET'
  ),
}

export const xWALLET: ChainTokenMap = {
  [ChainId.ETHEREUM]: new Token(
    ChainId.ETHEREUM,
    '0x47Cd7E91C3CBaAF266369fe8518345fc4FC12935',
    18,
    'xWALLET',
    'Ambire Wallet Staking Token'
  ),
}

export const ADX: ChainTokenMap = {
  [ChainId.ETHEREUM]: new Token(
    ChainId.ETHEREUM,
    '0xADE00C28244d5CE17D72E40330B1c318cD12B7c3',
    18,
    'ADX',
    'AdEx Network'
  ),
  [ChainId.BSC]: new Token(ChainId.BSC, '0x6bfF4Fb161347ad7de4A625AE5aa3A1CA7077819', 18, 'ADX', 'AdEx Network'),
}

export const ADX_STAKING: ChainTokenMap = {
  [ChainId.ETHEREUM]: new Token(
    ChainId.ETHEREUM,
    '0xB6456b57f03352bE48Bf101B46c1752a0813491a',
    18,
    'ADX-STAKING',
    'AdEx Staking Token'
  ),
}

export const ADX_LOYALTY: ChainTokenMap = {
  [ChainId.ETHEREUM]: new Token(
    ChainId.ETHEREUM,
    '0xd9A4cB9dc9296e111c66dFACAb8Be034EE2E1c2C',
    18,
    'ADX-LOYALTY',
    'AdEx Loyalty Token'
  ),
}

interface Logos {
  [key: string | number | ChainId]: string | any | undefined | unknown
}

export const CUSTOM_LOGOS: Logos = {
  [ChainId.ETHEREUM]: {
    [WALLET[ChainId.ETHEREUM]?.address || 'default']:
      'https://raw.githubusercontent.com/AmbireTech/ambire-brand/main/logos/Ambire_logo_250x250.png',
    [xWALLET[ChainId.ETHEREUM]?.address || 'default']:
      'https://raw.githubusercontent.com/AmbireTech/ambire-brand/main/logos/xwallet_250x250.png',
    [ADX_STAKING[ChainId.ETHEREUM]?.address || 'default']:
      'https://raw.githubusercontent.com/AmbireTech/adex-brand/master/logos/vaporwave-adex-2.png',
    [ADX_LOYALTY[ChainId.ETHEREUM]?.address || 'default']:
      'https://raw.githubusercontent.com/AmbireTech/adex-brand/master/logos/ADX-loyalty%40256x256.png',
  },
  [ChainId.BSC]: {
    [ADX[ChainId.BSC]?.address || 'default']: 'https://res.cloudinary.com/sushi-cdn/image/fetch/w_48,f_auto,q_auto',
  },
}
