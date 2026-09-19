import * as React from "react"

const addPropertyControls = (..._args: unknown[]) => {}
const ControlType = {
    String: "string",
    Number: "number",
    Array: "array",
    Object: "object",
    Color: "color",
    Font: "font",
} as const

// User request: Create a new Framer code component named InterstellarMissionDashboard for an interactive game dashboard with editable controls, selectable technologies, constraint checks, live telemetry, loadout slots, launch/reset flow, deterministic scoring, accessible interactions, and a dark mission-control responsive layout.

interface TechnologyItem {
    name: string
    mass: number
    cost: number
    value: number
}

interface MyComponentProps {
    title?: string
    startingBudget?: number
    maxMass?: number
    maxItems?: number
    highScore?: number
    items?: TechnologyItem[]
    surfaceColor?: string
    panelColor?: string
    borderColor?: string
    primaryTextColor?: string
    positiveColor?: string
    warningColor?: string
    headingFont: {
        fontSize?: number | string
        letterSpacing?: number | string
        lineHeight?: number | string
        fontWeight?: number
        fontStyle?: React.CSSProperties["fontStyle"]
        textAlign?: React.CSSProperties["textAlign"]
    }
    bodyFont: {
        fontSize?: number | string
        letterSpacing?: number | string
        lineHeight?: number | string
        fontWeight?: number
        fontStyle?: React.CSSProperties["fontStyle"]
        textAlign?: React.CSSProperties["textAlign"]
    }
    style?: React.CSSProperties
}

const defaultItems: TechnologyItem[] = [
    { name: "Fusion Drive", mass: 180, cost: 240000000, value: 92 },
    { name: "Habitat Ring", mass: 240, cost: 180000000, value: 78 },
    { name: "Deflector Shield", mass: 120, cost: 110000000, value: 70 },
    { name: "ISRU Refinery", mass: 95, cost: 80000000, value: 64 },
    { name: "AI Core", mass: 40, cost: 210000000, value: 88 },
    { name: "Solar Array", mass: 160, cost: 90000000, value: 58 },
]

