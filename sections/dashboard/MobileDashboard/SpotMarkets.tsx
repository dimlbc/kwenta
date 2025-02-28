import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useExchangeRatesQuery from 'queries/rates/useExchangeRatesQuery';
import { SectionHeader, SectionTitle } from 'sections/futures/MobileTrade/common';

import SpotMarketsTable from '../SpotMarketsTable';
import { HeaderContainer } from './common';

const SpotMarkets: React.FC = () => {
	const { t } = useTranslation();
	const exchangeRatesQuery = useExchangeRatesQuery();
	const exchangeRates = exchangeRatesQuery.isSuccess ? exchangeRatesQuery.data ?? null : null;

	return (
		<>
			<CustomHeaderContainer>
				<CustomSectionHeader>
					<SectionTitle>{t('dashboard.overview.markets-tabs.spot')}</SectionTitle>
				</CustomSectionHeader>
			</CustomHeaderContainer>

			<SpotMarketsTable exchangeRates={exchangeRates} />
		</>
	);
};

const CustomHeaderContainer = styled(HeaderContainer)`
	margin-bottom: 0px;
	padding-bottom: 0px;
`;

const CustomSectionHeader = styled(SectionHeader)`
	margin-bottom: 0px;
`;

export default SpotMarkets;
