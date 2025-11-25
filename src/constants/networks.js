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
  }
};