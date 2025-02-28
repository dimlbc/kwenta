import { NetworkId } from '@synthetixio/contracts-interface';
import EthDater from 'ethereum-block-by-date';
import request, { gql } from 'graphql-request';
import { values } from 'lodash';
import { useQuery, UseQueryOptions } from 'react-query';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import QUERY_KEYS from 'constants/queryKeys';
import ROUTES from 'constants/routes';
import Connector from 'containers/Connector';
import { marketAssetsState, pastRatesState } from 'store/futures';
import logError from 'utils/logError';

import { RATES_ENDPOINT_OP_MAINNET } from './constants';
import { Price } from './types';
import { getRatesEndpoint, mapLaggedDailyPrices } from './utils';

const useLaggedDailyPrice = (options?: UseQueryOptions<Price[] | null>) => {
	const { provider, network, synthsMap } = Connector.useContainer();
	const marketAssets = useRecoilValue(marketAssetsState);
	const setPastRates = useSetRecoilState(pastRatesState);

	const minTimestamp = Math.floor(Date.now()) - 60 * 60 * 24 * 1000;
	const synths = [...marketAssets, ...values(synthsMap).map(({ name }) => name)];

	const ratesEndpoint =
		window.location.pathname === ROUTES.Home.Root
			? RATES_ENDPOINT_OP_MAINNET
			: getRatesEndpoint(network?.id as NetworkId);

	return useQuery<Price[] | null>(
		QUERY_KEYS.Rates.PastRates(network?.id as NetworkId, synths),
		async () => {
			if (!provider) return null;
			const dater = new EthDater(provider);

			const block = await dater.getDate(minTimestamp, true, false);

			try {
				const response = await request(
					ratesEndpoint,
					gql`
						query latestRates($synths: [String!]!) {
							latestRates(
								where: {
									id_in: $synths
								}
								block: { number: ${block.block} }
							) {
								id
								rate
							}
						}
					`,
					{
						synths: synths,
					}
				);
				const pastRates = response ? mapLaggedDailyPrices(response.latestRates) : [];

				setPastRates(pastRates);
				return pastRates;
			} catch (e) {
				logError(e);
				return null;
			}
		},
		{
			enabled: synths.length > 0 && marketAssets.length > 0,
			refetchInterval: 1000 * 60 * 15,
			...options,
		}
	);
};

export default useLaggedDailyPrice;