function formatMoney(value: number): string {
    return `$${Math.max(0, Math.round(value)).toLocaleString()}`
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function InterstellarMissionDashboard(props: MyComponentProps) {
    const {
        title = "Interstellar Mission Dashboard",
        startingBudget = 1000000000,
        maxMass = 1000,
        maxItems = 10,
        highScore = 82,
        items = defaultItems,
        surfaceColor = "#070B12",
        panelColor = "#0D1420",
        borderColor = "#2A3647",
        primaryTextColor = "#D5DEEA",
        positiveColor = "#6CFFB4",
        warningColor = "#FFBF75",
        headingFont = {
            fontSize: "34px",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
            fontWeight: 700,
        },
        bodyFont = {
            fontSize: "14px",
            letterSpacing: "-0.01em",
            lineHeight: "1.35em",
            fontWeight: 500,
        },
        style,
    } = props
    const [selectedNames, setSelectedNames] = React.useState<string[]>([])
    const [status, setStatus] = React.useState<string>(
        "Select technologies to build your mission."
    )
    const [launched, setLaunched] = React.useState(false)
    const [result, setResult] = React.useState("")

    const safeItems = React.useMemo(() => {
        const source = items.length > 0 ? items : defaultItems
        return source.slice(0, 20).map((item) => ({
            name: item.name || "Untitled Technology",
            mass: Math.max(0, Number(item.mass) || 0),
            cost: Math.max(0, Number(item.cost) || 0),
            value: Math.max(0, Math.min(100, Number(item.value) || 0)),
        }))
    }, [items])

    const selectedItems = React.useMemo(
        () => safeItems.filter((item) => selectedNames.includes(item.name)),
        [safeItems, selectedNames]
    )

    const totals = React.useMemo(() => {
        return selectedItems.reduce(
            (acc, item) => {
                acc.mass += item.mass
                acc.cost += item.cost
                acc.value += item.value
                return acc
            },
            { mass: 0, cost: 0, value: 0 }
        )
    }, [selectedItems])

    const remainingBudget = Math.max(0, startingBudget - totals.cost)
    const budgetOver = totals.cost > startingBudget
    const massOver = totals.mass > maxMass
    const countOver = selectedItems.length > maxItems
    const slotCount = 10

    const score = React.useMemo(() => {
        if (selectedItems.length === 0) return 0
        const valueScore = (totals.value / (selectedItems.length * 100)) * 70
        const budgetEfficiency =
            startingBudget > 0 ? (remainingBudget / startingBudget) * 15 : 0
        const massEfficiency =
            maxMass > 0 ? (1 - totals.mass / maxMass) * 15 : 0
        const raw =
            valueScore +
            Math.max(0, budgetEfficiency) +
            Math.max(0, massEfficiency)
        return Math.max(0, Math.min(100, Math.round(raw)))
    }, [
        maxMass,
        remainingBudget,
        selectedItems.length,
        startingBudget,
        totals.mass,
        totals.value,
    ])

    const isHighScore = score >= highScore && selectedItems.length > 0

    const evaluateAddBlock = React.useCallback(
        (item: TechnologyItem) => {
            if (selectedItems.length + 1 > maxItems)
                return `Blocked: max ${maxItems} items reached.`
            if (totals.mass + item.mass > maxMass)
                return "Blocked: mass limit exceeded."
            if (totals.cost + item.cost > startingBudget)
                return "Blocked: budget limit exceeded."
            return ""
        },
        [
            maxItems,
            maxMass,
            selectedItems.length,
            startingBudget,
            totals.cost,
            totals.mass,
        ]
    )

    const toggleTechnology = React.useCallback(
        (item: TechnologyItem) => {
            const alreadySelected = selectedNames.includes(item.name)
            if (alreadySelected) {
                React.startTransition(() => {
                    setSelectedNames((prev) =>
                        prev.filter((name) => name !== item.name)
                    )
                    setStatus(`${item.name} removed from loadout.`)
                    setLaunched(false)
                    setResult("")
                })
                return
            }
            const blockReason = evaluateAddBlock(item)
            if (blockReason) {
                React.startTransition(() => setStatus(blockReason))
                return
            }
            React.startTransition(() => {
                setSelectedNames((prev) => [...prev, item.name])
                setStatus(`${item.name} added to loadout.`)
                setLaunched(false)
                setResult("")
            })
        },
        [evaluateAddBlock, selectedNames]
    )

    const removeFromLoadout = React.useCallback((name: string) => {
        React.startTransition(() => {
            setSelectedNames((prev) => prev.filter((entry) => entry !== name))
            setStatus(`${name} removed from loadout.`)
            setLaunched(false)
            setResult("")
        })
    }, [])

    const launchMission = React.useCallback(() => {
        if (selectedItems.length === 0) return
        const message =
            score >= 85
                ? "Mission outcome: Stellar trajectory achieved. Crew confidence is optimal."
                : score >= 70
                  ? "Mission outcome: Stable launch window secured. Moderate risk profile."
                  : "Mission outcome: Launch viable but fragile. Consider rebalancing systems."
        React.startTransition(() => {
            setLaunched(true)
            setResult(message)
            setStatus("Simulation complete.")
        })
    }, [score, selectedItems.length])

    const resetMission = React.useCallback(() => {
        React.startTransition(() => {
            setSelectedNames([])
            setStatus(
                "Mission board reset. Select technologies to begin again."
            )
            setLaunched(false)
            setResult("")
        })
    }, [])

    return (
        <section
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
                borderRadius: 14,
                padding: 28,
                color: primaryTextColor,
                background: surfaceColor,
                border: `1px solid ${borderColor}`,
                boxShadow: `0 0 0 1px rgba(255,255,255,0.02) inset, 0 12px 32px rgba(0,0,0,0.35)`,
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif',
            }}
        >
            <header style={{ marginBottom: 24 }}>
                <div
                    style={{
                        fontFamily:
                            'Rajdhani, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                        textTransform: "uppercase",
                        opacity: 0.82,
                        fontSize: 12,
                        letterSpacing: "0.08em",
                    }}
                >
                    Mission Control
                </div>
                <h2
                    style={{
                        margin: "6px 0 0",
                        fontFamily:
                            'Rajdhani, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                        fontSize: headingFont.fontSize,
                        letterSpacing: headingFont.letterSpacing,
                        lineHeight: headingFont.lineHeight,
                        fontWeight: headingFont.fontWeight,
                        fontStyle: headingFont.fontStyle,
                    }}
                >
                    {title}
                </h2>
            </header>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                    gap: 24,
                    alignItems: "start",
                    width: "100%",
                    minHeight: 0,
                    height: "calc(100% - 78px)",
                    maxHeight: "calc(100% - 78px)",
                    overflow: "auto",
                    overflowY: "auto",
                }}
            >
                <div style={{ display: "grid", gap: 12 }}>
                    <Panel
                        title="Telemetry"
                        panelColor={panelColor}
                        borderColor={borderColor}
                    >
                        <TelemetryRow
                            label="Budget Remaining"
                            value={formatMoney(remainingBudget)}
                            valueColor={positiveColor}
                        />
                        <TelemetryRow
                            label="Total Mass"
                            value={`${totals.mass.toFixed(0)} / ${maxMass}`}
                            valueColor={massOver ? warningColor : positiveColor}
                        />
                        <TelemetryRow
                            label="Loadout Count"
                            value={`${selectedItems.length} / ${maxItems}`}
                            valueColor={
                                countOver ? warningColor : positiveColor
                            }
                        />
                        <TelemetryRow
                            label="Viability Score"
                            value={`${score}%`}
                            valueColor={
                                score >= 70 ? positiveColor : warningColor
                            }
                        />
                        <TelemetryRow
                            label="High Score Target"
                            value={isHighScore ? "HIGH SCORE" : `${highScore}%`}
                            valueColor={
                                isHighScore ? positiveColor : primaryTextColor
                            }
                        />
                    </Panel>

                    <Panel
                        title="Status"
                        panelColor={panelColor}
                        borderColor={borderColor}
                    >
                        <div
                            aria-live="polite"
                            style={{
                                fontSize: bodyFont.fontSize,
                                letterSpacing: bodyFont.letterSpacing,
                                lineHeight: bodyFont.lineHeight,
                                fontWeight: bodyFont.fontWeight,
                                color: status.startsWith("Blocked")
                                    ? warningColor
                                    : primaryTextColor,
                            }}
                        >
                            {status}
                        </div>
                    </Panel>
                </div>

                <Panel
                    title="Technology Bay"
                    panelColor={panelColor}
                    borderColor={borderColor}
                >
                    <div style={{ display: "grid", gap: 10 }}>
                        {safeItems.map((item) => {
                            const selected = selectedNames.includes(item.name)
                            const blockedReason = selected
                                ? ""
                                : evaluateAddBlock(item)
                            const warning =
                                !selected && blockedReason.length > 0
                            return (
                                <button
                                    key={item.name}
                                    type="button"
                                    onClick={() => toggleTechnology(item)}
                                    aria-pressed={selected}
                                    aria-label={`${selected ? "Remove" : "Add"} ${item.name}`}
                                    style={{
                                        width: "100%",
                                        borderRadius: 10,
                                        border: `1px solid ${selected ? positiveColor : warning ? warningColor : borderColor}`,
                                        background: selected
                                            ? "rgba(0,255,140,0.08)"
                                            : "rgba(255,255,255,0.02)",
                                        color: primaryTextColor,
                                        cursor: "pointer",
                                        textAlign: "left",
                                        padding: "10px 12px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 8,
                                            fontFamily:
                                                'Rajdhani, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                                            textTransform: "uppercase",
                                            letterSpacing: "0.04em",
                                        }}
                                    >
                                        <span>{item.name}</span>
                                        <span
                                            style={{
                                                color: selected
                                                    ? positiveColor
                                                    : warning
                                                      ? warningColor
                                                      : primaryTextColor,
                                            }}
                                        >
                                            {selected
                                                ? "Loaded"
                                                : warning
                                                  ? "Blocked"
                                                  : "Available"}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 6,
                                            fontSize: 12,
                                            opacity: 0.85,
                                        }}
                                    >
                                        Mass {item.mass} · Cost{" "}
                                        {formatMoney(item.cost)} · Value{" "}
                                        {item.value}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </Panel>

                <Panel
                    title="Space Mission Loadout"
                    panelColor={panelColor}
                    borderColor={borderColor}
                >
                    <div style={{ display: "grid", gap: 10 }}>
                        {Array.from({ length: slotCount }).map((_, index) => {
                            const item = selectedItems[index]
                            const filled = Boolean(item)
                            return (
                                <div
                                    key={index}
                                    style={{
                                        borderRadius: 10,
                                        border: `1px solid ${filled ? positiveColor : borderColor}`,
                                        background: "rgba(255,255,255,0.02)",
                                        padding: "10px 12px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        minHeight: 40,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 13,
                                            opacity: filled ? 1 : 0.55,
                                        }}
                                    >
                                        {item
                                            ? item.name
                                            : `EMPTY SLOT ${index + 1}`}
                                    </span>
                                    {item ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeFromLoadout(item.name)
                                            }
                                            aria-label={`Remove ${item.name}`}
                                            style={{
                                                borderRadius: 8,
                                                border: `1px solid ${borderColor}`,
                                                background: "transparent",
                                                color: warningColor,
                                                cursor: "pointer",
                                                padding: "4px 8px",
                                            }}
                                        >
                                            Remove
                                        </button>
                                    ) : null}
                                </div>
                            )
                        })}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: 10,
                            marginTop: 16,
                            flexWrap: "wrap",
                        }}
                    >
                        <button
                            type="button"
                            onClick={launchMission}
                            disabled={selectedItems.length === 0}
                            aria-disabled={selectedItems.length === 0}
                            style={{
                                borderRadius: 10,
                                border: `1px solid ${selectedItems.length === 0 ? borderColor : positiveColor}`,
                                background:
                                    selectedItems.length === 0
                                        ? "rgba(255,255,255,0.04)"
                                        : "rgba(0,255,140,0.12)",
                                color:
                                    selectedItems.length === 0
                                        ? primaryTextColor
                                        : positiveColor,
                                cursor:
                                    selectedItems.length === 0
                                        ? "not-allowed"
                                        : "pointer",
                                padding: "10px 14px",
                                fontFamily:
                                    'Rajdhani, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            Launch Simulation
                        </button>
                        <button
                            type="button"
                            onClick={resetMission}
                            style={{
                                borderRadius: 10,
                                border: `1px solid ${borderColor}`,
                                background: "transparent",
                                color: primaryTextColor,
                                cursor: "pointer",
                                padding: "10px 14px",
                            }}
                        >
                            Replay / Reset
                        </button>
                    </div>

                    {launched ? (
                        <p
                            style={{
                                margin: "12px 0 0",
                                color:
                                    score >= 70 ? positiveColor : warningColor,
                                fontSize: bodyFont.fontSize,
                                letterSpacing: bodyFont.letterSpacing,
                                lineHeight: bodyFont.lineHeight,
                                fontWeight: bodyFont.fontWeight,
                            }}
                        >
                            {result}
                        </p>
                    ) : null}
                </Panel>
            </div>

            {(budgetOver || massOver || countOver) && (
                <div
                    style={{
                        marginTop: 18,
                        border: `1px solid ${warningColor}`,
                        color: warningColor,
                        borderRadius: 10,
                        padding: "8px 12px",
                        fontSize: 12,
                    }}
                >
                    Constraint warning: current loadout exceeds configured
                    mission limits.
                </div>
            )}
        </section>
    )
}

