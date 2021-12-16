import {useQuery} from "react-apollo";
import React, { useState, useEffect } from "react";
import LineChart from './LineChart';
import moment from 'moment'
import ToolTip  from './ToolTip.js'
import {LAST_30_DAILY_TOTALS, TOP_ARTISTS_QUERY} from "./apollo/queries";
import {useHistory, useLocation} from "react-router-dom";
import {Col, Form, Row, Select, Typography} from "antd";
import {Loader} from "./components";
import { ethers } from "ethers";


const dayjs = require("dayjs");
const { Option } = Select;


function useSearchParams() {
    let _params = new URLSearchParams(useLocation().search);
    return _params;
}

export default function Stats(props) {
    const [hoverLoc, setHoverLoc] = useState(null)
    const [activePoint, setActivePoint] = useState(null)
    const [finalData, setFinalData] = useState(null)
    const [dailyTotals, setDailyTotals] = useState(null)

    let location = useLocation();
    let history = useHistory();
    let searchParams = useSearchParams();
    let [metric, setMetric] = useState(searchParams.get("metric") || "tokens");
    let date = dayjs().startOf("day")
        .subtract(30, "days")
        .unix()

    const handleChartHover = (hoverLoc, activePoint) => {
        setHoverLoc(hoverLoc)
        setActivePoint(activePoint)
    }

    const {loading, error, data} = useQuery(LAST_30_DAILY_TOTALS, {
        variables: {
            date: date
        }
    });

    // console.log("DATA", data)
    // console.log("error", error)

    useEffect(() => {
        if (data) {
            setDailyTotals(data.dailyTotals)
        } else {
            console.log("loading 1")
        }

    }, [data]);

    useEffect( () => {
        if (dailyTotals) {
            setFinalData(dailyTotals.map((x, count) => {
                return {
                    d: moment.unix(x.day).format('MMM DD'),
                    p: metric === "saleValue" ? ethers.utils.formatEther(x[metric]).toLocaleString() : x[metric].toLocaleString(),
                    x: count,
                    y: metric === "saleValue" ? parseFloat(ethers.utils.formatEther(x[metric])) : parseFloat(x[metric])
                }
            }))
        }else {
            console.log("loading 2")
        }
    }, [dailyTotals, metric, setMetric])

    if (loading) return <Loader />;
    if (error) return `Error! ${error.message}`;
    return (
        <div style={{ marginLeft: "16px", marginTop: "16px", textAlign: "left" }}>
            <div className='container' align="center">
                <div className='row' align="center">
                    <Typography.Title level={3}>Daily statistics over the previous month</Typography.Title>
                </div>
                <Row align="center" gutter={16}>
                    <Col>
                        <Form
                            layout={"inline"}
                            initialValues={{ metric: metric }}
                        >
                            <Form.Item name="metric" size="large">
                                <Select
                                    value={metric}
                                    size="large"
                                    onChange={val => {
                                        searchParams.set("metric", val);
                                        history.push(
                                            `${location.pathname}?${searchParams.toString()}`
                                        );
                                       setMetric(val)
                                    }}
                                >
                                    <Option value="tokens">Tokens</Option>
                                    <Option value="inks">Inks</Option>
                                    <Option value="sales">Sales</Option>
                                    <Option value="upgrades">Upgrades</Option>
                                    <Option value="artists">Artists</Option>
                                    <Option value="saleValue">Sale Value</Option>
                                    <Option value="users">Users</Option>
                                </Select>
                            </Form.Item>
                        </Form>
                    </Col>
                </Row>
                <div className='row'>
                    <div className='popup'>
                        {finalData && hoverLoc ? <ToolTip hoverLoc={hoverLoc} activePoint={activePoint}/> : null}
                    </div>
                </div>
                <div className='row'>
                    <div className='chart'>
                        { finalData ?
                            <LineChart data={finalData} onChartHover = {(a, b) => handleChartHover(a, b)}/>
                            : null }
                    </div>
                </div>
            </div>
        </div>
    )
}
