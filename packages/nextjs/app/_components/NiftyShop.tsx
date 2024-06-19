"use client";

import { useState } from "react";
import { ShopOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Button, Form, InputNumber, Popover, Row } from "antd";
import { formatEther, parseEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const NiftyShop = ({ price, itemForSale }: { price: number; itemForSale: string }) => {
  const [newPrice, setNewPrice] = useState<number>(0);
  const [buying, setBuying] = useState(false);

  const [priceForm] = Form.useForm();

  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract("NiftyToken");

  const setPrice = async (values: any) => {
    setBuying(true);
    try {
      await writeYourContractAsync({
        functionName: "setTokenPrice",
        args: [BigInt(itemForSale), parseEther(String(values["price"]))],
      });
    } catch (e) {
      setBuying(false);
      notification.error("Price set unsuccessful");
    } finally {
      setBuying(false);
    }
  };

  const onFinishFailed = (errorFields: any) => {
    console.log("Failed:", errorFields);
  };

  return (
    <Popover
      content={
        <Row style={{ justifyContent: "center" }}>
          <Form form={priceForm} layout={"inline"} name="setPrice" onFinish={setPrice} onFinishFailed={onFinishFailed}>
            <Form.Item name="price" rules={[{ required: true, message: "What is the price of this ink?" }]}>
              <InputNumber min={0} precision={3} onChange={newVal => setNewPrice(Number((newVal || 0).toFixed(3)))} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={buying}>
                Set Price
              </Button>
            </Form.Item>
          </Form>
        </Row>
      }
      title={"Set price:"}
      placement="left"
    >
      <Button icon={<ShopOutlined />} size="small" className="m-1">
        {newPrice > 0 ? "$" + newPrice : price > 0 ? "$" + parseFloat(formatEther(BigInt(price))).toFixed(2) : "Sell"}
      </Button>
    </Popover>
  );
};
