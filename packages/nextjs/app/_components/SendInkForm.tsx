"use client";

import React, { useState } from "react";
import { Button, Form } from "antd";
import { AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { AddressType } from "~~/types/abitype/abi";

interface SendInkFormProps {
  connectedAddress: string;
  tokenId: string;
}

const SendInkForm: React.FC<SendInkFormProps> = ({ connectedAddress, tokenId }) => {
  const [sending, setSending] = useState<boolean>(false);
  const [inputAddress, setInputAddress] = useState<AddressType>("");

  const [form] = Form.useForm();

  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract("NiftyToken");

  const sendInk = async () => {
    setSending(true);
    try {
      await writeYourContractAsync({
        functionName: "safeTransferFrom",
        // @ts-ignore Suppress type error for the next line
        args: [connectedAddress, inputAddress, BigInt(tokenId)],
      });
      form.resetFields();
    } catch (e) {
      console.log(e);
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
