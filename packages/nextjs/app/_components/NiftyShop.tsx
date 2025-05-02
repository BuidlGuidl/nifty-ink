"use client";

import { useState } from "react";
import { ShopOutlined } from "@ant-design/icons";
import { Button, Form, InputNumber, Popover, Row } from "antd";
import { TooltipPlacement } from "antd/es/tooltip";
import { formatEther, parseEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const NiftyShop = ({
  price,
  itemForSale,
  placement = "left",
  type,
  connectedAddress,
}: {
  price: number;
  itemForSale: string;
  placement: TooltipPlacement;
  type: string;
  connectedAddress: string;
}) => {
  const [newPrice, setNewPrice] = useState<number>(0);
  const [buying, setBuying] = useState(false);

  const [priceForm] = Form.useForm();

  const { writeContractAsync: writeYourContractAsyncToken } = useScaffoldWriteContract("NiftyToken");
  const { writeContractAsync: writeYourContractAsyncInk } = useScaffoldWriteContract("NiftyInk");

  const setPrice = async (values: any) => {
    setBuying(true);

    try {
      if (type === "ink") {
        await writeYourContractAsyncInk({
          functionName: "setPrice",
          args: [itemForSale, parseEther(String(values["price"]))],
        });
      } else {
        await writeYourContractAsyncToken({
          functionName: "setTokenPrice",
          args: [BigInt(itemForSale), parseEther(String(values["price"]))],
        });
      }
    } catch (e) {
      setBuying(false);
      console.log(e);
      notification.error("Price set unsuccessful");
    } finally {
      setBuying(false);
    }
  };

  const onFinishFailed = (errorFields: any) => {
    console.log("Failed:", errorFields);
  };

  const setPriceForm = (
    <Row style={{ justifyContent: "center" }}>
      <Form form={priceForm} layout={"inline"} name="setPrice" onFinish={setPrice} onFinishFailed={onFinishFailed}>
        <Form.Item name="price" rules={[{ required: true, message: "price of this ink?" }]}>
          <InputNumber
            min={0}
            precision={3}
            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            onChange={newVal => setNewPrice(Number((newVal || 0).toFixed(3)))}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={buying}>
            Set Price
          </Button>
        </Form.Item>
      </Form>
    </Row>
  );

  return (
    <>
      {type === "token" ? (
        <Popover content={setPriceForm} title={"Set price:"} placement={placement}>
          <Button icon={<ShopOutlined />} size="small" className="m-1">
            {newPrice > 0
              ? "$" + newPrice
              : price > 0
              ? "$" + parseFloat(formatEther(BigInt(price))).toFixed(2)
              : "Sell"}
          </Button>
        </Popover>
      ) : type === "ink" && (price > 0 || newPrice > 0) ? (
        <Popover content={setPriceForm} title={"Set price:"}>
          <Button icon={<ShopOutlined />}>
            {newPrice > 0 ? "$" + newPrice : "$" + parseFloat(formatEther(BigInt(price))).toFixed(2)}
          </Button>
        </Popover>
      ) : (
        <Popover content={setPriceForm} title={"Set price:"}>
          <Button icon={<ShopOutlined />}>
            {newPrice > 0
              ? "$" + newPrice
              : price > 0
              ? "$" + parseFloat(formatEther(BigInt(price))).toFixed(2)
              : "Set price"}
          </Button>
        </Popover>
      )}
    </>
  );
};
