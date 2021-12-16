import React from "react";

const StatCard = props => {
    return (
        <li
            style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: "10px",
                border: "1px solid rgb(229, 229, 230)",
                padding: "10px 20px",
                minWidth: "160px",
                margin: "10px"
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{ fontSize: "14px", color: "rgba(0, 0, 0, 0.45)" }}>
                    {props.name}
                </p>
                <span>{props.emoji}</span>
            </div>
            <div>
                <p
                    style={{
                        textAlign: "left",
                        fontSize: "24px",
                        color: "rgba(0, 0, 0, 0.85)",
                        margin: 0
                    }}
                >
                    {props.value}
                </p>
            </div>
        </li>
    );
};

export default StatCard
