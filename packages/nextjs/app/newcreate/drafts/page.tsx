"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Profile } from "../../_components/Profile";
import { DeleteOutlined, HighlightOutlined } from "@ant-design/icons";
import { Button, Divider, Popconfirm, Row, Typography } from "antd";
import { useLocalStorage } from "usehooks-ts";
import { useAccount } from "wagmi";

const { Text } = Typography;

const Drafts = () => {
  const { address: connectedAddress } = useAccount();
  const router = useRouter();
  const [drafts, setDrafts] = useLocalStorage<Draft[]>("drafts", []);
  const [drawing, setDrawing] = useLocalStorage<string>("drawing", "");

  const goDraft = useCallback(
    (savedData: any) => {
      setDrawing(savedData);
      router.push("/create");
    },
    [setDrawing],
  );

  const deleteDraft = useCallback(
    (index: number) => {
      setDrafts(drafts => {
        const filtered = drafts.filter((_, idx) => idx !== index);
        return filtered;
      });
    },
    [setDrafts],
  );
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
      <Profile address={connectedAddress || ""} />
      <Row>
        <p style={{ margin: "auto" }}>
          <b>All Drafts:</b> {drafts.length}
        </p>
      </Row>
      <Divider />
      {drafts.length === 0 && <p>You do not have any saved drafts</p>}
      <div className="inks-grid">
        <ul style={{ padding: 0, textAlign: "center", listStyle: "none" }}>
          {drafts.map((draft: Draft, i: number) => (
            <li
              key={i}
              style={{
                display: "inline-block",
                verticalAlign: "top",
                margin: 4,
                padding: 5,
                border: "1px solid #e5e5e6",
                borderRadius: "10px",
                fontWeight: "bold",
              }}
            >
              <img
                src={draft?.imageData}
                alt="Draft"
                width="150"
                style={{
                  border: "1px solid #e5e5e6",
                  borderRadius: "10px",
                }}
              />
              <Row justify={"center"}>
                <Popconfirm
                  title="This will overwrite the current drawing, are you sure?"
                  onConfirm={() => {
                    goDraft(draft?.savedData);
                  }}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button size="small" style={{ margin: 8 }} icon={<HighlightOutlined />}>
                    Use
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title="This will permanently delete this draft, are you sure?"
                  onConfirm={() => {
                    deleteDraft(i);
                  }}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button size="small" style={{ margin: 8 }} icon={<DeleteOutlined />}>
                    Delete
                  </Button>
                </Popconfirm>
              </Row>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Drafts;
