import {useQuery} from "react-apollo";
import React, { useState, useEffect } from "react";
import LineChart from './LineChart';
import moment from 'moment'
import ToolTip  from './ToolTip.js'
import {LAST_30_DAILY_TOTALS, TOTALS, TOTALS_UP_TO_DATE} from "./apollo/queries";
import {useHistory, useLocation} from "react-router-dom";
import {Col, Form, Row, Select, Typography} from "antd";
import {Loader} from "./components";
import { ethers } from "ethers";
import StatCard from './StatCard.js'


const dayjs = require("dayjs");
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const { Option } = Select;


function useSearchParams() {
    let _params = new URLSearchParams(useLocation().search);
    return _params;
}

export default function Stats(props) {
    let location = useLocation();
    let history = useHistory();
    let searchParams = useSearchParams();
    let [metric, setMetric] = useState(searchParams.get("metric") || "tokens");
    let dailyDate = dayjs().utc().startOf("day")
        .subtract(30, "days")
        .unix()

    const [hoverLoc, setHoverLoc] = useState(null)
    const [activePoint, setActivePoint] = useState(null)
    const [finalData, setFinalData] = useState(null)
    const [dailyTotals, setDailyTotals] = useState(null)
    const [period, setPeriod] = useState("month")
    const [totalData, setTotalData] = useState({})
    const [startingDate, setStartingDate] = useState(dayjs().utc().startOf("day").subtract(28, "day").unix())


    const handleChartHover = (hoverLoc, activePoint) => {
        setHoverLoc(hoverLoc)
        setActivePoint(activePoint)
    }

    const {loading, error, data} = useQuery(LAST_30_DAILY_TOTALS, {
        variables: {
            date: dailyDate
        }
    });

    const {loading: loading2, error: error2, data: totalDataBefore} = useQuery(TOTALS_UP_TO_DATE, {
        variables: {
            date: startingDate
        }
    });

    const {loading: loading3, error: error3, data: totalDataNow} = useQuery(TOTALS);

    useEffect(() => {
        if (totalDataBefore && totalDataNow) {
            console.log("before", totalDataBefore.totals)
            console.log("now", totalDataNow.totals)
            setTotalData({
                tokens: totalDataNow.totals[0].tokens - (totalDataBefore?.totals[0]?.tokens || 0),
                inks: totalDataNow.totals[0].inks - (totalDataBefore?.totals[0]?.inks||0),
                saleValue: ethers.utils.formatEther(totalDataNow?.totals[0]?.saleValue) - (ethers.utils.formatEther(totalDataBefore?.totals[0]?.saleValue || 0)),
                sales: totalDataNow.totals[0].sales - (totalDataBefore?.totals[0]?.sales || 0),
                upgrades: totalDataNow.totals[0].upgrades - (totalDataBefore?.totals[0]?.upgrades|| 0),
                users: totalDataNow.totals[0].users - (totalDataBefore?.totals[0]?.users || 0),
                artists: totalDataNow.totals[0].artists - (totalDataBefore?.totals[0]?.artists || 0)
            })
        }
    }, [totalDataBefore, totalDataNow])

    useEffect(() => {
        if (period == "month") {
           setStartingDate(dayjs().utc().startOf("day").subtract(28, "day").unix())
        } else if (period == "week") {
            setStartingDate(dayjs().utc().startOf("day").subtract(1, "week").unix())
        } else if (period == "year") {
            setStartingDate(dayjs().utc().startOf("day").subtract(1, "year").unix())
        }
    }, [period, setPeriod])

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
                    p: metric === "saleValue" ? parseFloat(ethers.utils.formatEther(x[metric])).toFixed(2) : x[metric].toLocaleString(),
                    x: count,
                    y: metric === "saleValue" ? +parseFloat(ethers.utils.formatEther(x[metric])).toFixed(2) : parseFloat(x[metric])
                }
            }))
        }else {
            console.log("loading 2")
        }
    }, [dailyTotals, metric, setMetric])

    if (loading || loading2 || loading3) return <Loader />;
    if (error) return `Error! ${error.message}`;


    return (
        <div>
            <div style={{marginTop: "16px", textAlign: "left" }}>
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

            <div style={{ maxWidth: 700, margin: "0 auto", align: "center" }}>
                <div className='container' align="center">
                    <div className='row' align="center">
                        <Typography.Title level={3}>Total statistics</Typography.Title>
                    </div>
                    <Row align="center" gutter={16}>
                        <Col>
                            <Form
                                layout={"inline"}
                                initialValues={{ period: period }}
                            >
                                <Form.Item name="period" size="large">
                                    <Select
                                        value={period}
                                        size="large"
                                        onChange={val => {
                                            searchParams.set("period", val);
                                            history.push(
                                                `${location.pathname}?${searchParams.toString()}`
                                            );
                                            setPeriod(val)
                                        }}
                                    >
                                        <Option value="week">Week</Option>
                                        <Option value="month">Month</Option>
                                        <Option value="year">Year</Option>
                                    </Select>
                                </Form.Item>
                            </Form>
                        </Col>
                    </Row>

                    <div style={{ marginTop: "20px" }}>
                        <Row gutter={16}>
                            <ul
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    justifyContent: "center",
                                    padding: "0",
                                    margin: "0 20px"
                                }}
                            >
                                <StatCard
                                    name={"Inks"}
                                    value={totalData.inks}
                                    emoji={"🖼️"}
                                />
                                <StatCard
                                    name={"Tokens"}
                                    value={totalData.tokens}
                                    emoji={"🪙"}
                                />
                                <StatCard
                                    name={"Sale Value"}
                                    value={Number(totalData.saleValue)?.toFixed(2)}
                                    emoji={"💲"}
                                />
                                <StatCard
                                    name={"Upgrades"}
                                    value={totalData.upgrades}
                                    emoji={"👍"}
                                />
                                <StatCard
                                    name={"Artists"}
                                    value={totalData.artists}
                                    emoji={"🧑‍🎨"}
                                />
                                <StatCard
                                    name={"Users"}
                                    value={totalData.users}
                                    emoji={"😎"}
                                />
                                <StatCard
                                    name={"Sales"}
                                    value={totalData.sales}
                                    emoji={"💲"}
                                />
                            </ul>
                        </Row>
                    </div>

                </div>
            </div>
        </div>
    )
}
