import React from 'react';
import { IconSVGType } from '../types';
import CalendarIcon from '@assets/calendar.svg';
import AddToCartIcon from '@assets/add-to-cart.svg';
import RemoveFromCartIcon from '@assets/remove-from-cart.svg';
import DepositIcon from '@assets/deposit.svg';
import WithdrawIcon from '@assets/withdraw.svg';


interface IconSVGProps {
    icon: IconSVGType;
    width?: number;
    height?: number;
}

export const IconSVG = ({ icon, width = 20, height = 20 }: IconSVGProps) => {
    switch (icon) {
        case IconSVGType.Calendar:
            return <CalendarIcon width={width} height={height} />;
        case IconSVGType.Buy:
            return <AddToCartIcon width={width} height={height} />;
        case IconSVGType.Sell:
            return <RemoveFromCartIcon width={width} height={height} />;
        case IconSVGType.Deposit:
            return <DepositIcon width={width} height={height} />;
        case IconSVGType.Withdraw:
            return <WithdrawIcon width={width} height={height} />;
        default:
            return null;
    }
};