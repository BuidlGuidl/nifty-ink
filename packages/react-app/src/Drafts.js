import React, { useCallback } from "react";
import { Button, Row, Divider, Typography, Popconfirm } from "antd";
import { useHistory } from "react-router-dom";
import Blockies from "react-blockies";
import { DeleteOutlined, HighlightOutlined } from "@ant-design/icons";

import { useLocalStorage } from "./hooks";

const { Text } = Typography;

export default function Drafts(props) {
  const history = useHistory();
  const [drafts, setDrafts] = useLocalStorage("drafts", []);
  const { address, ens, setDrawing } = props;

  const goDraft = useCallback(
    savedData => {
      setDrawing(savedData);
      history.push("/create");
    },
    [history, setDrawing]
  );

  const deleteDraft = useCallback(
    index => {
      setDrafts(drafts => {
        const filtered = drafts.filter((_, idx) => idx !== index);
        return filtered;
      });
    },
    [setDrafts]
  );

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
      <Blockies
        seed={address.toLowerCase()}
        size={12}
        scale={6}
        className="holdings_blockie"
      />
      <h2 style={{ margin: 10 }}>
        <Text copyable={{ text: ens ? ens : address }}>
          {ens ? ens : address.slice(0, 6)}
        </Text>
      </h2>
      <Row justify="centre">
        <p style={{ margin: "auto" }}>
          <b>All Drafts:</b> {drafts.length}
        </p>
      </Row>
      <Divider />
      {drafts.length === 0 && <p>You do not have any saved drafts</p>}
      <div className="inks-grid">
        <ul style={{ padding: 0, textAlign: "center", listStyle: "none" }}>
          {drafts.map((draft, i) => (
            <li
              key={i}
              style={{
                display: "inline-block",
                verticalAlign: "top",
                margin: 4,
                padding: 5,
                border: "1px solid #e5e5e6",
                borderRadius: "10px",
                fontWeight: "bold"
              }}
            >
              <img
                src={draft.imageData}
                alt="Draft"
                width="150"
                style={{
                  border: "1px solid #e5e5e6",
                  borderRadius: "10px"
                }}
              />
              <Row justify={"center"}>
                <Popconfirm
                  title="This will overwrite the current drawing, are you sure?"
                  onConfirm={() => {
                    goDraft(draft.savedData);
                  }}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button size="small" type="secondary" style={{ margin: 8 }}>
                    <HighlightOutlined /> Use
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
                  <Button size="small" type="secondary" style={{ margin: 8 }}>
                    <DeleteOutlined /> Delete
                  </Button>
                </Popconfirm>
              </Row>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
