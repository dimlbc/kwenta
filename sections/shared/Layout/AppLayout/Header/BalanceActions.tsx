import { useRouter } from 'next/router';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { components } from 'react-select';
import { useRecoilValue } from 'recoil';
import styled, { useTheme } from 'styled-components';

import Button from 'components/Button';
import CurrencyIcon from 'components/Currency/CurrencyIcon';
import Select from 'components/Select';
import useSUSDBalance from 'hooks/useSUSDBalance';
import { positionsState } from 'store/futures';
import { FlexDivRow, FlexDivRowCentered } from 'styles/common';
import { zeroBN, formatDollars } from 'utils/formatters/number';
import { FuturesMarketAsset, getMarketName, MarketKeyByAsset } from 'utils/futures';

type ReactSelectOptionProps = {
	label: string;
	synthIcon: string;
	marketRemainingMargin?: string;
	onClick?: () => {};
};

const BalanceActions: FC = () => {
	const [balanceLabel, setBalanceLabel] = useState('');
	const { t } = useTranslation();
	const theme = useTheme();
	const router = useRouter();
	const sUSDBalance = useSUSDBalance();

	const futuresPositions = useRecoilValue(positionsState);

	const accessiblePositions = useMemo(
		() => futuresPositions?.filter((position) => position.remainingMargin.gt(zeroBN)) ?? [],
		[futuresPositions]
	);

	const totalRemainingMargin = accessiblePositions.reduce(
		(prev, position) => prev.add(position.remainingMargin),
		zeroBN
	);

	const setMarketConfig = useCallback(
		(asset: FuturesMarketAsset): ReactSelectOptionProps => {
			const remainingMargin =
				accessiblePositions.find((position) => position.asset === asset)?.remainingMargin ?? zeroBN;

			return {
				label: getMarketName(asset),
				synthIcon: MarketKeyByAsset[asset],
				marketRemainingMargin: formatDollars(remainingMargin),
				onClick: () => router.push(`/market/?asset=${asset}`),
			};
		},
		[accessiblePositions, router]
	);

	const OPTIONS = useMemo(
		() => [
			{
				label: 'header.balance.total-margin-label',
				totalAvailableMargin: formatDollars(totalRemainingMargin),
				options: accessiblePositions.map((market) => setMarketConfig(market.asset)),
			},
		],
		[accessiblePositions, setMarketConfig, totalRemainingMargin]
	);

	const OptionsGroupLabel: FC<{ label: string; totalAvailableMargin?: string }> = ({
		label,
		totalAvailableMargin,
	}) => {
		return (
			<FlexDivRow>
				<Container>{t(label)}</Container>
				<Container>{totalAvailableMargin}</Container>
			</FlexDivRow>
		);
	};

	const formatOptionLabel = ({
		label,
		synthIcon,
		marketRemainingMargin,
		onClick,
	}: ReactSelectOptionProps) => (
		<LabelContainer onClick={onClick}>
			<FlexDivRow>
				{synthIcon && <StyledCurrencyIcon currencyKey={synthIcon} width="24px" height="24px" />}
				<StyledLabel noPadding={!synthIcon}>{t(label)}</StyledLabel>
			</FlexDivRow>
			<Container>{marketRemainingMargin}</Container>
		</LabelContainer>
	);

	const GetUsdButton = () => (
		<StyledButton textTransform="none" onClick={() => router.push(`/exchange/?quote=sUSD`)}>
			{t('header.balance.get-more-susd')}
		</StyledButton>
	);

	const Group: FC<any> = ({ children, ...props }) => (
		<components.Group {...props}>
			<StyledOptions>{children}</StyledOptions>
			<GetUsdButton />
		</components.Group>
	);

	const NoOptionsMessage: FC<any> = (props) => {
		return (
			<components.NoOptionsMessage {...props}>
				<span>{t('header.balance.no-accessible-margin')}</span>
				<GetUsdButton />
			</components.NoOptionsMessage>
		);
	};

	useEffect(() => {
		setBalanceLabel(formatDollars(sUSDBalance, { sign: '$' }));
	}, [balanceLabel, sUSDBalance]);

	if (!balanceLabel) {
		return null;
	}

	return (
		<Container>
			{sUSDBalance.eq(zeroBN) && futuresPositions?.length === 0 ? (
				<StyledWidgetButton
					textTransform="none"
					onClick={() => router.push(`/exchange/?quote=sUSD`)}
					noOutline
				>
					<StyledCurrencyIcon currencyKey={'sUSD'} width="20px" height="20px" />
					{t('header.balance.get-susd')}
				</StyledWidgetButton>
			) : (
				<BalanceSelect
					formatOptionLabel={formatOptionLabel}
					formatGroupLabel={OptionsGroupLabel}
					controlHeight={41}
					options={OPTIONS}
					value={{ label: balanceLabel, synthIcon: 'sUSD' }}
					menuWidth={290}
					maxMenuHeight={500}
					optionPadding={'0px'} //override default padding to 0
					optionBorderBottom={theme.colors.selectedTheme.border}
					components={{
						Group,
						NoOptionsMessage,
						DropdownIndicator: undefined,
						IndicatorSeparator: undefined,
					}}
					isSearchable={false}
					variant="flat"
				></BalanceSelect>
			)}
		</Container>
	);
};

export default BalanceActions;

const Container = styled.div`
	font-size: 12px;
	font-family: ${(props) => props.theme.fonts.mono};
`;

const BalanceSelect = styled(Select)<{ value: { label: string } }>`
	.react-select__control {
		width: ${(props) => 5 * props.value.label.length + 80}px;
	}

	.react-select__group {
		padding: 20px;

		.react-select__group-heading {
			color: ${(props) => props.theme.colors.selectedTheme.button.text.primary};
			font-size: 12px;
			padding: 0;
			margin-bottom: 15px;
			text-transform: none;
		}
	}

	.react-select__value-container {
		padding: 0px;
		display: flex;
		justify-content: center;
	}

	.react-select__menu-notice--no-options {
		padding: 15px;
	}
`;

const StyledOptions = styled.div`
	border-radius: 10px;
	border: ${(props) => props.theme.colors.selectedTheme.border};
`;

const StyledCurrencyIcon = styled(CurrencyIcon)`
	margin-right: 5px;
	height: auto;
	width: 20px;
`;

const StyledLabel = styled.div<{ noPadding: boolean }>`
	white-space: nowrap;
`;

const LabelContainer = styled(FlexDivRowCentered)`
	color: ${(props) => props.theme.colors.selectedTheme.button.text.primary};
	font-size: 13px;
	padding: 10px;
	> div {
		align-items: center;
	}
`;

const StyledButton = styled(Button)`
	width: 100%;
	height: 41px;
	font-size: 13px;
	margin-top: 15px;
	align-items: center;
`;

const StyledWidgetButton = styled(Button)`
	height: 41px;
	font-size: 13px;
	font-family: ${(props) => props.theme.fonts.mono};
	padding: 10px;
	white-space: nowrap;
	display: flex;
	justify-content: space-between;
	align-items: center;
`;
