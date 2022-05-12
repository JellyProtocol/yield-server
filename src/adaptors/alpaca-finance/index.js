const axios = require('axios');
const utils = require('../utils');

function formatSymbol(sourceName) {
  const space = sourceName.indexOf(' ');
  return `${sourceName.substring(space + 1)} (${sourceName.substring(
    0,
    space
  )})`;
}

async function apy(chain) {
  const response = (
    await axios.get(
      `https://alpaca-static-api.alpacafinance.org/${chain}/v1/landing/summary.json`
    )
  ).data.data;

  const filteredStakingPools = response.fairLaunchStakingPools.filter(
    (p) => !p.key.includes('debt')
  );
  const fairLaunchStakingPools = filteredStakingPools.map((p) => ({
    pool: `${p.stakingToken.address}-staking`,
    chain: utils.formatChain(chainMapping[chain]),
    project: 'alpaca-finance',
    symbol: utils.formatSymbol(p.symbol),
    tvlUsd: Number(p.tvl),
    apy: Number(p.apy),
  }));

  const strategyPools = response.strategyPools.map((p) => ({
    pool: `${p.key}-strategy-pool`,
    chain: utils.formatChain(chainMapping[chain]),
    project: 'alpaca-finance',
    symbol: utils.formatSymbol(p.iuToken.symbol),
    tvlUsd: Number(p.tvl),
    apy: Number(p.apy),
  }));

  const farmingPools = response.farmingPools.map((p) => ({
    pool: `${p.key}-farming-pool`,
    chain: utils.formatChain(chainMapping[chain]),
    project: 'alpaca-finance',
    symbol: formatSymbol(p.sourceName),
    tvlUsd: Number(p.tvl),
    apy: utils.aprToApy(
      (Number(p.farmRewardApr) + Number(p.tradingFeeApr)) / p.leverage
    ),
  }));

  const ausdPools = response.ausdPools.map((p) => ({
    pool: `${p.key}-aUSD-pool`,
    chain: utils.formatChain(chainMapping[chain]),
    project: 'alpaca-finance',
    symbol: utils.formatSymbol(p.sourceName),
    tvlUsd: Number(p.tvl),
    apy: Number(p.totalApy),
  }));

  const lendingPools = response.lendingPools.map((p) => ({
    pool: `${p.ibToken.address}-lending`,
    chain: utils.formatChain(chainMapping[chain]),
    project: 'alpaca-finance',
    symbol: utils.formatSymbol(p.symbol),
    tvlUsd: Number(p.tvl),
    apy: Number(p.totalApy),
  }));

  return [
    ...fairLaunchStakingPools,
    ...strategyPools,
    ...farmingPools,
    ...ausdPools,
    ...lendingPools,
  ];
}

const chainMapping = {
  bsc: 'binance',
  ftm: 'fantom',
};

const main = async () => {
  const [bsc, ftm] = await Promise.all([apy('bsc'), apy('ftm')]);
  return [...bsc, ...ftm];
};

module.exports = {
  timetravel: false,
  apy: main,
};
