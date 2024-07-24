"use client";

import React, { useState } from "react";
import { SendOutlined } from "@ant-design/icons";
import { Button, Form, Popover, Row } from "antd";
import { AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { AddressType } from "~~/types/abitype/abi";

interface MintButton {
  inkId: string;
}

const MintButton: React.FC<MintButton> = ({ inkId }) => {
  const [minting, setMinting] = useState<boolean>(false);
  const [inputAddress, setInputAddress] = useState<AddressType>("");

  const [form] = Form.useForm();

  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract("NiftyToken");

  const mint = async () => {
    setMinting(true);
    try {
      await writeYourContractAsync({
        functionName: "mint",
        args: [inputAddress, inkId],
      });
      form.resetFields();
    } catch (e) {
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
