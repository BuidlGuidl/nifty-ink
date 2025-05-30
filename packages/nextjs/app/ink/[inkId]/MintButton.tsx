"use client";

import React, { useState } from "react";
import { SendOutlined } from "@ant-design/icons";
import { Button, Form, Popover } from "antd";
import { gnosis } from "viem/chains";
import { useAccount, useWriteContract } from "wagmi";
import { useChainSwitcher } from "~~/app/_hooks/useChainSwitcher";
import { AddressInput } from "~~/components/scaffold-eth";
import { NIFTY_TOKEN_CONTRACT } from "~~/contracts/externalContracts";
import { AddressType } from "~~/types/abitype/abi";
import { notification } from "~~/utils/scaffold-eth";

interface MintButton {
  inkId: string;
}

const MintButton: React.FC<MintButton> = ({ inkId }) => {
  const [minting, setMinting] = useState<boolean>(false);
  const [inputAddress, setInputAddress] = useState<AddressType>("");
  const { chain } = useAccount();
  const { switchTo } = useChainSwitcher();
  const { writeContractAsync } = useWriteContract();

  const [form] = Form.useForm();

  const mint = async () => {
    setMinting(true);
    if (chain?.id !== gnosis.id) {
      const switched = await switchTo(gnosis);
      if (!switched) return;
    }
    try {
      await writeContractAsync({
        abi: NIFTY_TOKEN_CONTRACT.abi,
        address: NIFTY_TOKEN_CONTRACT.address,
        functionName: "mint",
        args: [inputAddress, inkId],
      });
      notification.success("Transaction completed successfully!", {
        icon: "🎉",
      });
      form.resetFields();
    } catch (e) {
      notification.error("Failed to mint");
      console.log(e);
    } finally {
      setMinting(false);
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <Popover
      content={
        <Form form={form} layout={"inline"} name="mint" onFinish={mint} onFinishFailed={onFinishFailed}>
          <Form.Item
            name="to"
            rules={[
              {
                required: true,
                message: "Which address should receive this artwork?",
              },
            ]}
          >
            <AddressInput
              placeholder={"to address"}
              value={inputAddress ?? ""}
              onChange={value => setInputAddress(value as AddressType)}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={minting} className="mt-1">
              Mint
            </Button>
          </Form.Item>
        </Form>
      }
      title="Mint"
    >
      <Button loading={minting} icon={<SendOutlined />}>
        Mint
      </Button>
    </Popover>
  );
};

export default MintButton;
