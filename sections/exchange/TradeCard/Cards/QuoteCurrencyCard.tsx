import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilValue } from 'recoil';

import { useExchangeContext } from 'contexts/ExchangeContext';
import { quoteCurrencyKeyState, quoteCurrencyAmountState } from 'store/exchange';

import CurrencyCard from '../CurrencyCard';

const QuoteCurrencyCard: React.FC = React.memo(() => {
	const { t } = useTranslation();
	const quoteCurrencyKey = useRecoilValue(quoteCurrencyKeyState);
	const quoteCurrencyAmount = useRecoilValue(quoteCurrencyAmountState);

	const {
		quoteCurrencyBalance,
		setOpenModal,
		allTokensMap,
		quotePriceRate,
		onQuoteCurrencyAmountChange,
		onQuoteBalanceClick,
	} = useExchangeContext();

	const openQuoteModal = React.useCallback(() => setOpenModal('quote-select'), [setOpenModal]);

	return (
		<CurrencyCard
			side="quote"
			currencyKey={quoteCurrencyKey}
			currencyName={quoteCurrencyKey ? allTokensMap[quoteCurrencyKey]?.name : null}
			amount={quoteCurrencyAmount}
			onAmountChange={onQuoteCurrencyAmountChange}
			walletBalance={quoteCurrencyBalance}
			onBalanceClick={onQuoteBalanceClick}
			onCurrencySelect={openQuoteModal}
			priceRate={quotePriceRate}
			label={t('exchange.common.from')}
		/>
	);
});

export default QuoteCurrencyCard;
