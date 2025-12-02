import { SEPOLIA_PRICE_PAIRS, BASE_PRICE_PAIRS, SAGA_PRICE_PAIRS } from './dataFeedConstants';
import { BidirectionalMap } from '../utils/bidirectionalMap';

function createPairsMap(pairs) {
    const map = new BidirectionalMap();
    Object.entries(pairs).forEach(([feedName, queryId]) => {
      map.set(feedName, queryId);
    });
    return map;
  }

export const networks = {
  "SAGAEVM": {
    explorerUrl: "https://sagaevm.sagaexplorer.io/",
    defaultAvgBlockTime: 2,
    pricePairs: createPairsMap(SAGA_PRICE_PAIRS)
  },
  "ETHSEPOLIA": {
    explorerUrl: "https://sepolia.etherscan.io/",
    defaultAvgBlockTime: 12,
    pricePairs: createPairsMap(SEPOLIA_PRICE_PAIRS)
  },
  "BASEMAINNET": {
    explorerUrl: "https://basescan.org/",
    defaultAvgBlockTime: 2,
    pricePairs: createPairsMap(BASE_PRICE_PAIRS)
  },
  "ETHMAINNET": {
    explorerUrl: "https://etherscan.io/",
    defaultAvgBlockTime: 12,
    pricePairs: createPairsMap({'ETH/USD': '0x83a7f3d48786ac2667503a61e8c415438ed2922eb86a2906e4ee66d9a2ce4992'}) // Add ETH Mainnet price pairs here if needed
  }
};