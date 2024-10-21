import React from "react";
import { Button, Form, Input, InputNumber } from "antd";

interface CreateInkFormProps {
  onFinish: (values: any) => void;
  sending: boolean;
}

export const CreateInkForm: React.FC<CreateInkFormProps> = ({ onFinish, sending }) => {
  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <Form
      layout="inline"
      name="createInk"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      labelAlign="left"
      style={{ justifyContent: "center" }}
    >
      <Form.Item name="title" rules={[{ required: true, message: "What is this work of art called?" }]}>
        <Input placeholder="name" style={{ fontSize: 16 }} />
      </Form.Item>

      <Form.Item name="limit" rules={[{ required: true, message: "How many inks can be minted?" }]}>
        <InputNumber placeholder="limit" style={{ fontSize: 16 }} min={0} precision={0} />
      </Form.Item>

      <Form.Item>
        <Button loading={sending} type="primary" htmlType="submit">
          Ink!
        </Button>
      </Form.Item>
    </Form>
  );
};
