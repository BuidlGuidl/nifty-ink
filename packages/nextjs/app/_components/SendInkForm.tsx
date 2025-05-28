"use client";

import React, { useState } from "react";
import { useChainSwitcher } from "../_hooks/useChainSwitcher";
import { Button, Form } from "antd";
import { gnosis } from "viem/chains";
import { useAccount, useWriteContract } from "wagmi";
import { AddressInput } from "~~/components/scaffold-eth";
import { NIFTY_TOKEN_CONTRACT } from "~~/contracts/externalContracts";
import { AddressType } from "~~/types/abitype/abi";
import { notification } from "~~/utils/scaffold-eth";

interface SendInkFormProps {
  connectedAddress: string;
  tokenId: string;
}

const SendInkForm: React.FC<SendInkFormProps> = ({ connectedAddress, tokenId }) => {
  const [sending, setSending] = useState<boolean>(false);
  const [inputAddress, setInputAddress] = useState<AddressType>("");
  const { chain } = useAccount();
  const { switchTo } = useChainSwitcher();
  const { writeContractAsync } = useWriteContract();

  const [form] = Form.useForm();

  const sendInk = async () => {
    setSending(true);
    if (chain?.id !== gnosis.id) {
      const switched = await switchTo(gnosis);
      if (!switched) return;
    }
    try {
      await writeContractAsync({
        abi: NIFTY_TOKEN_CONTRACT.abi,
        address: NIFTY_TOKEN_CONTRACT.address,
        functionName: "safeTransferFrom",
        args: [connectedAddress, inputAddress, BigInt(tokenId)],
      });
      notification.success("Transaction completed successfully!", {
        icon: "🎉",
      });
      form.resetFields();
    } catch (e) {
      console.log(e);
      notification.error("Failed to send ink");
    } finally {
      setSending(false);
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <Form form={form} layout={"inline"} name="sendInk" onFinish={sendInk} onFinishFailed={onFinishFailed}>
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
        <Button type="primary" htmlType="submit" loading={sending} className="mt-1">
          Send
        </Button>
      </Form.Item>
    </Form>
  );
};

export default SendInkForm;
