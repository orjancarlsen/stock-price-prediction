import React from "react";
import { Order, IconSVGType, OrderStatus } from "../../types";
import { formatSingleDecimal, orderTypeMap } from "../../utils";
import { IconSVG } from "./../IconSVG";

interface SingleOrderProps {
  order: Order;
}

const SingleOrder: React.FC<SingleOrderProps> = ({ order }) => {
  const formattedAmount = formatSingleDecimal(order.amount);
  const formattedPrice = `${order.price_per_share.toLocaleString()} NOK`;

    const gridTemplateColumns = "50px 1fr 140px";

    const iconType = order.status === 'PENDING' ? order.status : order.order_type;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: gridTemplateColumns,
        alignItems: "center",
        backgroundColor: "#f9f9f9",
        border: "1px solid #ccc",
        borderRadius: "4px",
      }}
    >
      {/* Column 1: Icon and Order Type */}
      <div style={{ padding: "8px", textAlign: "center" }}>
        <IconSVG
            icon={iconType as IconSVGType}
            width={28}
            height={28}
        />
        <div style={{ fontSize: "0.7rem", marginTop: "4px" }}>
          {orderTypeMap[order.order_type]}
        </div>
      </div>

      {/* Column 2: Order Name and Amount */}
      <div
        style={{
          padding: "8px",
          fontSize: "0.9rem",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div>{order.name}</div>
        <div>{formattedAmount}</div>
      </div>

      {/* Column 3: Number of Shares and Price */}
      <div
        style={{
          padding: "8px",
          fontSize: "0.9rem",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div>
          <span style={{ minWidth: "48px", display: "inline-block" }}>
            Antall:
          </span>
          {order.number_of_shares}
        </div>
        <div>
          <span style={{ minWidth: "48px", display: "inline-block" }}>
            Pris:
          </span>
          {formattedPrice}
        </div>
      </div>
    </div>
  );
};

export default SingleOrder;