function Panel(props: {
    title: string
    panelColor: string
    borderColor: string
    children: React.ReactNode
}) {
    return (
        <section
            aria-label={props.title}
            style={{
                borderRadius: 12,
                border: `1px solid ${props.borderColor}`,
                background: props.panelColor,
                padding: 14,
            }}
        >
            <div
                style={{
                    marginBottom: 10,
                    fontFamily:
                        'Rajdhani, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontSize: 12,
                    opacity: 0.85,
                }}
            >
                {props.title}
            </div>
            {props.children}
        </section>
    )
}

function TelemetryRow(props: {
    label: string
    value: string
    valueColor: string
}) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 8,
                fontSize: 13,
            }}
        >
            <span style={{ opacity: 0.82 }}>{props.label}</span>
            <span style={{ color: props.valueColor }}>{props.value}</span>
        </div>
    )
}

addPropertyControls(InterstellarMissionDashboard, {
    title: {
        type: ControlType.String,
        defaultValue: "Interstellar Mission Dashboard",
    },
    startingBudget: {
        type: ControlType.Number,
        defaultValue: 1000000000,
        min: 1000000,
        step: 1000000,
    },
    maxMass: {
        type: ControlType.Number,
        defaultValue: 1000,
        min: 100,
        step: 5,
    },
    maxItems: {
        type: ControlType.Number,
        defaultValue: 10,
        min: 1,
        max: 10,
        step: 1,
    },
    highScore: {
        type: ControlType.Number,
        defaultValue: 82,
        min: 0,
        max: 100,
        step: 1,
    },
    items: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, defaultValue: "Technology" },
                mass: {
                    type: ControlType.Number,
                    defaultValue: 100,
                    min: 0,
                    step: 1,
                },
                cost: {
                    type: ControlType.Number,
                    defaultValue: 100000000,
                    min: 0,
                    step: 1000000,
                },
                value: {
                    type: ControlType.Number,
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                },
            },
        },
        maxCount: 20,
        defaultValue: defaultItems,
    },
    surfaceColor: {
        type: ControlType.Color,
        defaultValue: "#070B12",
    },
    panelColor: {
        type: ControlType.Color,
        defaultValue: "#0D1420",
    },
    borderColor: {
        type: ControlType.Color,
        defaultValue: "#2A3647",
    },
    primaryTextColor: {
        type: ControlType.Color,
        defaultValue: "#D5DEEA",
    },
    positiveColor: {
        type: ControlType.Color,
        defaultValue: "#6CFFB4",
    },
    warningColor: {
        type: ControlType.Color,
        defaultValue: "#FFBF75",
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        defaultValue: {
            fontSize: "34px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.35em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
})
