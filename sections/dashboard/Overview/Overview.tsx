import useSynthetixQueries from '@synthetixio/queries';
import { wei } from '@synthetixio/wei';
import { FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilState } from 'recoil';
import styled from 'styled-components';

import TabButton from 'components/Button/TabButton';
import { DesktopOnlyView, MobileOrTabletView } from 'components/Media';
import { TabPanel } from 'components/Tab';
import Connector from 'containers/Connector';
import useGetCurrentPortfolioValue from 'queries/futures/useGetCurrentPortfolioValue';
import useGetFuturesPositionForAccount from 'queries/futures/useGetFuturesPositionForAccount';
import useExchangeRatesQuery from 'queries/rates/useExchangeRatesQuery';
import { CompetitionBanner } from 'sections/shared/components/CompetitionBanner';
import { activePositionsTabState } from 'store/ui';
import { formatDollars, zeroBN } from 'utils/formatters/number';

import FuturesMarketsTable from '../FuturesMarketsTable';
import FuturesPositionsTable from '../FuturesPositionsTable';
import { MarketsTab } from '../Markets/Markets';
import MobileDashboard from '../MobileDashboard';
import PortfolioChart from '../PortfolioChart';
import SpotMarketsTable from '../SpotMarketsTable';
import SynthBalancesTable from '../SynthBalancesTable';

const Overview: FC = () => {
	const { t } = useTranslation();

	const { useSynthsBalancesQuery } = useSynthetixQueries();

	const portfolioValueQuery = useGetCurrentPortfolioValue();
	const portfolioValue = portfolioValueQuery?.data ?? null;

	const futuresPositionQuery = useGetFuturesPositionForAccount();
	const futuresPositionHistory = futuresPositionQuery?.data ?? [];

	const exchangeRatesQuery = useExchangeRatesQuery();
	const exchangeRates = exchangeRatesQuery.isSuccess ? exchangeRatesQuery.data ?? null : null;

	const { walletAddress } = Connector.useContainer();
	const synthsBalancesQuery = useSynthsBalancesQuery(walletAddress);
	const synthBalances =
		synthsBalancesQuery.isSuccess && synthsBalancesQuery.data != null
			? synthsBalancesQuery.data
			: null;

	const [activePositionsTab, setActivePositionsTab] = useRecoilState(activePositionsTabState);
	const [activeMarketsTab, setActiveMarketsTab] = useState<MarketsTab>(MarketsTab.FUTURES);

	const totalSpotBalancesValue = formatDollars(wei(synthBalances?.totalUSDBalance ?? zeroBN));

	const totalFuturesPortfolioValue = formatDollars(wei(portfolioValue ?? zeroBN));

	const POSITIONS_TABS = useMemo(
		() => [
			{
				name: MarketsTab.FUTURES,
				label: t('dashboard.overview.positions-tabs.futures'),
				badge: futuresPositionQuery?.data?.length,
				active: activePositionsTab === MarketsTab.FUTURES,
				detail: totalFuturesPortfolioValue,
				disabled: false,
				onClick: () => setActivePositionsTab(MarketsTab.FUTURES),
			},
			{
				name: MarketsTab.SPOT,
				label: t('dashboard.overview.positions-tabs.spot'),
				active: activePositionsTab === MarketsTab.SPOT,
				detail: totalSpotBalancesValue,
				disabled: false,
				onClick: () => setActivePositionsTab(MarketsTab.SPOT),
			},
		],
		[
			futuresPositionQuery?.data?.length,
			activePositionsTab,
			setActivePositionsTab,
			t,
			totalFuturesPortfolioValue,
			totalSpotBalancesValue,
		]
	);

	const MARKETS_TABS = useMemo(
		() => [
			{
				name: MarketsTab.FUTURES,
				label: t('dashboard.overview.markets-tabs.futures'),
				active: activeMarketsTab === MarketsTab.FUTURES,
				onClick: () => setActiveMarketsTab(MarketsTab.FUTURES),
			},
			{
				name: MarketsTab.SPOT,
				label: t('dashboard.overview.markets-tabs.spot'),
				active: activeMarketsTab === MarketsTab.SPOT,
				onClick: () => setActiveMarketsTab(MarketsTab.SPOT),
			},
		],
		[activeMarketsTab, setActiveMarketsTab, t]
	);

	return (
		<>
			<DesktopOnlyView>
				<CompetitionBanner />

				<PortfolioChart />

				<TabButtonsContainer>
					{POSITIONS_TABS.map(({ name, label, ...rest }) => (
						<TabButton key={name} title={label} {...rest} />
					))}
				</TabButtonsContainer>
				<TabPanel name={MarketsTab.FUTURES} activeTab={activePositionsTab}>
					<FuturesPositionsTable futuresPositionHistory={futuresPositionHistory} />
				</TabPanel>

				<TabPanel name={MarketsTab.SPOT} activeTab={activePositionsTab}>
					<SynthBalancesTable
						synthBalances={synthBalances?.balances ?? []}
						exchangeRates={exchangeRates}
					/>
				</TabPanel>

				<TabButtonsContainer>
					{MARKETS_TABS.map(({ name, label, active, onClick }) => (
						<TabButton key={name} title={label} active={active} onClick={onClick} />
					))}
				</TabButtonsContainer>
				<TabPanel name={MarketsTab.FUTURES} activeTab={activeMarketsTab}>
					<FuturesMarketsTable />
				</TabPanel>

				<TabPanel name={MarketsTab.SPOT} activeTab={activeMarketsTab}>
					<SpotMarketsTable exchangeRates={exchangeRates} />
				</TabPanel>
			</DesktopOnlyView>
			<MobileOrTabletView>
				<MobileDashboard />
			</MobileOrTabletView>
		</>
	);
};

const TabButtonsContainer = styled.div`
	display: flex;
	margin-top: 16px;
	margin-bottom: 16px;

	& > button {
		&:not(:last-of-type) {
			margin-right: 14px;
		}
	}
`;

export default Overview;
