import { wei } from '@synthetixio/wei';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilValue } from 'recoil';

import { DEFAULT_CRYPTO_DECIMALS } from 'constants/defaults';
import { NO_VALUE } from 'constants/placeholder';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import useGetFuturesDailyTradeStatsForMarket from 'queries/futures/useGetFuturesDailyTrades';
import useGetFuturesTradingVolume from 'queries/futures/useGetFuturesTradingVolume';
import useExternalPriceQuery from 'queries/rates/useExternalPriceQuery';
import {
	currentMarketState,
	fundingRateState,
	marketInfoState,
	marketKeyState,
	pastRatesState,
} from 'store/futures';
import { isFiatCurrency } from 'utils/currencies';
import { formatCurrency, formatPercent, zeroBN } from 'utils/formatters/number';
import { isDecimalFour } from 'utils/futures';

type MarketData = Record<string, { value: string | JSX.Element; color?: string }>;

const useGetMarketData = (mobile?: boolean) => {
	const { t } = useTranslation();

	const marketAsset = useRecoilValue(currentMarketState);
	const marketKey = useRecoilValue(marketKeyState);
	const marketInfo = useRecoilValue(marketInfoState);
	const pastRates = useRecoilValue(pastRatesState);
	const fundingRate = useRecoilValue(fundingRateState);

	const futuresTradingVolumeQuery = useGetFuturesTradingVolume(marketAsset);

	const { selectedPriceCurrency } = useSelectedPriceCurrency();

	const futuresTradingVolume = futuresTradingVolumeQuery?.data ?? null;
	const futuresDailyTradeStatsQuery = useGetFuturesDailyTradeStatsForMarket(marketAsset);
	const futuresDailyTradeStats = futuresDailyTradeStatsQuery?.data ?? null;

	const externalPriceQuery = useExternalPriceQuery(marketKey);
	const externalPrice = externalPriceQuery?.data ?? 0;
	const minDecimals =
		isFiatCurrency(selectedPriceCurrency.name) && isDecimalFour(marketKey)
			? DEFAULT_CRYPTO_DECIMALS
			: undefined;

	const pastPrice = pastRates.find((price) => price.synth === marketAsset);

	const fundingTitle = useMemo(
		() => `${fundingRate?.fundingTitle ?? t('futures.market.info.hourly-funding')}`,
		[fundingRate, t]
	);

	const data: MarketData = useMemo(() => {
		const fundingValue =
			!fundingRate?.fundingRate && !!fundingRate
				? marketInfo?.currentFundingRate
				: fundingRate?.fundingRate;

		const marketPrice = wei(marketInfo?.price ?? 0);
		const marketName = `${marketInfo?.marketName ?? t('futures.market.info.default-market')}`;

		if (mobile) {
			return {
				'Live Price': {
					value:
						externalPrice === 0
							? '-'
							: formatCurrency(selectedPriceCurrency.name, externalPrice, {
									sign: '$',
									minDecimals,
							  }),
				},
				'24H Trades': {
					value: !!futuresDailyTradeStats ? `${futuresDailyTradeStats ?? 0}` : NO_VALUE,
				},
				'Open Interest': {
					value: marketInfo?.marketSize?.mul(marketPrice)
						? formatCurrency(
								selectedPriceCurrency.name,
								marketInfo?.marketSize?.mul(marketPrice).toNumber(),
								{ sign: '$' }
						  )
						: NO_VALUE,
				},
				'24H Volume': {
					value: !!futuresTradingVolume
						? formatCurrency(selectedPriceCurrency.name, futuresTradingVolume ?? zeroBN, {
								sign: '$',
						  })
						: NO_VALUE,
				},
				[fundingTitle]: {
					value: fundingValue
						? formatPercent(fundingValue ?? zeroBN, { minDecimals: 6 })
						: NO_VALUE,
					color: fundingValue?.gt(zeroBN) ? 'green' : fundingValue?.lt(zeroBN) ? 'red' : undefined,
				},
				'24H Change': {
					value:
						marketPrice && marketPrice.gt(0) && pastPrice?.price
							? `${formatCurrency(
									selectedPriceCurrency.name,
									marketPrice.sub(pastPrice.price) ?? zeroBN,
									{ sign: '$', minDecimals }
							  )} (${formatPercent(marketPrice.sub(pastPrice.price).div(marketPrice) ?? zeroBN)})`
							: NO_VALUE,
					color:
						marketPrice && pastPrice?.price
							? marketPrice.sub(pastPrice.price).gt(zeroBN)
								? 'green'
								: marketPrice.sub(pastPrice.price).lt(zeroBN)
								? 'red'
								: ''
							: undefined,
				},
			};
		} else {
			return {
				[marketName]: {
					value: formatCurrency(selectedPriceCurrency.name, marketPrice, {
						sign: '$',
						minDecimals,
					}),
				},
				'External Price': {
					value:
						externalPrice === 0
							? NO_VALUE
							: formatCurrency(selectedPriceCurrency.name, externalPrice, {
									sign: '$',
									minDecimals,
							  }),
				},
				'24H Change': {
					value:
						marketPrice && marketPrice.gt(0) && pastPrice?.price
							? `${formatCurrency(
									selectedPriceCurrency.name,
									marketPrice.sub(pastPrice.price) ?? zeroBN,
									{ sign: '$', minDecimals }
							  )} (${formatPercent(marketPrice.sub(pastPrice.price).div(marketPrice) ?? zeroBN)})`
							: NO_VALUE,
					color:
						marketPrice && pastPrice?.price
							? marketPrice.sub(pastPrice.price).gt(zeroBN)
								? 'green'
								: marketPrice.sub(pastPrice.price).lt(zeroBN)
								? 'red'
								: ''
							: undefined,
				},
				'24H Volume': {
					value: !!futuresTradingVolume
						? formatCurrency(selectedPriceCurrency.name, futuresTradingVolume ?? zeroBN, {
								sign: '$',
						  })
						: NO_VALUE,
				},
				'24H Trades': {
					value: !!futuresDailyTradeStats ? `${futuresDailyTradeStats ?? 0}` : NO_VALUE,
				},
				'Open Interest': {
					value: marketInfo?.marketSize?.mul(marketPrice)
						? formatCurrency(selectedPriceCurrency.name, marketInfo?.marketSize?.mul(marketPrice), {
								sign: '$',
						  })
						: NO_VALUE,
				},
				[fundingTitle]: {
					value: fundingValue
						? formatPercent(fundingValue ?? zeroBN, { minDecimals: 6 })
						: NO_VALUE,
					color: fundingValue?.gt(zeroBN) ? 'green' : fundingValue?.lt(zeroBN) ? 'red' : undefined,
				},
			};
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		marketAsset,
		marketInfo,
		futuresTradingVolume,
		futuresDailyTradeStats,
		selectedPriceCurrency.name,
		externalPrice,
		pastPrice?.price,
		fundingRate,
		minDecimals,
		fundingTitle,
		t,
	]);

	return data;
};

export default useGetMarketData;
