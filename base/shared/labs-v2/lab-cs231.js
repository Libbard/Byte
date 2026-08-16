var e = "combinational-circuit-workspace", t = "cs231-combinational-circuit-builder", n = Object.freeze({
	width: 4e3,
	height: 2600,
	minimumZoom: .25,
	maximumZoom: 1.8,
	maximumNodes: 116,
	maximumWires: 800,
	maximumInputValues: 8,
	maximumWaypoints: 32,
	maximumArtifactIdLength: 128,
	maximumNodeIdLength: 64,
	maximumTitleLength: 120,
	maximumPresetIdLength: 80,
	maximumLabelLength: 48
}), r = [
	"input",
	"gate",
	"output"
], i = [
	"top",
	"center",
	"bottom"
], a = ["orthogonal-auto", "orthogonal-pinned"], o = ["probe", "led"], s = [
	"SWITCH",
	"BUTTON",
	"CONSTANT_0",
	"CONSTANT_1",
	"PROBE",
	"LED",
	"BUFFER",
	"NOT",
	"AND",
	"NAND",
	"OR",
	"NOR",
	"XOR",
	"XNOR",
	"MUX",
	"MAJORITY",
	"ODD_PARITY",
	"EVEN_PARITY"
], c = /* @__PURE__ */ new Set([
	"SWITCH",
	"BUTTON",
	"CONSTANT_0",
	"CONSTANT_1"
]), l = /* @__PURE__ */ new Set(["PROBE", "LED"]);
function u(e) {
	return c.has(e) ? "input" : l.has(e) ? "output" : "gate";
}
function d(r) {
	return {
		schemaVersion: 1,
		kind: e,
		labId: t,
		artifactId: r.artifactId,
		revision: r.revision,
		title: r.title,
		createdAt: r.createdAt,
		updatedAt: r.updatedAt,
		...r.sourcePresetId === void 0 ? {} : { sourcePresetId: r.sourcePresetId },
		circuit: {
			width: n.width,
			height: n.height,
			nodes: r.circuit.nodes.map((e) => ({
				id: e.id,
				role: e.role,
				component: e.component,
				label: e.label,
				labelPlacement: e.labelPlacement,
				position: {
					x: e.position.x,
					y: e.position.y
				},
				inputCount: e.inputCount,
				...e.constantValue === void 0 ? {} : { constantValue: e.constantValue },
				...e.outputDisplay === void 0 ? {} : { outputDisplay: e.outputDisplay }
			})),
			wires: r.circuit.wires.map((e) => ({
				id: e.id,
				source: {
					nodeId: e.source.nodeId,
					portId: e.source.portId
				},
				target: {
					nodeId: e.target.nodeId,
					portId: e.target.portId
				},
				label: e.label,
				route: {
					mode: e.route.mode,
					waypoints: e.route.waypoints.map((e) => ({
						x: e.x,
						y: e.y
					}))
				}
			}))
		},
		session: {
			inputValues: Object.fromEntries(Object.entries(r.session.inputValues)),
			viewport: {
				x: r.session.viewport.x,
				y: r.session.viewport.y,
				zoom: r.session.viewport.zoom
			}
		}
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/kernel/graph.ts
function f(e, t) {
	let n = e.findIndex((e) => e.localeCompare(t) > 0);
	n === -1 ? e.push(t) : e.splice(n, 0, t);
}
function p(e) {
	let t = [], n = e.circuit.nodes.map((e) => e.id), r = [...new Set(n)].sort((e, t) => e.localeCompare(t));
	if (r.length !== n.length) {
		let e = r.filter((e) => n.filter((t) => t === e).length > 1);
		t.push({
			code: "DUPLICATE_NODE_ID",
			nodeIds: e
		});
	}
	let i = new Set(r), a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = new Map(r.map((e) => [e, 0]));
	for (let e of r) a.set(e, []), o.set(e, []);
	let c = [...e.circuit.wires].sort((e, t) => e.id.localeCompare(t.id));
	for (let e of c) {
		let n = i.has(e.source.nodeId), r = i.has(e.target.nodeId);
		n || t.push({
			code: "UNKNOWN_WIRE_SOURCE",
			nodeIds: [e.source.nodeId],
			wireId: e.id
		}), r || t.push({
			code: "UNKNOWN_WIRE_TARGET",
			nodeIds: [e.target.nodeId],
			wireId: e.id
		}), !(!n || !r) && (a.get(e.source.nodeId)?.push(e.target.nodeId), o.get(e.target.nodeId)?.push(e), s.set(e.target.nodeId, (s.get(e.target.nodeId) ?? 0) + 1));
	}
	let l = r.filter((e) => s.get(e) === 0), u = [];
	for (; l.length > 0;) {
		let e = l.shift();
		if (!e) break;
		u.push(e);
		let t = [...a.get(e) ?? []].sort((e, t) => e.localeCompare(t));
		for (let e of t) {
			let t = (s.get(e) ?? 0) - 1;
			s.set(e, t), t === 0 && f(l, e);
		}
	}
	let d = new Set(u), p = r.filter((e) => !d.has(e));
	return p.length > 0 && t.push({
		code: "COMBINATIONAL_CYCLE",
		nodeIds: p
	}), {
		orderedNodeIds: u,
		cycleNodeIds: p,
		incomingWires: o,
		issues: t
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/kernel/logic.ts
function m(e) {
	return e === "X" ? "X" : e === 1 ? 0 : 1;
}
function h(e) {
	return e.some((e) => e === 0) ? 0 : e.every((e) => e === 1) ? 1 : "X";
}
function ee(e) {
	return e.some((e) => e === 1) ? 1 : e.every((e) => e === 0) ? 0 : "X";
}
function te(e) {
	return e.some((e) => e === "X") ? "X" : e.reduce((e, t) => e ^ Number(t), 0);
}
function ne(e) {
	let t = Math.floor(e.length / 2) + 1, n = e.filter((e) => e === 1).length, r = e.filter((e) => e === 0).length;
	return n >= t ? 1 : r >= t ? 0 : "X";
}
function re(e, t, n = "X") {
	switch (e) {
		case "SWITCH":
		case "BUTTON": return n;
		case "CONSTANT_0": return 0;
		case "CONSTANT_1": return 1;
		case "PROBE":
		case "LED":
		case "BUFFER": return t[0] ?? "X";
		case "NOT": return m(t[0] ?? "X");
		case "AND": return h(t);
		case "NAND": return m(h(t));
		case "OR": return ee(t);
		case "NOR": return m(ee(t));
		case "XOR":
		case "ODD_PARITY": return te(t);
		case "XNOR":
		case "EVEN_PARITY": return m(te(t));
		case "MUX": {
			let e = ie(t.length), n = 2 ** e, r = 0;
			for (let i = 0; i < e; i += 1) {
				let e = t[n + i] ?? "X";
				if (e !== 0 && e !== 1) {
					let e = t.slice(0, n);
					return e.every((t) => t === e[0]) ? e[0] ?? "X" : "X";
				}
				r += e << i;
			}
			return t[r] ?? "X";
		}
		case "MAJORITY": return ne(t);
	}
}
function ie(e) {
	let t = 1;
	for (; 2 ** t + t < e;) t += 1;
	return t;
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/kernel/expressions.ts
function ae(e, t) {
	let n = (e) => t[e] ?? "?", r = (e) => `(${t.map((e) => e || "?").join(` ${e} `)})`;
	switch (e) {
		case "SWITCH":
		case "BUTTON": return "?";
		case "CONSTANT_0": return "0";
		case "CONSTANT_1": return "1";
		case "PROBE":
		case "LED":
		case "BUFFER": return n(0);
		case "NOT": return `¬(${n(0)})`;
		case "AND": return r("·");
		case "NAND": return `¬${r("·")}`;
		case "OR": return r("+");
		case "NOR": return `¬${r("+")}`;
		case "XOR":
		case "ODD_PARITY": return r("⊕");
		case "XNOR":
		case "EVEN_PARITY": return `¬${r("⊕")}`;
		case "MUX": {
			let e = ie(t.length), r = 2 ** e;
			return `(${Array.from({ length: r }, (t, i) => `(${[...Array.from({ length: e }, (e, t) => {
				let a = n(r + t);
				return i >> t & 1 ? a : `¬(${a})`;
			}).reverse(), n(i)].join(" · ")})`).join(" + ")})`;
		}
		case "MAJORITY": return t.length === 3 ? `((${n(0)} · ${n(1)}) + (${n(0)} · ${n(2)}) + (${n(1)} · ${n(2)}))` : `MAJ(${t.map((e) => e || "?").join(", ")})`;
	}
}
function oe(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let e of t) {
		let t = /^in-(\d+)$/.exec(e.target.portId);
		if (!t) continue;
		let n = Number(t[1]), i = r.get(n) ?? [];
		i.push(e), r.set(n, i);
	}
	return Array.from({ length: e.inputCount }, (e, t) => {
		let i = r.get(t) ?? [];
		return i.length === 1 ? n[i[0].source.nodeId] ?? "?" : "?";
	});
}
function se(e) {
	let t = p(e), n = new Map(e.circuit.nodes.map((e) => [e.id, e])), r = {};
	for (let e of t.orderedNodeIds) {
		let i = n.get(e);
		if (i) {
			if (i.role === "input") {
				r[i.id] = i.component === "CONSTANT_0" ? "0" : i.component === "CONSTANT_1" ? "1" : i.label || i.id;
				continue;
			}
			r[i.id] = ae(i.component, oe(i, t.incomingWires.get(i.id) ?? [], r));
		}
	}
	for (let e of t.cycleNodeIds) r[e] = "?";
	return r;
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/kernel/evaluate.ts
function ce(e) {
	let t = /^in-(\d+)$/.exec(e);
	return t ? Number(t[1]) : null;
}
function le(e, t) {
	return e.component === "CONSTANT_0" ? 0 : e.component === "CONSTANT_1" ? 1 : t[e.id] ?? "X";
}
function ue(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let n of t) {
		n.source.portId !== "out" && r.push({
			code: "INVALID_SOURCE_PORT",
			wireIds: [n.id],
			nodeId: n.source.nodeId,
			portId: n.source.portId
		});
		let t = ce(n.target.portId);
		if (t === null) {
			r.push({
				code: "INVALID_TARGET_PORT",
				wireIds: [n.id],
				nodeId: e.id,
				portId: n.target.portId
			});
			continue;
		}
		let a = i.get(t) ?? [];
		a.push(n), i.set(t, a);
	}
	return Array.from({ length: e.inputCount }, (t, a) => {
		let o = i.get(a) ?? [];
		return o.length === 1 ? n[o[0].source.nodeId] ?? "X" : (o.length > 1 && r.push({
			code: "MULTIPLE_WIRES_TO_PORT",
			wireIds: o.map((e) => e.id),
			nodeId: e.id,
			portId: `in-${a}`
		}), "X");
	});
}
function de(e, t = e.session.inputValues) {
	let n = p(e), r = {}, i = [], a = new Map(e.circuit.nodes.map((e) => [e.id, e]));
	for (let e of n.orderedNodeIds) {
		let o = a.get(e);
		if (!o) continue;
		if (o.role === "input") {
			r[o.id] = le(o, t);
			continue;
		}
		let s = ue(o, n.incomingWires.get(o.id) ?? [], r, i);
		r[o.id] = re(o.component, s);
	}
	for (let e of n.cycleNodeIds) r[e] = "X";
	return {
		values: r,
		orderedNodeIds: n.orderedNodeIds,
		graphIssues: n.issues,
		evaluationIssues: i
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/kernel/karnaugh.ts
function fe(e) {
	return e ^ e >> 1;
}
function pe(e, t) {
	return t === 0 ? "" : e.toString(2).padStart(t, "0");
}
function me(e, t) {
	if (e.length > 6) return {
		available: !1,
		variableNames: e,
		rowVariables: [],
		columnVariables: [],
		rowGrayCodes: [],
		columnGrayCodes: [],
		rows: 0,
		columns: 0,
		cells: [],
		reason: "more-than-six-variables"
	};
	let n = Math.floor(e.length / 2), r = e.length - n, i = 2 ** n, a = 2 ** r, o = Array.from({ length: i }, (e, t) => pe(fe(t), n)), s = Array.from({ length: a }, (e, t) => pe(fe(t), r)), c = [];
	for (let e = 0; e < i; e += 1) for (let n = 0; n < a; n += 1) {
		let r = `${o[e]}${s[n]}`, i = r === "" ? 0 : Number.parseInt(r, 2);
		c.push({
			row: e,
			column: n,
			minterm: i,
			value: t[i] ?? "X"
		});
	}
	return {
		available: !0,
		variableNames: e,
		rowVariables: e.slice(0, n),
		columnVariables: e.slice(n),
		rowGrayCodes: o,
		columnGrayCodes: s,
		rows: i,
		columns: a,
		cells: c
	};
}
function he(e, t, n = e.inputNodeIds) {
	return me(n, e.rows.map((e) => e.outputs[t] ?? "X"));
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/kernel/simplify.ts
var ge = (e) => [...e].filter((e) => e !== "-").length;
function _e(e, t) {
	let n = 0, r = "";
	for (let i = 0; i < e.length; i += 1) {
		let a = e[i], o = t[i];
		if (a === o) r += a;
		else if (a !== "-" && o !== "-") n += 1, r += "-";
		else return null;
	}
	return n === 1 ? r : null;
}
function ve(e, t) {
	return /* @__PURE__ */ new Set([...e, ...t]);
}
function ye(e, t) {
	let n = [...new Set(t)].sort((e, t) => e - t).map((t) => ({
		pattern: t.toString(2).padStart(e, "0"),
		terms: /* @__PURE__ */ new Set([t]),
		used: !1
	})), r = /* @__PURE__ */ new Map();
	for (; n.length > 0;) {
		let e = /* @__PURE__ */ new Map(), t = /* @__PURE__ */ new Set();
		for (let r = 0; r < n.length; r += 1) for (let i = r + 1; i < n.length; i += 1) {
			let a = _e(n[r].pattern, n[i].pattern);
			if (!a) continue;
			t.add(n[r].pattern), t.add(n[i].pattern);
			let o = e.get(a);
			e.set(a, {
				pattern: a,
				terms: o ? ve(o.terms, ve(n[r].terms, n[i].terms)) : ve(n[r].terms, n[i].terms),
				used: !1
			});
		}
		for (let e of n) t.has(e.pattern) || r.set(e.pattern, ve(r.get(e.pattern) ?? /* @__PURE__ */ new Set(), e.terms));
		n = [...e.values()];
	}
	return [...r.entries()].sort(([e], [t]) => e.localeCompare(t)).map(([e, t]) => ({
		pattern: e,
		terms: t
	}));
}
function be(e, t, n) {
	let r = t.toString(2).padStart(n, "0");
	return [...e].every((e, t) => e === "-" || e === r[t]);
}
function xe(e, t) {
	let n = /* @__PURE__ */ new Set(), r = new Set(t);
	for (let r of t) {
		let t = e.map((e, t) => e.coveredMinterms.includes(r) ? t : -1).filter((e) => e >= 0);
		t.length === 1 && n.add(t[0]);
	}
	for (let t of n) for (let n of e[t].coveredMinterms) r.delete(n);
	if (r.size === 0) return {
		selected: [...n].map((t) => e[t]),
		exact: !0
	};
	let i = e.map((e, t) => ({
		prime: e,
		index: t
	})).filter((e) => !n.has(e.index) && e.prime.coveredMinterms.some((e) => r.has(e))), a = null, o = 0, s = (t) => [
		t.length,
		t.reduce((t, n) => t + e[n].literalCount, 0),
		t.map((t) => e[t].pattern).sort().join("|")
	], c = (e, t) => {
		let n = s(e), r = s(t);
		return n[0] < r[0] || n[0] === r[0] && (n[1] < r[1] || n[1] === r[1] && n[2] < r[2]);
	};
	function l(e, t) {
		if (o += 1, o > 1e5 || a && t.length >= a.length) return;
		if (e.size === 0) {
			(!a || c(t, a)) && (a = [...t]);
			return;
		}
		let n = [...e].sort((e, t) => i.filter((t) => t.prime.coveredMinterms.includes(e)).length - i.filter((e) => e.prime.coveredMinterms.includes(t)).length || e - t)[0];
		for (let r of i.filter((e) => e.prime.coveredMinterms.includes(n))) l(new Set([...e].filter((e) => !r.prime.coveredMinterms.includes(e))), [...t, r.index]);
	}
	if (l(r, []), !a) {
		let e = [], t = new Set(r);
		for (; t.size > 0;) {
			let n = i.map((e) => ({
				...e,
				gain: e.prime.coveredMinterms.filter((e) => t.has(e)).length
			})).sort((e, t) => t.gain - e.gain || e.prime.literalCount - t.prime.literalCount || e.prime.pattern.localeCompare(t.prime.pattern))[0];
			if (!n || n.gain === 0) break;
			e.push(n.index);
			for (let e of n.prime.coveredMinterms) t.delete(e);
		}
		a = e;
	}
	return {
		selected: [...n, ...a].map((t) => e[t]),
		exact: o <= 1e5
	};
}
function Se(e, t) {
	let n = [...e].flatMap((e, n) => {
		if (e === "-") return [];
		let r = t[n] ?? "?";
		return [e === "1" ? r : `${r}′`];
	});
	if (n.length === 0) return "1";
	let r = t.every((e) => e.length === 1);
	return n.join(r ? "" : " · ");
}
function Ce(e, t) {
	return e.length === 0 ? "0" : e.map((e) => Se(e, t)).join(" + ");
}
var we = (e) => [...e].flatMap((e, t) => e === "-" ? [t] : []);
function Te(e, t) {
	return Array.from({ length: 2 ** t.length }, (n, r) => {
		let i = [...e];
		for (let [e, n] of t.entries()) i[n] = r >> e & 1 ? "1" : "0";
		return i.join("");
	});
}
function Ee(e, t, n, r) {
	let i = (t, n) => ({
		law: t,
		expression: Ce(n, e),
		termCount: n.length
	}), a = t.map((e) => e.toString(2).padStart(r, "0"));
	if (n.length === 0) return [i("minimal", [])];
	let o = [i("sum-of-minterms", a)], s = n.map((e) => {
		let t = we(e.pattern);
		return {
			pattern: e.pattern,
			freeBits: t,
			expansion: Te(e.pattern, t)
		};
	}), c = [...new Set(s.flatMap((e) => e.expansion))].filter((e) => !a.includes(e)).sort();
	c.length > 0 && o.push(i("dont-care", [...a, ...c]));
	let l = s.flatMap((e) => e.expansion);
	l.length > new Set(l).size && o.push(i("idempotent", l));
	let u = Math.max(...s.map((e) => e.freeBits.length));
	for (let e = 1; e <= u; e += 1) {
		let t = s.flatMap((t) => {
			let n = [...t.pattern], r = t.freeBits.slice(Math.min(e, t.freeBits.length));
			for (let r of t.freeBits.slice(0, e)) n[r] = "-";
			return Te(n.join(""), r);
		});
		o.push(i("combining", t));
	}
	o.push(i("minimal", s.map((e) => e.pattern)));
	let d = o.filter((e, t) => t === 0 || e.expression !== o[t - 1].expression), f = d[d.length - 1];
	return d[d.length - 1] = {
		...f,
		law: "minimal"
	}, d;
}
function De(e, t) {
	let n = [...e].sort((e, t) => t.literalCount - e.literalCount || e.pattern.localeCompare(t.pattern));
	for (let e = n.length - 1; e >= 0; --e) {
		let r = n.filter((t, n) => n !== e), i = new Set(r.flatMap((e) => e.coveredMinterms));
		t.every((e) => i.has(e)) && n.splice(e, 1);
	}
	return n.sort((e, t) => e.pattern.localeCompare(t.pattern));
}
function Oe(e, t, n = []) {
	if (e.length > 8) throw RangeError("Simplification supports at most 8 variables.");
	let r = 2 ** e.length, i = [...new Set(t)].sort((e, t) => e - t), a = [...new Set(n)].filter((e) => !i.includes(e)).sort((e, t) => e - t);
	if ([...i, ...a].some((e) => !Number.isInteger(e) || e < 0 || e >= r)) throw RangeError("Minterm is outside the supported variable range.");
	if (i.length === 0) return {
		variableNames: e,
		minterms: i,
		dontCares: a,
		primeImplicants: [],
		selectedImplicants: [],
		expression: "0",
		exact: !0,
		literalCount: 0,
		steps: [{
			law: "minimal",
			expression: "0",
			termCount: 0
		}]
	};
	let o = ye(e.length, [...i, ...a]).map(({ pattern: t }) => ({
		pattern: t,
		coveredMinterms: i.filter((n) => be(t, n, e.length)),
		literalCount: ge(t)
	})).filter((e) => e.coveredMinterms.length > 0), s = xe(o, i), c = De(s.selected, i);
	return {
		variableNames: e,
		minterms: i,
		dontCares: a,
		primeImplicants: o,
		selectedImplicants: c,
		expression: Ce(c.map((e) => e.pattern), e),
		exact: s.exact,
		literalCount: c.reduce((e, t) => e + t.literalCount, 0),
		steps: Ee(e, i, c, e.length)
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/kernel/truth-table.ts
function ke(e) {
	return e.circuit.nodes.filter((e) => e.role === "input" && (e.component === "SWITCH" || e.component === "BUTTON")).map((e) => e.id).sort((e, t) => e.localeCompare(t));
}
function Ae(e) {
	return e.circuit.nodes.filter((e) => e.role === "output").map((e) => e.id).sort((e, t) => e.localeCompare(t));
}
function je(e, t) {
	return Object.fromEntries(e.map((n, r) => [n, t >> e.length - r - 1 & 1]));
}
function Me(e) {
	let t = ke(e), n = Ae(e), r = 2 ** t.length, i = [], a = [], o = [];
	for (let s = 0; s < r; s += 1) {
		let r = je(t, s), c = de(e, r);
		s === 0 && a.push(...c.graphIssues), o.push(...c.evaluationIssues), i.push({
			index: s,
			inputs: r,
			outputs: Object.fromEntries(n.map((e) => [e, c.values[e] ?? "X"]))
		});
	}
	return {
		inputNodeIds: t,
		outputNodeIds: n,
		rows: i,
		graphIssues: a,
		evaluationIssues: o
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/evidence/evidence-projection.ts
function Ne(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.circuit.nodes) {
		let e = n.label.trim();
		e && t.set(e, (t.get(e) ?? 0) + 1);
	}
	return Object.fromEntries(e.circuit.nodes.map((e) => {
		let n = e.label.trim();
		return [e.id, n && t.get(n) === 1 ? n : e.id];
	}));
}
function Pe(e) {
	let t = Me(e), n = de(e, e.session.inputValues), r = Ne(e), i = t.inputNodeIds.map((e) => r[e] ?? e), a = {}, o = {};
	for (let e of t.outputNodeIds) a[e] = he(t, e, i), o[e] = Oe(i, t.rows.filter((t) => t.outputs[e] === 1).map((e) => e.index), t.rows.filter((t) => t.outputs[e] === "X").map((e) => e.index));
	return {
		revision: e.revision,
		values: n.values,
		expressions: se(e),
		truthTable: t,
		karnaughByOutputId: a,
		simplificationByOutputId: o,
		displayNameByNodeId: r
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/editor/symbol-geometry.ts
var g = 120, _ = 80, v = 4, y = 116, b = 20, x = 100;
function Fe(e, t) {
	return t <= 1 ? _ / 2 : 16 + e * (48 / (t - 1));
}
function Ie(e) {
	return Array.from({ length: e }, (t, n) => ({
		x: v,
		y: Fe(n, e)
	}));
}
function S(e, t, n, r) {
	let i = typeof t == "function" ? t : () => t;
	return [...e.map((e) => `M ${e.x} ${e.y} H ${i(e.y).toFixed(2)}`), `M ${n} ${r} H ${y}`];
}
function Le(e) {
	let t = "M 14 6 H 106 Q 116 6 116 16 V 48 Q 116 58 106 58 H 14 Q 4 58 4 48 V 16 Q 4 6 14 6 Z";
	return {
		width: g,
		height: 64,
		bodyPaths: [t],
		detailPaths: [],
		leadPaths: [],
		facePath: t,
		inputPorts: e === "input" ? [] : [{
			x: 4,
			y: 32
		}],
		outputPort: {
			x: 116,
			y: 32
		}
	};
}
function Re(e, t) {
	return t ? 110 : e;
}
function ze(e) {
	let t = e ? {
		center: {
			x: 104,
			y: 40
		},
		radius: 6
	} : void 0, n = [{
		x: v,
		y: 40
	}];
	return {
		width: g,
		height: _,
		bodyPaths: ["M 22 8 L 96 40 L 22 72 Z"],
		detailPaths: [],
		leadPaths: S(n, 22, Re(96, e), 40),
		inputPorts: n,
		outputPort: {
			x: y,
			y: 40
		},
		...t ? { inversionBubble: t } : {}
	};
}
function Be(e, t) {
	let n = t ? {
		center: {
			x: 104,
			y: 40
		},
		radius: 6
	} : void 0, r = Ie(e);
	return {
		width: g,
		height: _,
		bodyPaths: ["M 20 8 H 58 C 86 8 100 21 100 40 C 100 59 86 72 58 72 H 20 Z"],
		detailPaths: [],
		leadPaths: S(r, b, Re(x, t), 40),
		inputPorts: r,
		outputPort: {
			x: y,
			y: 40
		},
		...n ? { inversionBubble: n } : {}
	};
}
function Ve(e) {
	let t = (e, t, n, r, i) => {
		let a = 1 - i;
		return e * a ** 3 + 3 * t * i * a ** 2 + 3 * n * i ** 2 * a + r * i ** 3;
	}, n = 0, r = 1;
	for (let i = 0; i < 24; i += 1) {
		let i = (n + r) / 2;
		t(72, 55, 25, 8, i) > e ? n = i : r = i;
	}
	return t(24, 40, 40, 24, (n + r) / 2);
}
function He(e, t, n) {
	let r = t ? {
		center: {
			x: 104,
			y: 40
		},
		radius: 6
	} : void 0, i = Ie(e);
	return {
		width: g,
		height: _,
		bodyPaths: ["M 24 8 C 54 10 84 18 100 40 C 84 62 54 70 24 72 C 40 55 40 25 24 8 Z"],
		detailPaths: n ? ["M 16 8 C 32 25 32 55 16 72"] : [],
		leadPaths: S(i, Ve, Re(x, t), 40),
		inputPorts: i,
		outputPort: {
			x: y,
			y: 40
		},
		...r ? { inversionBubble: r } : {}
	};
}
function Ue() {
	return {
		width: g,
		height: 80,
		bodyPaths: [
			"M 4 40 H 24",
			"M 24 31 H 44 V 49 H 24 Z",
			"M 44 40 H 52",
			"M 52 40 A 26 26 0 1 1 104 40 A 26 26 0 1 1 52 40 Z"
		],
		detailPaths: ["M 28 31 V 49 M 34 31 V 49 M 40 31 V 49"],
		leadPaths: [],
		inputPorts: [{
			x: 4,
			y: 40
		}],
		outputPort: {
			x: 116,
			y: 40
		}
	};
}
function We(e, t, n) {
	let r = Math.max(_, 24 + e * 26), i = Array.from({ length: e }, (t, n) => ({
		x: v,
		y: 24 + n * ((r - 48) / Math.max(1, e - 1))
	})), a = e === 1 ? [{
		x: v,
		y: r / 2
	}] : i;
	return {
		width: g,
		height: r,
		bodyPaths: [`M ${b} 6 H ${x} V ${r - 6} H ${b} Z`],
		detailPaths: [],
		leadPaths: S(a, b, x, r / 2),
		inputPorts: a,
		outputPort: {
			x: y,
			y: r / 2
		},
		pinNames: t.slice(0, e),
		blockTitle: n
	};
}
function Ge(e) {
	let t = ie(e), n = 2 ** t, r = Math.max(_, 24 + n * 26), i = Array.from({ length: n }, (e, t) => ({
		x: v,
		y: 22 + t * ((r - 44) / Math.max(1, n - 1))
	})), a = Array.from({ length: t }, (e, n) => ({
		x: Math.round(28 + (n + 1) * 68 / (t + 1)),
		y: r + 18 - 6
	})), o = Math.min(18, r / 5), s = (e) => r - 8 - o * (e - 28) / 68;
	return {
		width: g,
		height: r + 18,
		bodyPaths: [`M 28 8 L 96 ${8 + o} V ${r - 8 - o} L 28 ${r - 8} Z`],
		detailPaths: [],
		leadPaths: [
			...i.map((e) => `M ${e.x} ${e.y} H 28`),
			...a.map((e) => `M ${e.x} ${s(e.x).toFixed(2)} V ${e.y}`),
			`M 96 ${r / 2} H ${y}`
		],
		inputPorts: [...i, ...a],
		outputPort: {
			x: y,
			y: r / 2
		},
		pinNames: [...Array.from({ length: n }, (e, t) => `D${t}`), ...Array.from({ length: t }, (e, t) => `S${t}`)],
		blockTitle: "MUX"
	};
}
function C(e, t) {
	switch (e) {
		case "SWITCH":
		case "BUTTON":
		case "CONSTANT_0":
		case "CONSTANT_1": return Le("input");
		case "PROBE": return Le("output");
		case "LED": return Ue();
		case "BUFFER": return ze(!1);
		case "NOT": return ze(!0);
		case "AND": return Be(t, !1);
		case "NAND": return Be(t, !0);
		case "OR": return He(t, !1, !1);
		case "NOR": return He(t, !0, !1);
		case "XOR": return He(t, !1, !0);
		case "XNOR": return He(t, !0, !0);
		case "MUX": return Ge(t);
		case "MAJORITY": return We(t, [
			"A",
			"B",
			"C",
			"D",
			"E",
			"F",
			"G",
			"H"
		], "MAJ");
		case "ODD_PARITY": return We(t, [
			"I0",
			"I1",
			"I2",
			"I3",
			"I4",
			"I5",
			"I6",
			"I7"
		], "ODD");
		case "EVEN_PARITY": return We(t, [
			"I0",
			"I1",
			"I2",
			"I3",
			"I4",
			"I5",
			"I6",
			"I7"
		], "EVEN");
	}
}
function Ke(e, t) {
	return t === "top" ? {
		x: e.width / 2,
		y: -8
	} : t === "center" ? {
		x: e.width / 2,
		y: e.height / 2
	} : {
		x: e.width / 2,
		y: e.height + 18
	};
}
function qe(e, t) {
	return {
		x: e.position.x + t.x,
		y: e.position.y + t.y
	};
}
function Je(e, t) {
	return {
		id: e,
		center: t,
		hitBox: {
			x: t.x - 44 / 2,
			y: t.y - 44 / 2,
			width: 44,
			height: 44
		}
	};
}
function Ye(e) {
	let t = C(e.component, e.inputCount);
	return {
		inputs: t.inputPorts.map((t, n) => Je(`in-${n}`, qe(e, t))),
		output: Je("out", qe(e, t.outputPort))
	};
}
function Xe(e) {
	let t = C(e.component, e.inputCount);
	return {
		x: e.position.x,
		y: e.position.y,
		width: t.width,
		height: t.height
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/editor/selection-model.ts
var w = Object.freeze({
	nodeIds: [],
	wireIds: []
});
function Ze(e, t) {
	return {
		x: Math.min(e.x, t.x),
		y: Math.min(e.y, t.y),
		width: Math.abs(t.x - e.x),
		height: Math.abs(t.y - e.y)
	};
}
function Qe(e, t) {
	return e.x <= t.x + t.width && e.x + e.width >= t.x && e.y <= t.y + t.height && e.y + e.height >= t.y;
}
function $e(e, t) {
	return e.filter((e) => Qe(t, Xe(e))).map((e) => e.id);
}
function et(e) {
	return {
		nodeIds: [e],
		wireIds: []
	};
}
function tt(e) {
	return {
		nodeIds: [],
		wireIds: [e]
	};
}
function nt(e, t) {
	return {
		nodeIds: e.nodeIds.includes(t) ? e.nodeIds.filter((e) => e !== t) : [...e.nodeIds, t],
		wireIds: e.wireIds
	};
}
function rt(e, t) {
	let n = e.wireIds.includes(t) ? e.wireIds.filter((e) => e !== t) : [...e.wireIds, t];
	return {
		nodeIds: e.nodeIds,
		wireIds: n
	};
}
function it(e, t, n) {
	return {
		nodeIds: n ? [.../* @__PURE__ */ new Set([...e.nodeIds, ...t])] : [...new Set(t)],
		wireIds: n ? e.wireIds : []
	};
}
function at(e) {
	return new TextEncoder().encode(JSON.stringify(e)).byteLength;
}
function ot(e, t, n) {
	return [
		...e,
		t,
		...n
	].reduce((e, t) => e + at(t), 0);
}
function st(e, t, n, r) {
	for (; e.length > n;) e.shift();
	for (; e.length > 0 && ot(e, t, []) > r;) e.shift();
	return e;
}
function T(e) {
	let t = d(e);
	return {
		past: [],
		present: t,
		future: [],
		estimatedBytes: at(t)
	};
}
function ct(e, t, n = {}) {
	if (t === e.present || JSON.stringify(t) === JSON.stringify(e.present)) return e;
	let r = d(t), i = st([...e.past, d(e.present)], r, n.maximumEntries ?? 100, n.maximumBytes ?? 5242880);
	return {
		past: i,
		present: r,
		future: [],
		estimatedBytes: ot(i, r, [])
	};
}
function lt(e) {
	let t = e.past.at(-1);
	if (!t) return e;
	let n = e.past.slice(0, -1), r = d(t), i = [d(e.present), ...e.future];
	return {
		past: n,
		present: r,
		future: i,
		estimatedBytes: ot(n, r, i)
	};
}
function ut(e) {
	let t = e.future[0];
	if (!t) return e;
	let n = [...e.past, d(e.present)], r = d(t), i = e.future.slice(1);
	return {
		past: n,
		present: r,
		future: i,
		estimatedBytes: ot(n, r, i)
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/domain/parse-workspace.ts
var dt = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/, ft = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/, pt = /^(out|in-(?:[0-9]|1[01]))$/, mt = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/i;
function ht(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function E(e, t) {
	return Object.prototype.hasOwnProperty.call(e, t);
}
function D(e, t) {
	return `${e}/${String(t).replaceAll("~", "~0").replaceAll("/", "~1")}`;
}
function O(e, t, n, r, i = {}) {
	e.push({
		code: t,
		reason: n,
		path: r,
		params: i
	});
}
function gt(e) {
	let t = mt.exec(e);
	if (!t) return !1;
	let n = Number(t[1]), r = Number(t[2]), i = Number(t[3]), a = Number(t[4]), o = Number(t[5]), s = Number(t[6]), c = t[8] === void 0 ? 0 : Number(t[8]), l = t[9] === void 0 ? 0 : Number(t[9]);
	if (n < 1 || r < 1 || r > 12 || a > 23 || o > 59 || s > 60 || c > 23 || l > 59) return !1;
	let u = new Date(Date.UTC(n, r, 0)).getUTCDate();
	return i >= 1 && i <= u;
}
function k(e, t, n, r, i) {
	if (!ht(e)) return O(i, "SCHEMA_INVALID", "invalid_type", t, { expected: "object" }), null;
	let a = new Set(r);
	for (let n of Object.keys(e)) a.has(n) || O(i, "SCHEMA_INVALID", "unexpected_property", D(t, n), { property: n });
	for (let r of n) E(e, r) || O(i, "SCHEMA_INVALID", "missing_property", D(t, r), { property: r });
	return e;
}
function A(e, t, n, r = {}) {
	if (typeof e != "string") {
		O(n, "SCHEMA_INVALID", "invalid_type", t, { expected: "string" });
		return;
	}
	let i = [...e].length;
	r.minimumLength !== void 0 && i < r.minimumLength && O(n, "SCHEMA_INVALID", "too_short", t, {
		minimumLength: r.minimumLength,
		actualLength: i
	}), r.maximumLength !== void 0 && i > r.maximumLength && O(n, "SCHEMA_INVALID", "too_long", t, {
		maximumLength: r.maximumLength,
		actualLength: i
	}), r.pattern && !r.pattern.test(e) && O(n, "SCHEMA_INVALID", "invalid_pattern", t, { pattern: r.pattern.source }), r.format === "date-time" && !gt(e) && O(n, "SCHEMA_INVALID", "invalid_format", t, { format: "date-time" });
}
function j(e, t, n, r, i) {
	if (typeof e != "number" || !Number.isFinite(e)) {
		O(n, "SCHEMA_INVALID", "invalid_type", t, { expected: "finite-number" });
		return;
	}
	(r !== void 0 && e < r || i !== void 0 && e > i) && O(n, "SCHEMA_INVALID", "out_of_range", t, {
		minimum: r ?? null,
		maximum: i ?? null,
		actual: e
	});
}
function _t(e, t, n, r, i) {
	if (typeof e != "number" || !Number.isInteger(e)) {
		O(n, "SCHEMA_INVALID", "invalid_type", t, { expected: "integer" });
		return;
	}
	(e < r || i !== void 0 && e > i) && O(n, "SCHEMA_INVALID", "out_of_range", t, {
		minimum: r,
		maximum: i ?? null,
		actual: e
	});
}
function M(e, t, n, r) {
	e !== t && O(r, "SCHEMA_INVALID", "invalid_const", n, {
		expected: t,
		actual: typeof e == "string" || typeof e == "number" ? e : null
	});
}
function N(e, t, n, r) {
	(typeof e != "string" || !t.includes(e)) && O(r, "SCHEMA_INVALID", "invalid_enum", n, { allowed: t.join("|") });
}
function vt(e, t, n) {
	e !== 0 && e !== 1 && O(n, "SCHEMA_INVALID", "invalid_enum", t, { allowed: "0|1" });
}
function yt(e, t, r) {
	let i = k(e, t, ["x", "y"], ["x", "y"], r);
	i && (E(i, "x") && j(i.x, D(t, "x"), r, 0, n.width), E(i, "y") && j(i.y, D(t, "y"), r, 0, n.height));
}
function bt(e, t, a) {
	let c = [
		"id",
		"role",
		"component",
		"label",
		"labelPlacement",
		"position",
		"inputCount"
	], l = k(e, t, c, [
		...c,
		"constantValue",
		"outputDisplay"
	], a);
	l && (E(l, "id") && A(l.id, D(t, "id"), a, { pattern: ft }), E(l, "role") && N(l.role, r, D(t, "role"), a), E(l, "component") && N(l.component, s, D(t, "component"), a), E(l, "label") && A(l.label, D(t, "label"), a, { maximumLength: n.maximumLabelLength }), E(l, "labelPlacement") && N(l.labelPlacement, i, D(t, "labelPlacement"), a), E(l, "position") && yt(l.position, D(t, "position"), a), E(l, "inputCount") && _t(l.inputCount, D(t, "inputCount"), a, 0, 12), E(l, "constantValue") && vt(l.constantValue, D(t, "constantValue"), a), E(l, "outputDisplay") && N(l.outputDisplay, o, D(t, "outputDisplay"), a));
}
function xt(e, t, n) {
	let r = k(e, t, ["nodeId", "portId"], ["nodeId", "portId"], n);
	r && (E(r, "nodeId") && A(r.nodeId, D(t, "nodeId"), n, { pattern: ft }), E(r, "portId") && A(r.portId, D(t, "portId"), n, { pattern: pt }));
}
function St(e, t, r) {
	let i = k(e, t, ["mode", "waypoints"], ["mode", "waypoints"], r);
	if (!i || (E(i, "mode") && N(i.mode, a, D(t, "mode"), r), !E(i, "waypoints"))) return;
	let o = D(t, "waypoints");
	if (!Array.isArray(i.waypoints)) {
		O(r, "SCHEMA_INVALID", "invalid_type", o, { expected: "array" });
		return;
	}
	i.waypoints.length > n.maximumWaypoints && O(r, "SCHEMA_INVALID", "too_many_items", o, {
		maximumItems: n.maximumWaypoints,
		actualItems: i.waypoints.length
	}), i.waypoints.forEach((e, t) => yt(e, D(o, t), r));
}
function Ct(e, t, r) {
	let i = [
		"id",
		"source",
		"target",
		"label",
		"route"
	], a = k(e, t, i, i, r);
	a && (E(a, "id") && A(a.id, D(t, "id"), r, { pattern: ft }), E(a, "source") && xt(a.source, D(t, "source"), r), E(a, "target") && xt(a.target, D(t, "target"), r), E(a, "label") && A(a.label, D(t, "label"), r, { maximumLength: n.maximumLabelLength }), E(a, "route") && St(a.route, D(t, "route"), r));
}
function wt(e, t, r) {
	let i = [
		"width",
		"height",
		"nodes",
		"wires"
	], a = k(e, t, i, i, r);
	if (a) {
		if (E(a, "width") && M(a.width, n.width, D(t, "width"), r), E(a, "height") && M(a.height, n.height, D(t, "height"), r), E(a, "nodes")) {
			let e = D(t, "nodes");
			Array.isArray(a.nodes) ? (a.nodes.length > n.maximumNodes && O(r, "SCHEMA_INVALID", "too_many_items", e, {
				maximumItems: n.maximumNodes,
				actualItems: a.nodes.length
			}), a.nodes.forEach((t, n) => bt(t, D(e, n), r))) : O(r, "SCHEMA_INVALID", "invalid_type", e, { expected: "array" });
		}
		if (E(a, "wires")) {
			let e = D(t, "wires");
			Array.isArray(a.wires) ? (a.wires.length > n.maximumWires && O(r, "SCHEMA_INVALID", "too_many_items", e, {
				maximumItems: n.maximumWires,
				actualItems: a.wires.length
			}), a.wires.forEach((t, n) => Ct(t, D(e, n), r))) : O(r, "SCHEMA_INVALID", "invalid_type", e, { expected: "array" });
		}
	}
}
function Tt(e, t, r) {
	if (!ht(e)) {
		O(r, "SCHEMA_INVALID", "invalid_type", t, { expected: "object" });
		return;
	}
	let i = Object.entries(e);
	i.length > n.maximumInputValues && O(r, "SCHEMA_INVALID", "too_many_properties", t, {
		maximumProperties: n.maximumInputValues,
		actualProperties: i.length
	});
	for (let [e, n] of i) vt(n, D(t, e), r);
}
function Et(e, t, r) {
	let i = k(e, t, [
		"x",
		"y",
		"zoom"
	], [
		"x",
		"y",
		"zoom"
	], r);
	i && (E(i, "x") && j(i.x, D(t, "x"), r), E(i, "y") && j(i.y, D(t, "y"), r), E(i, "zoom") && j(i.zoom, D(t, "zoom"), r, n.minimumZoom, n.maximumZoom));
}
function Dt(e, t, n) {
	let r = k(e, t, ["inputValues", "viewport"], ["inputValues", "viewport"], n);
	r && (E(r, "inputValues") && Tt(r.inputValues, D(t, "inputValues"), n), E(r, "viewport") && Et(r.viewport, D(t, "viewport"), n));
}
function Ot(r) {
	let i = [], a = [
		"schemaVersion",
		"kind",
		"labId",
		"artifactId",
		"revision",
		"title",
		"createdAt",
		"updatedAt",
		"circuit",
		"session"
	], o = k(r, "", a, [...a, "sourcePresetId"], i);
	if (!o) return {
		ok: !1,
		issues: i
	};
	if (E(o, "schemaVersion")) {
		let e = D("", "schemaVersion");
		typeof o.schemaVersion != "number" || !Number.isInteger(o.schemaVersion) ? O(i, "SCHEMA_INVALID", "invalid_type", e, { expected: "integer" }) : o.schemaVersion !== 1 && O(i, "UNSUPPORTED_VERSION", "unsupported_version", e, {
			supportedVersion: 1,
			actualVersion: o.schemaVersion
		});
	}
	return E(o, "kind") && M(o.kind, e, D("", "kind"), i), E(o, "labId") && M(o.labId, t, D("", "labId"), i), E(o, "artifactId") && A(o.artifactId, D("", "artifactId"), i, {
		maximumLength: n.maximumArtifactIdLength,
		pattern: dt
	}), E(o, "revision") && _t(o.revision, D("", "revision"), i, 0), E(o, "title") && A(o.title, D("", "title"), i, {
		minimumLength: 1,
		maximumLength: n.maximumTitleLength
	}), E(o, "createdAt") && A(o.createdAt, D("", "createdAt"), i, { format: "date-time" }), E(o, "updatedAt") && A(o.updatedAt, D("", "updatedAt"), i, { format: "date-time" }), E(o, "sourcePresetId") && o.sourcePresetId !== null && A(o.sourcePresetId, D("", "sourcePresetId"), i, { maximumLength: n.maximumPresetIdLength }), E(o, "circuit") && wt(o.circuit, D("", "circuit"), i), E(o, "session") && Dt(o.session, D("", "session"), i), i.length > 0 ? {
		ok: !1,
		issues: i
	} : {
		ok: !0,
		value: d(o)
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/validator/validate-document.ts
var kt = /* @__PURE__ */ new Set(["BUFFER", "NOT"]), At = [
	3,
	6,
	11
], jt = [
	3,
	5,
	7
], Mt = /* @__PURE__ */ new Set([
	"AND",
	"NAND",
	"OR",
	"NOR",
	"XOR",
	"XNOR",
	"ODD_PARITY",
	"EVEN_PARITY"
]);
function P(e, t, n = {}, r = {}) {
	return {
		code: e,
		severity: t,
		params: n,
		...r
	};
}
function Nt(e) {
	return e.role === "input" ? {
		minimum: 0,
		maximum: 0
	} : e.role === "output" || kt.has(e.component) ? {
		minimum: 1,
		maximum: 1
	} : e.component === "MUX" ? {
		minimum: 3,
		maximum: 11,
		allowed: At
	} : e.component === "MAJORITY" ? {
		minimum: 3,
		maximum: 7,
		allowed: jt
	} : Mt.has(e.component) ? {
		minimum: 2,
		maximum: 8
	} : {
		minimum: e.inputCount,
		maximum: e.inputCount
	};
}
function Pt(e) {
	let t = new Set(e.circuit.nodes.map((e) => e.id)), n = /* @__PURE__ */ new Map();
	for (let e of t) n.set(e, []);
	for (let r of e.circuit.wires) t.has(r.source.nodeId) && t.has(r.target.nodeId) && n.get(r.source.nodeId)?.push(r.target.nodeId);
	for (let e of n.values()) e.sort((e, t) => e.localeCompare(t));
	let r = /* @__PURE__ */ new Map(), i = [], a = /* @__PURE__ */ new Set();
	function o(e) {
		if (r.get(e) !== "visited") {
			if (r.get(e) === "visiting") {
				let t = i.lastIndexOf(e);
				for (let e of i.slice(t)) a.add(e);
				return;
			}
			r.set(e, "visiting"), i.push(e);
			for (let t of n.get(e) ?? []) o(t);
			i.pop(), r.set(e, "visited");
		}
	}
	for (let e of [...t].sort((e, t) => e.localeCompare(t))) o(e);
	return [...a].sort((e, t) => e.localeCompare(t));
}
function Ft(e) {
	let t = Ot(e);
	if (!t.ok) return {
		valid: !1,
		issues: t.issues.map((e) => P(e.code, "error", {
			reason: e.reason,
			...e.params
		}, { path: e.path }))
	};
	let r = t.value, i = [], a = r.circuit.nodes.filter((e) => e.role === "input"), o = r.circuit.nodes.filter((e) => e.role === "output"), s = r.circuit.nodes.filter((e) => e.role === "gate"), c = a.filter((e) => e.component !== "CONSTANT_0" && e.component !== "CONSTANT_1");
	for (let [e, t, n] of [
		[
			"input",
			c.length,
			8
		],
		[
			"output",
			o.length,
			8
		],
		[
			"gate",
			s.length,
			100
		]
	]) t > n && i.push(P("LIMIT_REACHED", "error", {
		kind: e,
		count: t,
		maximum: n
	}));
	let l = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map();
	for (let e of r.circuit.nodes) l.set(e.id, (l.get(e.id) ?? 0) + 1);
	for (let e of r.circuit.wires) d.set(e.id, (d.get(e.id) ?? 0) + 1);
	for (let [e, t] of l) t > 1 && i.push(P("DUPLICATE_ID", "error", {
		kind: "node",
		count: t
	}, { nodeId: e }));
	for (let [e, t] of d) t > 1 && i.push(P("DUPLICATE_ID", "error", {
		kind: "wire",
		count: t
	}, { wireId: e }));
	let f = new Map(r.circuit.nodes.map((e) => [e.id, e]));
	for (let e of r.circuit.nodes) {
		let t = u(e.component);
		e.role !== t && i.push(P("ROLE_COMPONENT_MISMATCH", "error", {
			expectedRole: t,
			actualRole: e.role
		}, { nodeId: e.id }));
		let r = Nt(e), a = r.allowed ? !r.allowed.includes(e.inputCount) : !1;
		(e.inputCount < r.minimum || e.inputCount > r.maximum || a) && i.push(P("INVALID_ARITY", "error", {
			minimum: r.minimum,
			maximum: r.maximum,
			actual: e.inputCount
		}, { nodeId: e.id })), (e.position.x < 0 || e.position.x > n.width || e.position.y < 0 || e.position.y > n.height) && i.push(P("OUT_OF_BOUNDS", "error", {
			x: e.position.x,
			y: e.position.y
		}, { nodeId: e.id })), e.component === "CONSTANT_0" && e.constantValue !== void 0 && e.constantValue !== 0 && i.push(P("INVALID_COMPONENT_CONFIGURATION", "error", {
			expected: 0,
			actual: e.constantValue
		}, { nodeId: e.id })), e.component === "CONSTANT_1" && e.constantValue !== void 0 && e.constantValue !== 1 && i.push(P("INVALID_COMPONENT_CONFIGURATION", "error", {
			expected: 1,
			actual: e.constantValue
		}, { nodeId: e.id }));
	}
	let p = /* @__PURE__ */ new Map();
	for (let e of r.circuit.wires) {
		let t = f.get(e.source.nodeId), n = f.get(e.target.nodeId);
		(!t || t.role === "output" || e.source.portId !== "out") && i.push(P("INVALID_SOURCE", "error", { reason: t ? t.role === "output" ? "output-terminal" : "invalid-port" : "unknown-node" }, {
			nodeId: e.source.nodeId,
			portId: e.source.portId,
			wireId: e.id
		}));
		let r = /^in-(\d+)$/.exec(e.target.portId), a = r ? Number(r[1]) : -1;
		if (!n || n.role === "input" || a < 0 || a >= (n?.inputCount ?? 0)) {
			i.push(P("INVALID_TARGET", "error", { reason: n ? n.role === "input" ? "input-terminal" : "invalid-port" : "unknown-node" }, {
				nodeId: e.target.nodeId,
				portId: e.target.portId,
				wireId: e.id
			}));
			continue;
		}
		let o = `${e.target.nodeId}:${e.target.portId}`, s = p.get(o) ?? [];
		s.push(e.id), p.set(o, s);
	}
	for (let [e, t] of p) {
		if (t.length <= 1) continue;
		let n = e.lastIndexOf(":");
		i.push(P("TARGET_OCCUPIED", "error", { wireIds: t.join("|") }, {
			nodeId: e.slice(0, n),
			portId: e.slice(n + 1)
		}));
	}
	let m = new Set(r.circuit.wires.map((e) => `${e.target.nodeId}:${e.target.portId}`));
	for (let e of r.circuit.nodes.filter((e) => e.role !== "input")) for (let t = 0; t < e.inputCount; t += 1) {
		let n = `in-${t}`;
		m.has(`${e.id}:${n}`) || i.push(P("UNCONNECTED_PIN", "warning", {}, {
			nodeId: e.id,
			portId: n
		}));
	}
	let h = Pt(r);
	return h.length > 0 && i.push(P("COMBINATIONAL_CYCLE", "error", { nodeIds: h.join("|") })), {
		valid: !i.some((e) => e.severity === "error"),
		artifact: r,
		issues: i
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/validator/validate-command.ts
function F(e, t, n = {}) {
	return {
		code: e,
		severity: "error",
		params: t,
		...n
	};
}
function I(e, t) {
	return {
		...e,
		circuit: t
	};
}
function L(e) {
	let t = Ft(e).issues.filter((e) => e.severity === "error");
	return {
		valid: t.length === 0,
		issues: t
	};
}
function It(e, t) {
	let n = new Map(e.circuit.nodes.map((e) => [e.id, e])), r = new Map(e.circuit.wires.map((e) => [e.id, e]));
	switch (t.type) {
		case "node.add": return n.has(t.node.id) ? {
			valid: !1,
			issues: [F("DUPLICATE_ID", { kind: "node" }, { nodeId: t.node.id })]
		} : L(I(e, {
			...e.circuit,
			nodes: [...e.circuit.nodes, t.node]
		}));
		case "node.update": return n.get(t.nodeId) ? L(I(e, {
			...e.circuit,
			nodes: e.circuit.nodes.map((e) => e.id === t.nodeId ? {
				...e,
				...t.patch,
				id: e.id
			} : e)
		})) : {
			valid: !1,
			issues: [F("INVALID_TARGET", { reason: "unknown-node" }, { nodeId: t.nodeId })]
		};
		case "node.move-many": {
			let r = Object.keys(t.positions).find((e) => !n.has(e));
			return r ? {
				valid: !1,
				issues: [F("INVALID_TARGET", { reason: "unknown-node" }, { nodeId: r })]
			} : L(I(e, {
				...e.circuit,
				nodes: e.circuit.nodes.map((e) => t.positions[e.id] ? {
					...e,
					position: t.positions[e.id]
				} : e)
			}));
		}
		case "node.duplicate-many": {
			let r = t.nodeIds.find((e) => !n.has(e));
			if (r) return {
				valid: !1,
				issues: [F("INVALID_TARGET", { reason: "unknown-node" }, { nodeId: r })]
			};
			let i = new Set(t.nodeIds).size, a = /* @__PURE__ */ new Map();
			for (let e of new Set(t.nodeIds)) {
				let t = n.get(e)?.role;
				t && a.set(t, (a.get(t) ?? 0) + 1);
			}
			let o = new Map([
				"input",
				"gate",
				"output"
			].map((t) => [t, e.circuit.nodes.filter((e) => e.role === t).length])), s = {
				input: 8,
				gate: 100,
				output: 8
			};
			for (let e of [
				"input",
				"gate",
				"output"
			]) {
				let t = (o.get(e) ?? 0) + (a.get(e) ?? 0);
				if (t > s[e]) return {
					valid: !1,
					issues: [F("LIMIT_REACHED", {
						kind: e,
						count: t,
						maximum: s[e]
					})]
				};
			}
			return i === 0 ? {
				valid: !1,
				issues: [F("INVALID_TARGET", { reason: "empty-selection" })]
			} : {
				valid: !0,
				issues: []
			};
		}
		case "node.delete-many": {
			let e = t.nodeIds.find((e) => !n.has(e));
			return e ? {
				valid: !1,
				issues: [F("INVALID_TARGET", { reason: "unknown-node" }, { nodeId: e })]
			} : {
				valid: !0,
				issues: []
			};
		}
		case "wire.connect": return r.has(t.wire.id) ? {
			valid: !1,
			issues: [F("DUPLICATE_ID", { kind: "wire" }, { wireId: t.wire.id })]
		} : L(I(e, {
			...e.circuit,
			wires: [...e.circuit.wires, t.wire]
		}));
		case "wire.reconnect": {
			let n = r.get(t.wireId);
			if (!n) return {
				valid: !1,
				issues: [F("INVALID_TARGET", { reason: "unknown-wire" }, { wireId: t.wireId })]
			};
			let i = {
				...n,
				...t.source ? { source: t.source } : {},
				...t.target ? { target: t.target } : {}
			};
			return L(I(e, {
				...e.circuit,
				wires: e.circuit.wires.map((e) => e.id === t.wireId ? i : e)
			}));
		}
		case "wire.update": return r.get(t.wireId) ? L(I(e, {
			...e.circuit,
			wires: e.circuit.wires.map((e) => e.id === t.wireId ? {
				...e,
				...t.patch,
				id: e.id
			} : e)
		})) : {
			valid: !1,
			issues: [F("INVALID_TARGET", { reason: "unknown-wire" }, { wireId: t.wireId })]
		};
		case "wire.delete-many": {
			let e = t.wireIds.find((e) => !r.has(e));
			return e ? {
				valid: !1,
				issues: [F("INVALID_TARGET", { reason: "unknown-wire" }, { wireId: e })]
			} : {
				valid: !0,
				issues: []
			};
		}
		case "document.replace-import":
		case "document.load-preset":
		case "document.reset": return L(t.artifact);
	}
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/state/reduce-command.ts
function Lt(e, t) {
	let n = 1, r = `${e}-copy`;
	for (; t.has(r);) n += 1, r = `${e}-copy-${n}`;
	return t.add(r), r;
}
function Rt(e, t) {
	let n = new Set(t.nodeIds), r = new Set(e.circuit.nodes.map((e) => e.id)), i = new Set(e.circuit.wires.map((e) => e.id)), a = /* @__PURE__ */ new Map(), o = [];
	for (let i of e.circuit.nodes.filter((e) => n.has(e.id))) {
		let e = Lt(i.id, r);
		a.set(i.id, e), o.push({
			...i,
			id: e,
			position: {
				x: i.position.x + t.offset.x,
				y: i.position.y + t.offset.y
			}
		});
	}
	let s = [];
	for (let n of e.circuit.wires) {
		let e = a.get(n.source.nodeId), r = a.get(n.target.nodeId);
		!e || !r || s.push({
			...n,
			id: Lt(n.id, i),
			source: {
				...n.source,
				nodeId: e
			},
			target: {
				...n.target,
				nodeId: r
			},
			route: {
				...n.route,
				waypoints: n.route.waypoints.map((e) => ({
					x: e.x + t.offset.x,
					y: e.y + t.offset.y
				}))
			}
		});
	}
	let c = { ...e.session.inputValues };
	for (let [t, n] of a) {
		let r = e.session.inputValues[t];
		r !== void 0 && (c[n] = r);
	}
	return {
		...e,
		circuit: {
			...e.circuit,
			nodes: [...e.circuit.nodes, ...o],
			wires: [...e.circuit.wires, ...s]
		},
		session: {
			...e.session,
			inputValues: c
		}
	};
}
function zt(e, t) {
	switch (t.type) {
		case "node.add": return {
			...e,
			circuit: {
				...e.circuit,
				nodes: [...e.circuit.nodes, t.node]
			}
		};
		case "node.update": return {
			...e,
			circuit: {
				...e.circuit,
				nodes: e.circuit.nodes.map((e) => e.id === t.nodeId ? {
					...e,
					...t.patch,
					id: e.id
				} : e)
			}
		};
		case "node.move-many": return {
			...e,
			circuit: {
				...e.circuit,
				nodes: e.circuit.nodes.map((e) => t.positions[e.id] ? {
					...e,
					position: t.positions[e.id]
				} : e)
			}
		};
		case "node.duplicate-many": return Rt(e, t);
		case "node.delete-many": {
			let n = new Set(t.nodeIds), r = Object.fromEntries(Object.entries(e.session.inputValues).filter(([e]) => !n.has(e)));
			return {
				...e,
				circuit: {
					...e.circuit,
					nodes: e.circuit.nodes.filter((e) => !n.has(e.id)),
					wires: e.circuit.wires.filter((e) => !n.has(e.source.nodeId) && !n.has(e.target.nodeId))
				},
				session: {
					...e.session,
					inputValues: r
				}
			};
		}
		case "wire.connect": return {
			...e,
			circuit: {
				...e.circuit,
				wires: [...e.circuit.wires, t.wire]
			}
		};
		case "wire.reconnect": return {
			...e,
			circuit: {
				...e.circuit,
				wires: e.circuit.wires.map((e) => e.id === t.wireId ? {
					...e,
					...t.source ? { source: t.source } : {},
					...t.target ? { target: t.target } : {}
				} : e)
			}
		};
		case "wire.update": return {
			...e,
			circuit: {
				...e.circuit,
				wires: e.circuit.wires.map((e) => e.id === t.wireId ? {
					...e,
					...t.patch,
					id: e.id
				} : e)
			}
		};
		case "wire.delete-many": {
			let n = new Set(t.wireIds);
			return {
				...e,
				circuit: {
					...e.circuit,
					wires: e.circuit.wires.filter((e) => !n.has(e.id))
				}
			};
		}
		case "document.replace-import":
		case "document.load-preset":
		case "document.reset": return {
			...d(t.artifact),
			artifactId: e.artifactId,
			createdAt: e.createdAt
		};
	}
}
function Bt(e, t, n) {
	let r = It(e, t);
	if (!r.valid) return {
		ok: !1,
		artifact: e,
		issues: r.issues
	};
	let i = {
		...zt(e, t),
		revision: e.revision + 1,
		updatedAt: n.updatedAt
	}, a = Ft(i).issues.filter((e) => e.severity === "error");
	return a.length > 0 ? {
		ok: !1,
		artifact: e,
		issues: a
	} : {
		ok: !0,
		artifact: d(i)
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/editor/auto-layout.ts
var Vt = {
	grid: 40,
	columnGap: 80,
	rowGap: 40,
	origin: {
		x: 40,
		y: 40
	}
};
function Ht(e, t) {
	return Math.round(e / t) * t;
}
function Ut(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
	for (let r of e.nodes) t.set(r.id, []), n.set(r.id, []);
	for (let r of e.wires) !t.has(r.target.nodeId) || !n.has(r.source.nodeId) || (t.get(r.target.nodeId).push(r.source.nodeId), n.get(r.source.nodeId).push(r.target.nodeId));
	let r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), a = [];
	for (let n of e.nodes) {
		let e = t.get(n.id).length;
		i.set(n.id, e), e === 0 && (r.set(n.id, 0), a.push(n.id));
	}
	for (; a.length > 0;) {
		let e = a.shift();
		for (let t of n.get(e) ?? []) {
			r.set(t, Math.max(r.get(t) ?? 0, (r.get(e) ?? 0) + 1));
			let n = (i.get(t) ?? 1) - 1;
			i.set(t, n), n === 0 && a.push(t);
		}
	}
	for (let t of e.nodes) r.has(t.id) || r.set(t.id, 0);
	return r;
}
function Wt(e, t = Vt) {
	if (e.nodes.length === 0) return {};
	let r = Ut(e), i = Math.max(...r.values()), a = /* @__PURE__ */ new Map();
	for (let t of e.nodes) a.set(t.id, t.role === "output" ? i : r.get(t.id));
	let o = Math.max(...a.values()), s = Array.from({ length: o + 1 }, () => []);
	for (let t of e.nodes) s[a.get(t.id)].push(t.id);
	let c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map();
	for (let t of e.nodes) c.set(t.id, []), l.set(t.id, []);
	for (let t of e.wires) c.get(t.target.nodeId)?.push(t.source.nodeId), l.get(t.source.nodeId)?.push(t.target.nodeId);
	for (let e of s) e.sort((e, t) => e.localeCompare(t));
	let u = /* @__PURE__ */ new Map(), d = () => {
		for (let e of s) e.forEach((e, t) => u.set(e, t));
	};
	d();
	let f = (e, t) => {
		let n = (t.get(e) ?? []).map((e) => u.get(e)).filter((e) => e !== void 0);
		return n.length === 0 ? u.get(e) : n.reduce((e, t) => e + t, 0) / n.length;
	};
	for (let e = 1; e <= o; e += 1) s[e].sort((e, t) => f(e, c) - f(t, c)), d();
	for (let e = o - 1; e >= 0; --e) s[e].sort((e, t) => f(e, l) - f(t, l)), d();
	let p = (t) => {
		let n = e.nodes.find((e) => e.id === t);
		return C(n.component, n.inputCount).width;
	}, m = (t) => {
		let n = e.nodes.find((e) => e.id === t);
		return C(n.component, n.inputCount).height;
	}, h = [], ee = t.origin.x;
	for (let e of s) {
		h.push(Ht(ee, t.grid));
		let n = e.length === 0 ? 0 : Math.max(...e.map(p));
		ee += n + t.columnGap;
	}
	let te = s.map((e) => e.reduce((e, n) => e + m(n) + t.rowGap, -t.rowGap)), ne = Math.max(0, ...te), re = {};
	for (let [e, r] of s.entries()) {
		let i = t.origin.y + Math.max(0, (ne - te[e]) / 2);
		for (let a of r) re[a] = {
			x: Math.min(h[e], n.width - p(a)),
			y: Math.min(Ht(i, t.grid), n.height - m(a))
		}, i += m(a) + t.rowGap;
	}
	return re;
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/domain/migrate-workspace.ts
function Gt(e) {
	return Ot(e);
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/persistence/checksum.ts
var Kt = new TextEncoder();
function qt(e) {
	return Array.isArray(e) ? e.map(qt) : e && typeof e == "object" ? Object.fromEntries(Object.entries(e).sort(([e], [t]) => e.localeCompare(t)).map(([e, t]) => [e, qt(t)])) : e;
}
function Jt(e) {
	return JSON.stringify(qt(e));
}
async function Yt(e) {
	let t = await crypto.subtle.digest("SHA-256", Kt.encode(Jt(e)));
	return [...new Uint8Array(t)].map((e) => e.toString(16).padStart(2, "0")).join("");
}
async function Xt(e, t) {
	return /^[a-f0-9]{64}$/.test(t) && await Yt(e) === t;
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/persistence/import-export.ts
var Zt = "digital-garden-lab-export";
async function Qt(e, t) {
	return {
		kind: Zt,
		exportedAt: t,
		checksum: await Yt(e),
		artifact: e
	};
}
async function $t(e, t) {
	return `${Jt(await Qt(e, t))}\n`;
}
async function en(e) {
	let t;
	try {
		t = JSON.parse(e);
	} catch {
		return {
			ok: !1,
			reason: "invalid-json"
		};
	}
	if (!t || typeof t != "object") return {
		ok: !1,
		reason: "invalid-envelope"
	};
	let n = t;
	if (n.kind !== "digital-garden-lab-export" || typeof n.exportedAt != "string" || typeof n.checksum != "string" || !n.artifact) return {
		ok: !1,
		reason: "invalid-envelope"
	};
	if (!await Xt(n.artifact, n.checksum)) return {
		ok: !1,
		reason: "checksum-mismatch"
	};
	let r = Gt(n.artifact);
	return r.ok ? {
		ok: !0,
		envelope: n,
		artifact: r.value
	} : {
		ok: !1,
		reason: "unsupported-or-corrupted"
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/persistence/share-envelope.ts
var tn = "digital-garden-circuit-share";
async function nn(e) {
	let t = d(e);
	return {
		kind: tn,
		version: 1,
		checksum: await Yt(t),
		artifact: t
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/persistence/share-codec.ts
var rn = new TextEncoder(), an = new TextDecoder();
function on(e) {
	let t = "";
	for (let n of e) t += String.fromCharCode(n);
	return btoa(t).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
function sn(e) {
	let t = e.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(e.length / 4) * 4, "="), n = atob(t);
	return Uint8Array.from(n, (e) => e.charCodeAt(0));
}
async function cn(e) {
	if (typeof CompressionStream > "u") return null;
	let t = new Blob([e]).stream().pipeThrough(new CompressionStream("deflate-raw"));
	return new Uint8Array(await new Response(t).arrayBuffer());
}
async function ln(e) {
	if (typeof DecompressionStream > "u") return null;
	try {
		let t = new Blob([e]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
		return new Uint8Array(await new Response(t).arrayBuffer());
	} catch {
		return null;
	}
}
async function un(e, t = 6e3) {
	let n = await nn(e), r = Jt(n), i = rn.encode(r), a = `circuit=${on(await cn(i) ?? i)}`;
	return a.length <= t ? {
		mode: "fragment",
		fragment: a,
		envelope: n
	} : {
		mode: "json",
		json: `${r}\n`,
		envelope: n
	};
}
async function dn(e, t) {
	let n;
	try {
		let t = e;
		if (e.startsWith("circuit=")) {
			let n = sn(e.slice(8)), r = await ln(n);
			t = an.decode(r ?? n);
		}
		n = JSON.parse(t);
	} catch {
		return {
			ok: !1,
			reason: "invalid"
		};
	}
	if (!n || typeof n != "object") return {
		ok: !1,
		reason: "invalid"
	};
	let r = n;
	if (r.kind !== "digital-garden-circuit-share" || r.version !== 1 || typeof r.checksum != "string" || !r.artifact) return {
		ok: !1,
		reason: "invalid"
	};
	if (!await Xt(r.artifact, r.checksum)) return {
		ok: !1,
		reason: "tampered"
	};
	let i = Gt(r.artifact);
	return i.ok ? {
		ok: !0,
		artifact: {
			...i.value,
			artifactId: t(),
			revision: 0,
			createdAt: (/* @__PURE__ */ new Date()).toISOString(),
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		}
	} : {
		ok: !1,
		reason: "unsupported"
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/persistence/local-artifact-store.ts
var R = `garden_labs_${t}`, z = `${R}:artifact`, B = `${R}:backup`, V = `${R}:staging`;
async function H(e) {
	if (!e) return null;
	try {
		let t = JSON.parse(e);
		if (!t.artifact || typeof t.checksum != "string" || !await Xt(t.artifact, t.checksum)) return null;
		let n = Gt(t.artifact);
		return n.ok ? n.value : null;
	} catch {
		return null;
	}
}
var fn = class {
	constructor(e, t = () => (/* @__PURE__ */ new Date()).toISOString()) {
		this.storage = e, this.now = t;
	}
	async load() {
		let e = await H(this.storage.getItem(z));
		if (e) return {
			ok: !0,
			artifact: e,
			source: "primary"
		};
		let t = await H(this.storage.getItem(B));
		return t ? {
			ok: !0,
			artifact: t,
			source: "backup"
		} : {
			ok: !1,
			reason: this.storage.getItem(z) || this.storage.getItem(B) ? "corrupted" : "missing"
		};
	}
	async save(e) {
		try {
			let t = JSON.stringify(await Qt(e, this.now()));
			if (this.storage.setItem(V, t), !await H(this.storage.getItem(V))) throw Error("Staged artifact failed checksum verification.");
			let n = this.storage.getItem(z);
			return n && this.storage.setItem(B, n), this.storage.setItem(z, t), this.storage.removeItem(V), { ok: !0 };
		} catch (e) {
			try {
				this.storage.removeItem(V);
			} catch {}
			return {
				ok: !1,
				reason: "quota-or-storage-failure",
				error: e
			};
		}
	}
	reset() {
		this.storage.removeItem(z), this.storage.removeItem(B), this.storage.removeItem(V);
	}
}, U = `${R}:slots`, pn = (e) => `${R}:slot:${e}`;
function mn(e) {
	try {
		let t = JSON.parse(e.getItem(U) ?? "[]");
		return Array.isArray(t) ? t.filter((e) => !!e && typeof e == "object" && typeof e.id == "string" && typeof e.name == "string" && typeof e.updatedAt == "string") : [];
	} catch {
		return [];
	}
}
var hn = class {
	constructor(e, t = () => (/* @__PURE__ */ new Date()).toISOString()) {
		this.storage = e, this.now = t;
	}
	list() {
		return mn(this.storage).sort((e, t) => t.updatedAt.localeCompare(e.updatedAt));
	}
	async save(e, t, n) {
		let r = e.trim().slice(0, 60);
		if (!r) return {
			ok: !1,
			reason: "empty-name"
		};
		let i = mn(this.storage), a = i.find((e) => e.id === n) ?? i.find((e) => e.name === r);
		if (!a && i.length >= 12) return {
			ok: !1,
			reason: "limit-reached"
		};
		let o = a?.id ?? `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, s = {
			id: o,
			name: r,
			updatedAt: this.now(),
			presetId: t.sourcePresetId ?? null
		};
		try {
			return this.storage.setItem(pn(o), JSON.stringify(await Qt(t, s.updatedAt))), this.storage.setItem(U, JSON.stringify([...i.filter((e) => e.id !== o), s])), {
				ok: !0,
				slot: s
			};
		} catch {
			try {
				this.storage.removeItem(pn(o));
			} catch {}
			return {
				ok: !1,
				reason: "quota-or-storage-failure"
			};
		}
	}
	async load(e) {
		return H(this.storage.getItem(pn(e)));
	}
	remove(e) {
		this.storage.removeItem(pn(e)), this.storage.setItem(U, JSON.stringify(mn(this.storage).filter((t) => t.id !== e)));
	}
	rename(e, t) {
		let n = t.trim().slice(0, 60);
		if (!n) return !1;
		let r = mn(this.storage);
		return r.some((t) => t.id === e) ? (this.storage.setItem(U, JSON.stringify(r.map((t) => t.id === e ? {
			...t,
			name: n
		} : t))), !0) : !1;
	}
}, gn = class {
	constructor(e, t = 350) {
		this.timeout = null, this.store = e, this.delayMilliseconds = t;
	}
	schedule(e, t) {
		this.timeout && clearTimeout(this.timeout), this.timeout = setTimeout(async () => {
			this.timeout = null, t?.(await this.store.save(e));
		}, this.delayMilliseconds);
	}
	cancel() {
		this.timeout && clearTimeout(this.timeout), this.timeout = null;
	}
}, _n = [
	{
		kind: "SWITCH",
		category: "essentials",
		inputCount: 0,
		keywords: ["input", "switch"]
	},
	{
		kind: "BUTTON",
		category: "essentials",
		inputCount: 0,
		keywords: [
			"input",
			"momentary",
			"button"
		]
	},
	{
		kind: "CONSTANT_0",
		category: "essentials",
		inputCount: 0,
		keywords: [
			"constant",
			"zero",
			"0"
		]
	},
	{
		kind: "CONSTANT_1",
		category: "essentials",
		inputCount: 0,
		keywords: [
			"constant",
			"one",
			"1"
		]
	},
	{
		kind: "PROBE",
		category: "essentials",
		inputCount: 1,
		keywords: ["output", "probe"]
	},
	{
		kind: "LED",
		category: "essentials",
		inputCount: 1,
		keywords: ["output", "light"]
	},
	{
		kind: "BUFFER",
		category: "gates",
		inputCount: 1,
		keywords: ["buffer", "gate"]
	},
	{
		kind: "NOT",
		category: "gates",
		inputCount: 1,
		keywords: [
			"not",
			"invert",
			"gate"
		]
	},
	{
		kind: "AND",
		category: "gates",
		inputCount: 2,
		keywords: ["and", "gate"]
	},
	{
		kind: "NAND",
		category: "gates",
		inputCount: 2,
		keywords: ["nand", "gate"]
	},
	{
		kind: "OR",
		category: "gates",
		inputCount: 2,
		keywords: ["or", "gate"]
	},
	{
		kind: "NOR",
		category: "gates",
		inputCount: 2,
		keywords: ["nor", "gate"]
	},
	{
		kind: "XOR",
		category: "gates",
		inputCount: 2,
		keywords: [
			"xor",
			"exclusive",
			"gate"
		]
	},
	{
		kind: "XNOR",
		category: "gates",
		inputCount: 2,
		keywords: [
			"xnor",
			"equivalence",
			"gate"
		]
	},
	{
		kind: "MUX",
		category: "combinational",
		inputCount: 3,
		keywords: [
			"mux",
			"multiplexer",
			"selector"
		]
	},
	{
		kind: "MAJORITY",
		category: "combinational",
		inputCount: 3,
		keywords: ["majority", "voter"]
	},
	{
		kind: "ODD_PARITY",
		category: "combinational",
		inputCount: 4,
		keywords: ["odd", "parity"]
	},
	{
		kind: "EVEN_PARITY",
		category: "combinational",
		inputCount: 4,
		keywords: ["even", "parity"]
	}
];
function vn(e) {
	return _n.find((t) => t.kind === e)?.inputCount ?? 2;
}
function yn(e, t) {
	let n = e.trim().toLocaleLowerCase("en");
	return _n.filter((e) => (!t || e.category === t) && (!n || [e.kind, ...e.keywords].some((e) => e.toLocaleLowerCase("en").includes(n))));
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/app/free-build/presets.ts
function W(r, i, a, o) {
	let s = a.map((e) => ({
		id: e.id,
		role: u(e.kind),
		component: e.kind,
		label: e.label ?? e.id.toUpperCase(),
		labelPlacement: "bottom",
		position: {
			x: e.x,
			y: e.y
		},
		inputCount: e.inputs ?? (u(e.kind) === "input" ? 0 : 1),
		...e.kind === "CONSTANT_0" ? { constantValue: 0 } : {},
		...e.kind === "CONSTANT_1" ? { constantValue: 1 } : {},
		...e.kind === "PROBE" ? { outputDisplay: "probe" } : {},
		...e.kind === "LED" ? { outputDisplay: "led" } : {}
	})), c = o.map((e, t) => ({
		id: `wire-${t + 1}`,
		source: {
			nodeId: e.from,
			portId: "out"
		},
		target: {
			nodeId: e.to,
			portId: `in-${e.port}`
		},
		label: "",
		route: {
			mode: "orthogonal-auto",
			waypoints: []
		}
	})), l = "2026-08-03T00:00:00Z";
	return {
		id: r,
		name: i,
		artifact: {
			schemaVersion: 1,
			kind: e,
			labId: t,
			artifactId: `preset-${r}`,
			revision: 0,
			title: i,
			createdAt: l,
			updatedAt: l,
			sourcePresetId: r,
			circuit: {
				width: n.width,
				height: n.height,
				nodes: s,
				wires: c
			},
			session: {
				inputValues: Object.fromEntries(s.filter((e) => e.role === "input").map((e) => [e.id, 0])),
				viewport: {
					x: 0,
					y: 0,
					zoom: 1
				}
			}
		}
	};
}
var bn = W("half-adder", "Half Adder", [
	{
		id: "x",
		kind: "SWITCH",
		x: 40,
		y: 40,
		label: "X"
	},
	{
		id: "y",
		kind: "SWITCH",
		x: 40,
		y: 180,
		label: "Y"
	},
	{
		id: "xor",
		kind: "XOR",
		x: 260,
		y: 24,
		inputs: 2
	},
	{
		id: "and",
		kind: "AND",
		x: 260,
		y: 180,
		inputs: 2
	},
	{
		id: "sum",
		kind: "PROBE",
		x: 500,
		y: 32,
		label: "SUM"
	},
	{
		id: "carry",
		kind: "LED",
		x: 500,
		y: 188,
		label: "CARRY"
	}
], [
	{
		from: "x",
		to: "xor",
		port: 0
	},
	{
		from: "y",
		to: "xor",
		port: 1
	},
	{
		from: "xor",
		to: "sum",
		port: 0
	},
	{
		from: "x",
		to: "and",
		port: 0
	},
	{
		from: "y",
		to: "and",
		port: 1
	},
	{
		from: "and",
		to: "carry",
		port: 0
	}
]), xn = [
	W("free-build", "Free build (empty canvas)", [], []),
	bn,
	W("full-adder", "Full Adder", [
		{
			id: "a",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "A"
		},
		{
			id: "b",
			kind: "SWITCH",
			x: 40,
			y: 170,
			label: "B"
		},
		{
			id: "cin",
			kind: "SWITCH",
			x: 40,
			y: 300,
			label: "CIN"
		},
		{
			id: "xor1",
			kind: "XOR",
			x: 240,
			y: 50,
			inputs: 2
		},
		{
			id: "xor2",
			kind: "XOR",
			x: 440,
			y: 110,
			inputs: 2
		},
		{
			id: "and1",
			kind: "AND",
			x: 240,
			y: 240,
			inputs: 2
		},
		{
			id: "and2",
			kind: "AND",
			x: 440,
			y: 300,
			inputs: 2
		},
		{
			id: "or",
			kind: "OR",
			x: 640,
			y: 330,
			inputs: 2
		},
		{
			id: "sum",
			kind: "PROBE",
			x: 640,
			y: 118,
			label: "SUM"
		},
		{
			id: "carry",
			kind: "LED",
			x: 840,
			y: 338,
			label: "CARRY"
		}
	], [
		{
			from: "a",
			to: "xor1",
			port: 0
		},
		{
			from: "b",
			to: "xor1",
			port: 1
		},
		{
			from: "xor1",
			to: "xor2",
			port: 0
		},
		{
			from: "cin",
			to: "xor2",
			port: 1
		},
		{
			from: "xor2",
			to: "sum",
			port: 0
		},
		{
			from: "a",
			to: "and1",
			port: 0
		},
		{
			from: "b",
			to: "and1",
			port: 1
		},
		{
			from: "xor1",
			to: "and2",
			port: 0
		},
		{
			from: "cin",
			to: "and2",
			port: 1
		},
		{
			from: "and1",
			to: "or",
			port: 0
		},
		{
			from: "and2",
			to: "or",
			port: 1
		},
		{
			from: "or",
			to: "carry",
			port: 0
		}
	]),
	W("half-subtractor", "Half Subtractor", [
		{
			id: "x",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "X"
		},
		{
			id: "y",
			kind: "SWITCH",
			x: 40,
			y: 190,
			label: "Y"
		},
		{
			id: "xor",
			kind: "XOR",
			x: 260,
			y: 24,
			inputs: 2
		},
		{
			id: "not",
			kind: "NOT",
			x: 260,
			y: 210
		},
		{
			id: "and",
			kind: "AND",
			x: 460,
			y: 230,
			inputs: 2
		},
		{
			id: "difference",
			kind: "PROBE",
			x: 500,
			y: 32,
			label: "DIFFERENCE"
		},
		{
			id: "borrow",
			kind: "LED",
			x: 700,
			y: 238,
			label: "BORROW"
		}
	], [
		{
			from: "x",
			to: "xor",
			port: 0
		},
		{
			from: "y",
			to: "xor",
			port: 1
		},
		{
			from: "xor",
			to: "difference",
			port: 0
		},
		{
			from: "x",
			to: "not",
			port: 0
		},
		{
			from: "not",
			to: "and",
			port: 0
		},
		{
			from: "y",
			to: "and",
			port: 1
		},
		{
			from: "and",
			to: "borrow",
			port: 0
		}
	]),
	W("2-to-1-multiplexer", "2-to-1 Multiplexer", [
		{
			id: "d0",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "D0"
		},
		{
			id: "d1",
			kind: "SWITCH",
			x: 40,
			y: 170,
			label: "D1"
		},
		{
			id: "s",
			kind: "SWITCH",
			x: 40,
			y: 320,
			label: "S"
		},
		{
			id: "mux",
			kind: "MUX",
			x: 280,
			y: 70,
			inputs: 3
		},
		{
			id: "f",
			kind: "LED",
			x: 520,
			y: 78,
			label: "F"
		}
	], [
		{
			from: "d0",
			to: "mux",
			port: 0
		},
		{
			from: "d1",
			to: "mux",
			port: 1
		},
		{
			from: "s",
			to: "mux",
			port: 2
		},
		{
			from: "mux",
			to: "f",
			port: 0
		}
	]),
	W("majority-voter", "Majority Voter", [
		{
			id: "a",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "A"
		},
		{
			id: "b",
			kind: "SWITCH",
			x: 40,
			y: 170,
			label: "B"
		},
		{
			id: "c",
			kind: "SWITCH",
			x: 40,
			y: 300,
			label: "C"
		},
		{
			id: "majority",
			kind: "MAJORITY",
			x: 280,
			y: 130,
			inputs: 3
		},
		{
			id: "f",
			kind: "LED",
			x: 520,
			y: 138,
			label: "F"
		}
	], [
		{
			from: "a",
			to: "majority",
			port: 0
		},
		{
			from: "b",
			to: "majority",
			port: 1
		},
		{
			from: "c",
			to: "majority",
			port: 2
		},
		{
			from: "majority",
			to: "f",
			port: 0
		}
	]),
	W("odd-parity-detector", "Odd Parity Detector", [
		...Array.from({ length: 4 }, (e, t) => ({
			id: `i${t}`,
			kind: "SWITCH",
			x: 40,
			y: 40 + t * 130,
			label: `I${t}`
		})),
		{
			id: "parity",
			kind: "ODD_PARITY",
			x: 280,
			y: 190,
			inputs: 4
		},
		{
			id: "f",
			kind: "PROBE",
			x: 520,
			y: 198,
			label: "ODD"
		}
	], [...Array.from({ length: 4 }, (e, t) => ({
		from: `i${t}`,
		to: "parity",
		port: t
	})), {
		from: "parity",
		to: "f",
		port: 0
	}]),
	W("even-parity-detector", "Even Parity Detector", [
		...Array.from({ length: 4 }, (e, t) => ({
			id: `i${t}`,
			kind: "SWITCH",
			x: 40,
			y: 40 + t * 130,
			label: `I${t}`
		})),
		{
			id: "parity",
			kind: "EVEN_PARITY",
			x: 280,
			y: 190,
			inputs: 4
		},
		{
			id: "f",
			kind: "LED",
			x: 520,
			y: 198,
			label: "EVEN"
		}
	], [...Array.from({ length: 4 }, (e, t) => ({
		from: `i${t}`,
		to: "parity",
		port: t
	})), {
		from: "parity",
		to: "f",
		port: 0
	}]),
	W("universal-nand", "NAND as Universal Gate", [
		{
			id: "a",
			kind: "SWITCH",
			x: 40,
			y: 80,
			label: "A"
		},
		{
			id: "nand",
			kind: "NAND",
			x: 280,
			y: 64,
			inputs: 2
		},
		{
			id: "not-a",
			kind: "PROBE",
			x: 520,
			y: 72,
			label: "NOT A"
		}
	], [
		{
			from: "a",
			to: "nand",
			port: 0
		},
		{
			from: "a",
			to: "nand",
			port: 1
		},
		{
			from: "nand",
			to: "not-a",
			port: 0
		}
	]),
	W("de-morgan", "De Morgan's Law", [
		{
			id: "a",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "A"
		},
		{
			id: "b",
			kind: "SWITCH",
			x: 40,
			y: 180,
			label: "B"
		},
		{
			id: "nor",
			kind: "NOR",
			x: 280,
			y: 70,
			inputs: 2
		},
		{
			id: "f",
			kind: "PROBE",
			x: 520,
			y: 78,
			label: "NOT (A+B)"
		}
	], [
		{
			from: "a",
			to: "nor",
			port: 0
		},
		{
			from: "b",
			to: "nor",
			port: 1
		},
		{
			from: "nor",
			to: "f",
			port: 0
		}
	]),
	W("binary-equivalence", "Binary Equivalence", [
		{
			id: "a",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "A"
		},
		{
			id: "b",
			kind: "SWITCH",
			x: 40,
			y: 180,
			label: "B"
		},
		{
			id: "xnor",
			kind: "XNOR",
			x: 280,
			y: 70,
			inputs: 2
		},
		{
			id: "equal",
			kind: "LED",
			x: 520,
			y: 78,
			label: "EQUAL"
		}
	], [
		{
			from: "a",
			to: "xnor",
			port: 0
		},
		{
			from: "b",
			to: "xnor",
			port: 1
		},
		{
			from: "xnor",
			to: "equal",
			port: 0
		}
	]),
	W("6-variable-parity", "6-variable Parity", [
		...Array.from({ length: 6 }, (e, t) => ({
			id: `i${t}`,
			kind: "SWITCH",
			x: 40,
			y: 40 + t * 120,
			label: `I${t}`
		})),
		{
			id: "parity",
			kind: "ODD_PARITY",
			x: 300,
			y: 320,
			inputs: 6
		},
		{
			id: "f",
			kind: "LED",
			x: 540,
			y: 328,
			label: "PARITY"
		}
	], [...Array.from({ length: 6 }, (e, t) => ({
		from: `i${t}`,
		to: "parity",
		port: t
	})), {
		from: "parity",
		to: "f",
		port: 0
	}]),
	W("consensus-theorem", "Consensus Theorem", [
		{
			id: "a",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "A"
		},
		{
			id: "b",
			kind: "SWITCH",
			x: 40,
			y: 170,
			label: "B"
		},
		{
			id: "c",
			kind: "SWITCH",
			x: 40,
			y: 300,
			label: "C"
		},
		{
			id: "and1",
			kind: "AND",
			x: 240,
			y: 40,
			inputs: 2,
			label: "AND1"
		},
		{
			id: "and2",
			kind: "AND",
			x: 240,
			y: 170,
			inputs: 2,
			label: "AND2"
		},
		{
			id: "and3",
			kind: "AND",
			x: 240,
			y: 300,
			inputs: 2,
			label: "AND3"
		},
		{
			id: "or1",
			kind: "OR",
			x: 440,
			y: 40,
			inputs: 3,
			label: "OR1"
		},
		{
			id: "f",
			kind: "PROBE",
			x: 640,
			y: 40,
			label: "F"
		}
	], [
		{
			from: "a",
			to: "and1",
			port: 0
		},
		{
			from: "b",
			to: "and1",
			port: 1
		},
		{
			from: "a",
			to: "and2",
			port: 0
		},
		{
			from: "c",
			to: "and2",
			port: 1
		},
		{
			from: "b",
			to: "and3",
			port: 0
		},
		{
			from: "c",
			to: "and3",
			port: 1
		},
		{
			from: "and1",
			to: "or1",
			port: 0
		},
		{
			from: "and2",
			to: "or1",
			port: 1
		},
		{
			from: "and3",
			to: "or1",
			port: 2
		},
		{
			from: "or1",
			to: "f",
			port: 0
		}
	]),
	W("sop-vs-pos", "SOP vs POS", [
		{
			id: "a",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "A"
		},
		{
			id: "b",
			kind: "SWITCH",
			x: 40,
			y: 170,
			label: "B"
		},
		{
			id: "c",
			kind: "SWITCH",
			x: 40,
			y: 300,
			label: "C"
		},
		{
			id: "nota",
			kind: "NOT",
			x: 240,
			y: 40,
			label: "NOTA"
		},
		{
			id: "notb",
			kind: "NOT",
			x: 240,
			y: 170,
			label: "NOTB"
		},
		{
			id: "notc",
			kind: "NOT",
			x: 240,
			y: 300,
			label: "NOTC"
		},
		{
			id: "and1",
			kind: "AND",
			x: 440,
			y: 40,
			inputs: 3,
			label: "AND1"
		},
		{
			id: "and2",
			kind: "AND",
			x: 440,
			y: 170,
			inputs: 3,
			label: "AND2"
		},
		{
			id: "or1",
			kind: "OR",
			x: 640,
			y: 40,
			inputs: 2,
			label: "OR1"
		},
		{
			id: "or2",
			kind: "OR",
			x: 640,
			y: 170,
			inputs: 3,
			label: "OR2"
		},
		{
			id: "or3",
			kind: "OR",
			x: 640,
			y: 300,
			inputs: 3,
			label: "OR3"
		},
		{
			id: "and3",
			kind: "AND",
			x: 840,
			y: 40,
			inputs: 3,
			label: "AND3"
		},
		{
			id: "f_sop",
			kind: "PROBE",
			x: 1040,
			y: 40,
			label: "FSOP"
		},
		{
			id: "f_pos",
			kind: "PROBE",
			x: 1040,
			y: 170,
			label: "FPOS"
		}
	], [
		{
			from: "a",
			to: "nota",
			port: 0
		},
		{
			from: "b",
			to: "notb",
			port: 0
		},
		{
			from: "c",
			to: "notc",
			port: 0
		},
		{
			from: "a",
			to: "and1",
			port: 0
		},
		{
			from: "b",
			to: "and1",
			port: 1
		},
		{
			from: "c",
			to: "and1",
			port: 2
		},
		{
			from: "nota",
			to: "and2",
			port: 0
		},
		{
			from: "notb",
			to: "and2",
			port: 1
		},
		{
			from: "notc",
			to: "and2",
			port: 2
		},
		{
			from: "and1",
			to: "or1",
			port: 0
		},
		{
			from: "and2",
			to: "or1",
			port: 1
		},
		{
			from: "or1",
			to: "f_sop",
			port: 0
		},
		{
			from: "a",
			to: "or2",
			port: 0
		},
		{
			from: "b",
			to: "or2",
			port: 1
		},
		{
			from: "c",
			to: "or2",
			port: 2
		},
		{
			from: "nota",
			to: "or3",
			port: 0
		},
		{
			from: "notb",
			to: "or3",
			port: 1
		},
		{
			from: "notc",
			to: "or3",
			port: 2
		},
		{
			from: "or2",
			to: "and3",
			port: 0
		},
		{
			from: "or3",
			to: "and3",
			port: 1
		},
		{
			from: "or2",
			to: "and3",
			port: 2
		},
		{
			from: "and3",
			to: "f_pos",
			port: 0
		}
	]),
	W("mux-4-to-1", "4-to-1 MUX", [
		{
			id: "d0",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "D0"
		},
		{
			id: "d1",
			kind: "SWITCH",
			x: 40,
			y: 170,
			label: "D1"
		},
		{
			id: "d2",
			kind: "SWITCH",
			x: 40,
			y: 300,
			label: "D2"
		},
		{
			id: "d3",
			kind: "SWITCH",
			x: 40,
			y: 430,
			label: "D3"
		},
		{
			id: "s0",
			kind: "SWITCH",
			x: 40,
			y: 560,
			label: "S0"
		},
		{
			id: "s1",
			kind: "SWITCH",
			x: 240,
			y: 40,
			label: "S1"
		},
		{
			id: "nots0",
			kind: "NOT",
			x: 240,
			y: 170,
			label: "NOTS0"
		},
		{
			id: "nots1",
			kind: "NOT",
			x: 240,
			y: 300,
			label: "NOTS1"
		},
		{
			id: "and1",
			kind: "AND",
			x: 440,
			y: 40,
			inputs: 3,
			label: "AND1"
		},
		{
			id: "and2",
			kind: "AND",
			x: 440,
			y: 170,
			inputs: 3,
			label: "AND2"
		},
		{
			id: "and3",
			kind: "AND",
			x: 440,
			y: 300,
			inputs: 3,
			label: "AND3"
		},
		{
			id: "and4",
			kind: "AND",
			x: 440,
			y: 430,
			inputs: 3,
			label: "AND4"
		},
		{
			id: "or1",
			kind: "OR",
			x: 640,
			y: 40,
			inputs: 4,
			label: "OR1"
		},
		{
			id: "y",
			kind: "PROBE",
			x: 840,
			y: 40,
			label: "Y"
		}
	], [
		{
			from: "s0",
			to: "nots0",
			port: 0
		},
		{
			from: "s1",
			to: "nots1",
			port: 0
		},
		{
			from: "d0",
			to: "and1",
			port: 0
		},
		{
			from: "nots0",
			to: "and1",
			port: 1
		},
		{
			from: "nots1",
			to: "and1",
			port: 2
		},
		{
			from: "d1",
			to: "and2",
			port: 0
		},
		{
			from: "s0",
			to: "and2",
			port: 1
		},
		{
			from: "nots1",
			to: "and2",
			port: 2
		},
		{
			from: "d2",
			to: "and3",
			port: 0
		},
		{
			from: "nots0",
			to: "and3",
			port: 1
		},
		{
			from: "s1",
			to: "and3",
			port: 2
		},
		{
			from: "d3",
			to: "and4",
			port: 0
		},
		{
			from: "s0",
			to: "and4",
			port: 1
		},
		{
			from: "s1",
			to: "and4",
			port: 2
		},
		{
			from: "and1",
			to: "or1",
			port: 0
		},
		{
			from: "and2",
			to: "or1",
			port: 1
		},
		{
			from: "and3",
			to: "or1",
			port: 2
		},
		{
			from: "and4",
			to: "or1",
			port: 3
		},
		{
			from: "or1",
			to: "y",
			port: 0
		}
	]),
	W("decoder-2-to-4", "2-to-4 Decoder", [
		{
			id: "a",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "A"
		},
		{
			id: "b",
			kind: "SWITCH",
			x: 40,
			y: 170,
			label: "B"
		},
		{
			id: "en",
			kind: "SWITCH",
			x: 40,
			y: 300,
			label: "EN"
		},
		{
			id: "nota",
			kind: "NOT",
			x: 240,
			y: 40,
			label: "NOTA"
		},
		{
			id: "notb",
			kind: "NOT",
			x: 240,
			y: 170,
			label: "NOTB"
		},
		{
			id: "and0",
			kind: "AND",
			x: 440,
			y: 40,
			inputs: 3,
			label: "AND0"
		},
		{
			id: "and1",
			kind: "AND",
			x: 440,
			y: 170,
			inputs: 3,
			label: "AND1"
		},
		{
			id: "and2",
			kind: "AND",
			x: 440,
			y: 300,
			inputs: 3,
			label: "AND2"
		},
		{
			id: "and3",
			kind: "AND",
			x: 440,
			y: 430,
			inputs: 3,
			label: "AND3"
		},
		{
			id: "y0",
			kind: "PROBE",
			x: 640,
			y: 40,
			label: "Y0"
		},
		{
			id: "y1",
			kind: "PROBE",
			x: 640,
			y: 170,
			label: "Y1"
		},
		{
			id: "y2",
			kind: "PROBE",
			x: 640,
			y: 300,
			label: "Y2"
		},
		{
			id: "y3",
			kind: "PROBE",
			x: 640,
			y: 430,
			label: "Y3"
		}
	], [
		{
			from: "a",
			to: "nota",
			port: 0
		},
		{
			from: "b",
			to: "notb",
			port: 0
		},
		{
			from: "nota",
			to: "and0",
			port: 0
		},
		{
			from: "notb",
			to: "and0",
			port: 1
		},
		{
			from: "en",
			to: "and0",
			port: 2
		},
		{
			from: "a",
			to: "and1",
			port: 0
		},
		{
			from: "notb",
			to: "and1",
			port: 1
		},
		{
			from: "en",
			to: "and1",
			port: 2
		},
		{
			from: "nota",
			to: "and2",
			port: 0
		},
		{
			from: "b",
			to: "and2",
			port: 1
		},
		{
			from: "en",
			to: "and2",
			port: 2
		},
		{
			from: "a",
			to: "and3",
			port: 0
		},
		{
			from: "b",
			to: "and3",
			port: 1
		},
		{
			from: "en",
			to: "and3",
			port: 2
		},
		{
			from: "and0",
			to: "y0",
			port: 0
		},
		{
			from: "and1",
			to: "y1",
			port: 0
		},
		{
			from: "and2",
			to: "y2",
			port: 0
		},
		{
			from: "and3",
			to: "y3",
			port: 0
		}
	]),
	W("comparator-1-bit", "1-bit Magnitude Comparator", [
		{
			id: "a",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "A"
		},
		{
			id: "b",
			kind: "SWITCH",
			x: 40,
			y: 170,
			label: "B"
		},
		{
			id: "nota",
			kind: "NOT",
			x: 240,
			y: 40,
			label: "NOTA"
		},
		{
			id: "notb",
			kind: "NOT",
			x: 240,
			y: 170,
			label: "NOTB"
		},
		{
			id: "and1",
			kind: "AND",
			x: 440,
			y: 40,
			inputs: 2,
			label: "AND1"
		},
		{
			id: "and2",
			kind: "AND",
			x: 440,
			y: 170,
			inputs: 2,
			label: "AND2"
		},
		{
			id: "xnor1",
			kind: "XNOR",
			x: 440,
			y: 300,
			inputs: 2,
			label: "XNOR"
		},
		{
			id: "gt",
			kind: "PROBE",
			x: 640,
			y: 40,
			label: "GT"
		},
		{
			id: "lt",
			kind: "PROBE",
			x: 640,
			y: 170,
			label: "LT"
		},
		{
			id: "eq",
			kind: "PROBE",
			x: 640,
			y: 300,
			label: "EQ"
		}
	], [
		{
			from: "a",
			to: "nota",
			port: 0
		},
		{
			from: "b",
			to: "notb",
			port: 0
		},
		{
			from: "a",
			to: "and1",
			port: 0
		},
		{
			from: "notb",
			to: "and1",
			port: 1
		},
		{
			from: "nota",
			to: "and2",
			port: 0
		},
		{
			from: "b",
			to: "and2",
			port: 1
		},
		{
			from: "a",
			to: "xnor1",
			port: 0
		},
		{
			from: "b",
			to: "xnor1",
			port: 1
		},
		{
			from: "and1",
			to: "gt",
			port: 0
		},
		{
			from: "and2",
			to: "lt",
			port: 0
		},
		{
			from: "xnor1",
			to: "eq",
			port: 0
		}
	]),
	W("kmap-minimization", "K-map Minimization", [
		{
			id: "a",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "A"
		},
		{
			id: "b",
			kind: "SWITCH",
			x: 40,
			y: 170,
			label: "B"
		},
		{
			id: "c",
			kind: "SWITCH",
			x: 40,
			y: 300,
			label: "C"
		},
		{
			id: "d",
			kind: "SWITCH",
			x: 40,
			y: 430,
			label: "D"
		},
		{
			id: "and1",
			kind: "AND",
			x: 240,
			y: 40,
			inputs: 2,
			label: "AND1"
		},
		{
			id: "and2",
			kind: "AND",
			x: 240,
			y: 170,
			inputs: 2,
			label: "AND2"
		},
		{
			id: "and3",
			kind: "AND",
			x: 240,
			y: 300,
			inputs: 2,
			label: "AND3"
		},
		{
			id: "or1",
			kind: "OR",
			x: 440,
			y: 40,
			inputs: 3,
			label: "OR1"
		},
		{
			id: "f",
			kind: "PROBE",
			x: 640,
			y: 40,
			label: "F"
		}
	], [
		{
			from: "a",
			to: "and1",
			port: 0
		},
		{
			from: "b",
			to: "and1",
			port: 1
		},
		{
			from: "a",
			to: "and2",
			port: 0
		},
		{
			from: "c",
			to: "and2",
			port: 1
		},
		{
			from: "b",
			to: "and3",
			port: 0
		},
		{
			from: "c",
			to: "and3",
			port: 1
		},
		{
			from: "and1",
			to: "or1",
			port: 0
		},
		{
			from: "and2",
			to: "or1",
			port: 1
		},
		{
			from: "and3",
			to: "or1",
			port: 2
		},
		{
			from: "or1",
			to: "f",
			port: 0
		}
	]),
	W("and-or-not-basic", "AND OR NOT Basic", [
		{
			id: "a",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "A"
		},
		{
			id: "b",
			kind: "SWITCH",
			x: 40,
			y: 170,
			label: "B"
		},
		{
			id: "and1",
			kind: "AND",
			x: 240,
			y: 40,
			inputs: 2,
			label: "AND"
		},
		{
			id: "or1",
			kind: "OR",
			x: 240,
			y: 170,
			inputs: 2,
			label: "OR"
		},
		{
			id: "not1",
			kind: "NOT",
			x: 240,
			y: 300,
			label: "NOT"
		},
		{
			id: "y_and",
			kind: "PROBE",
			x: 440,
			y: 40,
			label: "YAND"
		},
		{
			id: "y_or",
			kind: "PROBE",
			x: 440,
			y: 170,
			label: "YOR"
		},
		{
			id: "y_not",
			kind: "PROBE",
			x: 440,
			y: 300,
			label: "YNOT"
		}
	], [
		{
			from: "a",
			to: "and1",
			port: 0
		},
		{
			from: "b",
			to: "and1",
			port: 1
		},
		{
			from: "a",
			to: "or1",
			port: 0
		},
		{
			from: "b",
			to: "or1",
			port: 1
		},
		{
			from: "a",
			to: "not1",
			port: 0
		},
		{
			from: "and1",
			to: "y_and",
			port: 0
		},
		{
			from: "or1",
			to: "y_or",
			port: 0
		},
		{
			from: "not1",
			to: "y_not",
			port: 0
		}
	]),
	W("nand-only-implementation", "NAND Only Implementation", [
		{
			id: "a",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "A"
		},
		{
			id: "b",
			kind: "SWITCH",
			x: 40,
			y: 170,
			label: "B"
		},
		{
			id: "c",
			kind: "SWITCH",
			x: 40,
			y: 300,
			label: "C"
		},
		{
			id: "n1",
			kind: "NAND",
			x: 240,
			y: 40,
			inputs: 2,
			label: "N1"
		},
		{
			id: "n2",
			kind: "NAND",
			x: 240,
			y: 170,
			inputs: 2,
			label: "N2"
		},
		{
			id: "n3",
			kind: "NAND",
			x: 240,
			y: 300,
			inputs: 2,
			label: "N3"
		},
		{
			id: "n4",
			kind: "NAND",
			x: 440,
			y: 40,
			inputs: 2,
			label: "N4"
		},
		{
			id: "n5",
			kind: "NAND",
			x: 440,
			y: 170,
			inputs: 2,
			label: "N5"
		},
		{
			id: "n6",
			kind: "NAND",
			x: 440,
			y: 300,
			inputs: 2,
			label: "N6"
		},
		{
			id: "f",
			kind: "PROBE",
			x: 640,
			y: 40,
			label: "F"
		}
	], [
		{
			from: "a",
			to: "n1",
			port: 0
		},
		{
			from: "b",
			to: "n1",
			port: 1
		},
		{
			from: "a",
			to: "n2",
			port: 0
		},
		{
			from: "c",
			to: "n2",
			port: 1
		},
		{
			from: "b",
			to: "n3",
			port: 0
		},
		{
			from: "c",
			to: "n3",
			port: 1
		},
		{
			from: "n1",
			to: "n4",
			port: 0
		},
		{
			from: "n2",
			to: "n4",
			port: 1
		},
		{
			from: "n3",
			to: "n5",
			port: 0
		},
		{
			from: "n3",
			to: "n5",
			port: 1
		},
		{
			from: "n4",
			to: "n6",
			port: 0
		},
		{
			from: "n5",
			to: "n6",
			port: 1
		},
		{
			from: "n6",
			to: "f",
			port: 0
		}
	]),
	W("boolean-algebra-laws", "Boolean Algebra Laws", [
		{
			id: "a",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "A"
		},
		{
			id: "b",
			kind: "SWITCH",
			x: 40,
			y: 170,
			label: "B"
		},
		{
			id: "and1",
			kind: "AND",
			x: 240,
			y: 40,
			inputs: 2,
			label: "AND1"
		},
		{
			id: "or1",
			kind: "OR",
			x: 240,
			y: 170,
			inputs: 2,
			label: "OR1"
		},
		{
			id: "and2",
			kind: "AND",
			x: 240,
			y: 300,
			inputs: 2,
			label: "AND2"
		},
		{
			id: "or2",
			kind: "OR",
			x: 240,
			y: 430,
			inputs: 2,
			label: "OR2"
		},
		{
			id: "f1",
			kind: "PROBE",
			x: 440,
			y: 40,
			label: "F1"
		},
		{
			id: "f2",
			kind: "PROBE",
			x: 440,
			y: 170,
			label: "F2"
		},
		{
			id: "f3",
			kind: "PROBE",
			x: 440,
			y: 300,
			label: "F3"
		},
		{
			id: "f4",
			kind: "PROBE",
			x: 440,
			y: 430,
			label: "F4"
		}
	], [
		{
			from: "a",
			to: "and1",
			port: 0
		},
		{
			from: "b",
			to: "and1",
			port: 1
		},
		{
			from: "a",
			to: "or1",
			port: 0
		},
		{
			from: "b",
			to: "or1",
			port: 1
		},
		{
			from: "a",
			to: "and2",
			port: 0
		},
		{
			from: "a",
			to: "and2",
			port: 1
		},
		{
			from: "a",
			to: "or2",
			port: 0
		},
		{
			from: "a",
			to: "or2",
			port: 1
		},
		{
			from: "and1",
			to: "f1",
			port: 0
		},
		{
			from: "or1",
			to: "f2",
			port: 0
		},
		{
			from: "and2",
			to: "f3",
			port: 0
		},
		{
			from: "or2",
			to: "f4",
			port: 0
		}
	]),
	W("full-subtractor", "Full Subtractor", [
		{
			id: "a",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "A"
		},
		{
			id: "b",
			kind: "SWITCH",
			x: 40,
			y: 200,
			label: "B"
		},
		{
			id: "bin",
			kind: "SWITCH",
			x: 40,
			y: 360,
			label: "BIN"
		},
		{
			id: "xor1",
			kind: "XOR",
			x: 240,
			y: 40,
			inputs: 2
		},
		{
			id: "nota",
			kind: "NOT",
			x: 240,
			y: 180
		},
		{
			id: "xor2",
			kind: "XOR",
			x: 440,
			y: 40,
			inputs: 2
		},
		{
			id: "and1",
			kind: "AND",
			x: 440,
			y: 300,
			inputs: 2
		},
		{
			id: "and2",
			kind: "AND",
			x: 440,
			y: 440,
			inputs: 2
		},
		{
			id: "and3",
			kind: "AND",
			x: 440,
			y: 580,
			inputs: 2
		},
		{
			id: "or1",
			kind: "OR",
			x: 640,
			y: 420,
			inputs: 3
		},
		{
			id: "diff",
			kind: "PROBE",
			x: 640,
			y: 48,
			label: "DIFF"
		},
		{
			id: "bout",
			kind: "LED",
			x: 840,
			y: 420,
			label: "BOUT"
		}
	], [
		{
			from: "a",
			to: "xor1",
			port: 0
		},
		{
			from: "b",
			to: "xor1",
			port: 1
		},
		{
			from: "xor1",
			to: "xor2",
			port: 0
		},
		{
			from: "bin",
			to: "xor2",
			port: 1
		},
		{
			from: "xor2",
			to: "diff",
			port: 0
		},
		{
			from: "a",
			to: "nota",
			port: 0
		},
		{
			from: "nota",
			to: "and1",
			port: 0
		},
		{
			from: "b",
			to: "and1",
			port: 1
		},
		{
			from: "nota",
			to: "and2",
			port: 0
		},
		{
			from: "bin",
			to: "and2",
			port: 1
		},
		{
			from: "b",
			to: "and3",
			port: 0
		},
		{
			from: "bin",
			to: "and3",
			port: 1
		},
		{
			from: "and1",
			to: "or1",
			port: 0
		},
		{
			from: "and2",
			to: "or1",
			port: 1
		},
		{
			from: "and3",
			to: "or1",
			port: 2
		},
		{
			from: "or1",
			to: "bout",
			port: 0
		}
	]),
	W("adder-2-bit", "2-bit Ripple Adder", [
		{
			id: "a0",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "A0"
		},
		{
			id: "a1",
			kind: "SWITCH",
			x: 40,
			y: 200,
			label: "A1"
		},
		{
			id: "b0",
			kind: "SWITCH",
			x: 40,
			y: 360,
			label: "B0"
		},
		{
			id: "b1",
			kind: "SWITCH",
			x: 40,
			y: 520,
			label: "B1"
		},
		{
			id: "xs0",
			kind: "XOR",
			x: 240,
			y: 40,
			inputs: 2
		},
		{
			id: "c0",
			kind: "AND",
			x: 240,
			y: 200,
			inputs: 2
		},
		{
			id: "xt",
			kind: "XOR",
			x: 240,
			y: 360,
			inputs: 2
		},
		{
			id: "xs1",
			kind: "XOR",
			x: 440,
			y: 300,
			inputs: 2
		},
		{
			id: "and1",
			kind: "AND",
			x: 440,
			y: 460,
			inputs: 2
		},
		{
			id: "and2",
			kind: "AND",
			x: 440,
			y: 600,
			inputs: 2
		},
		{
			id: "and3",
			kind: "AND",
			x: 440,
			y: 740,
			inputs: 2
		},
		{
			id: "or1",
			kind: "OR",
			x: 640,
			y: 580,
			inputs: 3
		},
		{
			id: "s0",
			kind: "PROBE",
			x: 640,
			y: 48,
			label: "S0"
		},
		{
			id: "s1",
			kind: "PROBE",
			x: 640,
			y: 308,
			label: "S1"
		},
		{
			id: "c1",
			kind: "LED",
			x: 840,
			y: 580,
			label: "C1"
		}
	], [
		{
			from: "a0",
			to: "xs0",
			port: 0
		},
		{
			from: "b0",
			to: "xs0",
			port: 1
		},
		{
			from: "xs0",
			to: "s0",
			port: 0
		},
		{
			from: "a0",
			to: "c0",
			port: 0
		},
		{
			from: "b0",
			to: "c0",
			port: 1
		},
		{
			from: "a1",
			to: "xt",
			port: 0
		},
		{
			from: "b1",
			to: "xt",
			port: 1
		},
		{
			from: "xt",
			to: "xs1",
			port: 0
		},
		{
			from: "c0",
			to: "xs1",
			port: 1
		},
		{
			from: "xs1",
			to: "s1",
			port: 0
		},
		{
			from: "a1",
			to: "and1",
			port: 0
		},
		{
			from: "b1",
			to: "and1",
			port: 1
		},
		{
			from: "a1",
			to: "and2",
			port: 0
		},
		{
			from: "c0",
			to: "and2",
			port: 1
		},
		{
			from: "b1",
			to: "and3",
			port: 0
		},
		{
			from: "c0",
			to: "and3",
			port: 1
		},
		{
			from: "and1",
			to: "or1",
			port: 0
		},
		{
			from: "and2",
			to: "or1",
			port: 1
		},
		{
			from: "and3",
			to: "or1",
			port: 2
		},
		{
			from: "or1",
			to: "c1",
			port: 0
		}
	]),
	W("comparator-2-bit", "2-bit Magnitude Comparator", [
		{
			id: "a0",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "A0"
		},
		{
			id: "a1",
			kind: "SWITCH",
			x: 40,
			y: 200,
			label: "A1"
		},
		{
			id: "b0",
			kind: "SWITCH",
			x: 40,
			y: 360,
			label: "B0"
		},
		{
			id: "b1",
			kind: "SWITCH",
			x: 40,
			y: 520,
			label: "B1"
		},
		{
			id: "x1",
			kind: "XNOR",
			x: 240,
			y: 40,
			inputs: 2
		},
		{
			id: "x0",
			kind: "XNOR",
			x: 240,
			y: 180,
			inputs: 2
		},
		{
			id: "na1",
			kind: "NOT",
			x: 240,
			y: 320
		},
		{
			id: "nb1",
			kind: "NOT",
			x: 240,
			y: 440
		},
		{
			id: "na0",
			kind: "NOT",
			x: 240,
			y: 560
		},
		{
			id: "nb0",
			kind: "NOT",
			x: 240,
			y: 680
		},
		{
			id: "eqand",
			kind: "AND",
			x: 440,
			y: 40,
			inputs: 2
		},
		{
			id: "gt1",
			kind: "AND",
			x: 440,
			y: 180,
			inputs: 2
		},
		{
			id: "gt2",
			kind: "AND",
			x: 440,
			y: 320,
			inputs: 3
		},
		{
			id: "lt1",
			kind: "AND",
			x: 440,
			y: 500,
			inputs: 2
		},
		{
			id: "lt2",
			kind: "AND",
			x: 440,
			y: 640,
			inputs: 3
		},
		{
			id: "gtor",
			kind: "OR",
			x: 640,
			y: 220,
			inputs: 2
		},
		{
			id: "ltor",
			kind: "OR",
			x: 640,
			y: 540,
			inputs: 2
		},
		{
			id: "eq",
			kind: "PROBE",
			x: 840,
			y: 48,
			label: "EQ"
		},
		{
			id: "gt",
			kind: "PROBE",
			x: 840,
			y: 228,
			label: "GT"
		},
		{
			id: "lt",
			kind: "LED",
			x: 840,
			y: 540,
			label: "LT"
		}
	], [
		{
			from: "a1",
			to: "x1",
			port: 0
		},
		{
			from: "b1",
			to: "x1",
			port: 1
		},
		{
			from: "a0",
			to: "x0",
			port: 0
		},
		{
			from: "b0",
			to: "x0",
			port: 1
		},
		{
			from: "x1",
			to: "eqand",
			port: 0
		},
		{
			from: "x0",
			to: "eqand",
			port: 1
		},
		{
			from: "eqand",
			to: "eq",
			port: 0
		},
		{
			from: "a1",
			to: "na1",
			port: 0
		},
		{
			from: "b1",
			to: "nb1",
			port: 0
		},
		{
			from: "a0",
			to: "na0",
			port: 0
		},
		{
			from: "b0",
			to: "nb0",
			port: 0
		},
		{
			from: "a1",
			to: "gt1",
			port: 0
		},
		{
			from: "nb1",
			to: "gt1",
			port: 1
		},
		{
			from: "x1",
			to: "gt2",
			port: 0
		},
		{
			from: "a0",
			to: "gt2",
			port: 1
		},
		{
			from: "nb0",
			to: "gt2",
			port: 2
		},
		{
			from: "gt1",
			to: "gtor",
			port: 0
		},
		{
			from: "gt2",
			to: "gtor",
			port: 1
		},
		{
			from: "gtor",
			to: "gt",
			port: 0
		},
		{
			from: "na1",
			to: "lt1",
			port: 0
		},
		{
			from: "b1",
			to: "lt1",
			port: 1
		},
		{
			from: "x1",
			to: "lt2",
			port: 0
		},
		{
			from: "na0",
			to: "lt2",
			port: 1
		},
		{
			from: "b0",
			to: "lt2",
			port: 2
		},
		{
			from: "lt1",
			to: "ltor",
			port: 0
		},
		{
			from: "lt2",
			to: "ltor",
			port: 1
		},
		{
			from: "ltor",
			to: "lt",
			port: 0
		}
	]),
	W("encoder-4-to-2", "4-to-2 Priority Encoder", [
		{
			id: "i0",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "I0"
		},
		{
			id: "i1",
			kind: "SWITCH",
			x: 40,
			y: 200,
			label: "I1"
		},
		{
			id: "i2",
			kind: "SWITCH",
			x: 40,
			y: 360,
			label: "I2"
		},
		{
			id: "i3",
			kind: "SWITCH",
			x: 40,
			y: 520,
			label: "I3"
		},
		{
			id: "valid",
			kind: "OR",
			x: 240,
			y: 40,
			inputs: 4
		},
		{
			id: "ni2",
			kind: "NOT",
			x: 240,
			y: 200
		},
		{
			id: "ory1",
			kind: "OR",
			x: 240,
			y: 360,
			inputs: 2
		},
		{
			id: "anda",
			kind: "AND",
			x: 440,
			y: 240,
			inputs: 2
		},
		{
			id: "ory0",
			kind: "OR",
			x: 640,
			y: 440,
			inputs: 2
		},
		{
			id: "v",
			kind: "PROBE",
			x: 840,
			y: 48,
			label: "VALID"
		},
		{
			id: "y1",
			kind: "PROBE",
			x: 840,
			y: 368,
			label: "Y1"
		},
		{
			id: "y0",
			kind: "LED",
			x: 840,
			y: 440,
			label: "Y0"
		}
	], [
		{
			from: "i0",
			to: "valid",
			port: 0
		},
		{
			from: "i1",
			to: "valid",
			port: 1
		},
		{
			from: "i2",
			to: "valid",
			port: 2
		},
		{
			from: "i3",
			to: "valid",
			port: 3
		},
		{
			from: "valid",
			to: "v",
			port: 0
		},
		{
			from: "i2",
			to: "ni2",
			port: 0
		},
		{
			from: "i2",
			to: "ory1",
			port: 0
		},
		{
			from: "i3",
			to: "ory1",
			port: 1
		},
		{
			from: "ory1",
			to: "y1",
			port: 0
		},
		{
			from: "i1",
			to: "anda",
			port: 0
		},
		{
			from: "ni2",
			to: "anda",
			port: 1
		},
		{
			from: "i3",
			to: "ory0",
			port: 0
		},
		{
			from: "anda",
			to: "ory0",
			port: 1
		},
		{
			from: "ory0",
			to: "y0",
			port: 0
		}
	]),
	W("bcd-to-excess-3", "BCD to Excess-3", [
		{
			id: "b0",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "B0"
		},
		{
			id: "b1",
			kind: "SWITCH",
			x: 40,
			y: 200,
			label: "B1"
		},
		{
			id: "b2",
			kind: "SWITCH",
			x: 40,
			y: 360,
			label: "B2"
		},
		{
			id: "b3",
			kind: "SWITCH",
			x: 40,
			y: 520,
			label: "B3"
		},
		{
			id: "n0",
			kind: "NOT",
			x: 240,
			y: 40
		},
		{
			id: "x1",
			kind: "XOR",
			x: 240,
			y: 180,
			inputs: 2
		},
		{
			id: "a1",
			kind: "AND",
			x: 240,
			y: 320,
			inputs: 2
		},
		{
			id: "x2",
			kind: "XOR",
			x: 440,
			y: 260,
			inputs: 2
		},
		{
			id: "a2",
			kind: "AND",
			x: 440,
			y: 420,
			inputs: 2
		},
		{
			id: "x3",
			kind: "XOR",
			x: 640,
			y: 440,
			inputs: 2
		},
		{
			id: "e0",
			kind: "PROBE",
			x: 840,
			y: 48,
			label: "E0"
		},
		{
			id: "e1",
			kind: "PROBE",
			x: 840,
			y: 188,
			label: "E1"
		},
		{
			id: "e2",
			kind: "PROBE",
			x: 840,
			y: 268,
			label: "E2"
		},
		{
			id: "e3",
			kind: "LED",
			x: 840,
			y: 440,
			label: "E3"
		}
	], [
		{
			from: "b0",
			to: "n0",
			port: 0
		},
		{
			from: "n0",
			to: "e0",
			port: 0
		},
		{
			from: "b0",
			to: "x1",
			port: 0
		},
		{
			from: "b1",
			to: "x1",
			port: 1
		},
		{
			from: "x1",
			to: "e1",
			port: 0
		},
		{
			from: "b0",
			to: "a1",
			port: 0
		},
		{
			from: "b1",
			to: "a1",
			port: 1
		},
		{
			from: "a1",
			to: "x2",
			port: 0
		},
		{
			from: "b2",
			to: "x2",
			port: 1
		},
		{
			from: "x2",
			to: "e2",
			port: 0
		},
		{
			from: "a1",
			to: "a2",
			port: 0
		},
		{
			from: "b2",
			to: "a2",
			port: 1
		},
		{
			from: "a2",
			to: "x3",
			port: 0
		},
		{
			from: "b3",
			to: "x3",
			port: 1
		},
		{
			from: "x3",
			to: "e3",
			port: 0
		}
	]),
	W("nor-only-and", "AND Built From NOR Only", [
		{
			id: "a",
			kind: "SWITCH",
			x: 40,
			y: 40,
			label: "A"
		},
		{
			id: "b",
			kind: "SWITCH",
			x: 40,
			y: 200,
			label: "B"
		},
		{
			id: "na",
			kind: "NOR",
			x: 240,
			y: 40,
			inputs: 2
		},
		{
			id: "nb",
			kind: "NOR",
			x: 240,
			y: 200,
			inputs: 2
		},
		{
			id: "fand",
			kind: "NOR",
			x: 440,
			y: 120,
			inputs: 2
		},
		{
			id: "f",
			kind: "LED",
			x: 640,
			y: 120,
			label: "A AND B"
		}
	], [
		{
			from: "a",
			to: "na",
			port: 0
		},
		{
			from: "a",
			to: "na",
			port: 1
		},
		{
			from: "b",
			to: "nb",
			port: 0
		},
		{
			from: "b",
			to: "nb",
			port: 1
		},
		{
			from: "na",
			to: "fand",
			port: 0
		},
		{
			from: "nb",
			to: "fand",
			port: 1
		},
		{
			from: "fand",
			to: "f",
			port: 0
		}
	])
];
function Sn(e) {
	return xn.find((t) => t.id === e) ?? bn;
}
var Cn = {
	"free-build": "free",
	"and-or-not-basic": "ch2",
	"boolean-algebra-laws": "ch2",
	"de-morgan": "ch2",
	"universal-nand": "ch2",
	"binary-equivalence": "ch2",
	"nand-only-implementation": "ch3",
	"consensus-theorem": "ch3",
	"sop-vs-pos": "ch3",
	"kmap-minimization": "ch3",
	"odd-parity-detector": "ch3",
	"even-parity-detector": "ch3",
	"6-variable-parity": "ch3",
	"half-adder": "ch4",
	"full-adder": "ch4",
	"half-subtractor": "ch4",
	"2-to-1-multiplexer": "ch4",
	"mux-4-to-1": "ch4",
	"decoder-2-to-4": "ch4",
	"comparator-1-bit": "ch4",
	"full-subtractor": "ch4",
	"adder-2-bit": "ch4",
	"comparator-2-bit": "ch4",
	"encoder-4-to-2": "ch4",
	"bcd-to-excess-3": "ch4",
	"nor-only-and": "ch3",
	"majority-voter": "ch4"
};
function wn(e) {
	return Cn[e] ?? "ch4";
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/editor/viewport-controller.ts
function G(e) {
	return Math.min(n.maximumZoom, Math.max(n.minimumZoom, e));
}
function Tn(e, t) {
	return {
		...e,
		x: e.x + t.x,
		y: e.y + t.y
	};
}
function En(e, t) {
	return {
		x: e.x / t.zoom + t.x,
		y: e.y / t.zoom + t.y
	};
}
function Dn(e, t, n) {
	let r = G(n), i = En(t, e);
	return {
		x: i.x - t.x / r,
		y: i.y - t.y / r,
		zoom: r
	};
}
function On(e, t, r = 240) {
	let i = t.width / e.zoom, a = t.height / e.zoom, o = -r, s = -r, c = Math.max(o, n.width + r - i), l = Math.max(s, n.height + r - a);
	return {
		zoom: e.zoom,
		x: Math.min(Math.max(e.x, o), c),
		y: Math.min(Math.max(e.y, s), l)
	};
}
function kn(e) {
	return Math.exp(-e * .0015);
}
var K = (e) => `${e.column}:${e.row}`, An = (e, t) => Math.abs(e.column - t.column) + Math.abs(e.row - t.row), q = (e) => Math.round(e / 20) * 20, jn = (e) => ({
	column: Math.round(e.x / 20),
	row: Math.round(e.y / 20)
}), Mn = (e) => ({
	x: e.column * 20,
	y: e.row * 20
});
function Nn(e, t) {
	return e.f - t.f || e.h - t.h || e.point.row - t.point.row || e.point.column - t.point.column;
}
function Pn(e, t) {
	e.push(t);
	let n = e.length - 1;
	for (; n > 0;) {
		let t = Math.floor((n - 1) / 2);
		if (Nn(e[t], e[n]) <= 0) break;
		[e[t], e[n]] = [e[n], e[t]], n = t;
	}
}
function Fn(e) {
	let t = e[0], n = e.pop();
	if (!t || !n || e.length === 0) return t;
	e[0] = n;
	let r = 0;
	for (;;) {
		let t = r * 2 + 1, n = t + 1;
		if (t >= e.length) break;
		let i = n < e.length && Nn(e[n], e[t]) < 0 ? n : t;
		if (Nn(e[r], e[i]) <= 0) break;
		[e[r], e[i]] = [e[i], e[r]], r = i;
	}
	return t;
}
function In(e, t) {
	return e.x >= t.x - 20 && e.x <= t.x + t.width + 20 && e.y >= t.y - 20 && e.y <= t.y + t.height + 20;
}
function Ln(e, t) {
	let n = Mn(e);
	return t.some((e) => In(n, e));
}
function Rn(e, t, n) {
	return n.every((n) => {
		let r = n.x - 20, i = n.x + n.width + 20, a = n.y - 20, o = n.y + n.height + 20;
		if (e.y === t.y) {
			let n = Math.min(e.x, t.x), s = Math.max(e.x, t.x);
			return e.y < a || e.y > o || s < r || n > i;
		}
		let s = Math.min(e.y, t.y), c = Math.max(e.y, t.y);
		return e.x < r || e.x > i || c < a || s > o;
	});
}
function zn(e, t, n) {
	let r = q((e.x + t.x) / 2), i = q((e.y + t.y) / 2);
	return [
		[
			e,
			{
				x: t.x,
				y: e.y
			},
			t
		],
		[
			e,
			{
				x: e.x,
				y: t.y
			},
			t
		],
		[
			e,
			{
				x: r,
				y: e.y
			},
			{
				x: r,
				y: t.y
			},
			t
		],
		[
			e,
			{
				x: e.x,
				y: i
			},
			{
				x: t.x,
				y: i
			},
			t
		]
	].find((e) => e.every((t, r) => r === 0 || Rn(e[r - 1], t, n))) ?? null;
}
function Bn(e, t) {
	let n = [t], r = t;
	for (; e.has(K(r));) r = e.get(K(r)), n.push(r);
	return n.reverse().map(Mn);
}
function Vn(e, t, n) {
	let r = jn(e), i = jn(t), a = Math.floor(n.bounds.width / 20), o = Math.floor(n.bounds.height / 20), s = [];
	Pn(s, {
		point: r,
		f: An(r, i),
		h: An(r, i)
	});
	let c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map([[K(r), 0]]), d = /* @__PURE__ */ new Map([[K(r), An(r, i)]]), f = 0;
	for (; s.length > 0;) {
		let e = Fn(s).point;
		if (c.has(K(e))) continue;
		if (c.add(K(e)), f += 1, e.column === i.column && e.row === i.row) return {
			points: Bn(l, e),
			visitedCells: f,
			found: !0
		};
		let t = [
			{
				column: e.column + 1,
				row: e.row
			},
			{
				column: e.column,
				row: e.row + 1
			},
			{
				column: e.column,
				row: e.row - 1
			},
			{
				column: e.column - 1,
				row: e.row
			}
		];
		for (let r of t) {
			if (r.column < 0 || r.row < 0 || r.column > a || r.row > o || K(r) !== K(i) && Ln(r, n.obstacles)) continue;
			let t = (u.get(K(e)) ?? Infinity) + 1;
			if (t >= (u.get(K(r)) ?? Infinity)) continue;
			l.set(K(r), e), u.set(K(r), t);
			let c = An(r, i), f = t + c;
			d.set(K(r), f), Pn(s, {
				point: r,
				f,
				h: c
			});
		}
	}
	return {
		points: [e, t],
		visitedCells: f,
		found: !1
	};
}
function Hn(e, t = []) {
	let n = new Set(t.map((e) => `${e.x}:${e.y}`)), r = e.filter((t, n) => n === 0 || t.x !== e[n - 1].x || t.y !== e[n - 1].y);
	return r.length <= 2 ? r : r.filter((e, t) => {
		if (t === 0 || t === r.length - 1 || n.has(`${e.x}:${e.y}`)) return !0;
		let i = r[t - 1], a = r[t + 1];
		return !(i.x === e.x && e.x === a.x || i.y === e.y && e.y === a.y);
	});
}
function Un(e, t) {
	let n = [], r = 0, i = !0;
	for (let a = 1; a < e.length; a += 1) {
		let o = Vn(e[a - 1], e[a], t);
		r += o.visitedCells, i &&= o.found;
		let s = Hn(o.points);
		n.push(...a === 1 ? s : s.slice(1));
	}
	return {
		points: n,
		visitedCells: r,
		found: i
	};
}
function Wn(e) {
	let t = {
		x: e.source.x + 20,
		y: e.source.y
	}, n = {
		x: q(t.x),
		y: t.y
	}, r = {
		x: n.x,
		y: q(t.y)
	}, i = {
		x: e.target.x - 20,
		y: e.target.y
	}, a = {
		x: q(i.x),
		y: i.y
	}, o = {
		x: a.x,
		y: q(i.y)
	}, s = (e.pinnedWaypoints ?? []).map((e) => ({
		x: q(e.x),
		y: q(e.y)
	})), c = s.length === 0 ? zn(r, o, e.obstacles) : null, l = c ? {
		points: c,
		visitedCells: 0,
		found: !0
	} : Un([
		r,
		...s,
		o
	], e);
	return {
		points: Hn([
			e.source,
			t,
			n,
			r,
			...l.points.slice(1, -1),
			o,
			a,
			i,
			e.target
		], s),
		visitedCells: l.visitedCells,
		found: l.found
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/editor/route-geometry.ts
function Gn(e, t) {
	let n = e.nodes.find((e) => e.id === t.source.nodeId), r = e.nodes.find((e) => e.id === t.target.nodeId);
	if (!n || !r) return {
		points: [],
		visitedCells: 0,
		found: !1
	};
	let i = Ye(n).output.center, a = Ye(r).inputs.find((e) => e.id === t.target.portId)?.center;
	if (!a) return {
		points: [],
		visitedCells: 0,
		found: !1
	};
	let o = /* @__PURE__ */ new Set([n.id, r.id]);
	return Wn({
		source: i,
		target: a,
		obstacles: e.nodes.filter((e) => !o.has(e.id)).map(Xe),
		pinnedWaypoints: t.route.mode === "orthogonal-pinned" ? t.route.waypoints : [],
		bounds: {
			width: e.width,
			height: e.height
		}
	});
}
function Kn(e) {
	return e.length === 0 ? "" : e.map((e, t) => `${t === 0 ? "M" : "L"} ${e.x} ${e.y}`).join(" ");
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/app/render.ts
var qn = "http://www.w3.org/2000/svg";
function J(e, t = {}) {
	let n = document.createElementNS(qn, e);
	for (let [e, r] of Object.entries(t)) n.setAttribute(e, String(r));
	return n;
}
function Jn(e) {
	return e === 1 ? "is-high" : e === 0 ? "is-low" : "is-unknown";
}
function Yn(e) {
	return e === void 0 ? "X" : String(e);
}
function Xn(e, t, n) {
	let r = n === 1;
	if (t.component === "LED") {
		r && e.prepend(J("circle", {
			class: "cx-lamp-glow",
			cx: 78,
			cy: 40,
			r: 40
		})), e.prepend(J("path", {
			class: "cx-lamp",
			d: "M 52 40 A 26 26 0 1 1 104 40 A 26 26 0 1 1 52 40 Z"
		}));
		let t = J("text", {
			class: "cx-lamp-text",
			x: 78,
			y: 40
		});
		t.textContent = Yn(n), e.appendChild(t);
		return;
	}
	if (t.component === "SWITCH") {
		e.appendChild(J("rect", {
			class: "cx-track",
			x: 20,
			y: 21,
			width: 54,
			height: 22,
			rx: 11
		})), e.appendChild(J("circle", {
			class: "cx-knob",
			cx: r ? 63 : 31,
			cy: 32,
			r: 9
		}));
		return;
	}
	t.component === "BUTTON" && e.appendChild(J("circle", {
		class: "cx-cap",
		cx: 47,
		cy: 32,
		r: 15
	}));
}
function Zn(e, t, n) {
	let r = J("g", {
		class: `cx-port-group ${n}`.trim(),
		"data-port-id": e
	});
	return r.appendChild(J("circle", {
		class: "cx-port-hit",
		cx: t.x,
		cy: t.y,
		r: 15
	})), r.appendChild(J("circle", {
		class: "cx-port",
		cx: t.x,
		cy: t.y,
		r: 4
	})), r;
}
function Qn(e, t) {
	let n = C(e.component, e.inputCount), r = J("g", { class: "cx-symbol" });
	n.facePath && r.appendChild(J("path", {
		class: "cx-face",
		d: n.facePath
	}));
	for (let e of n.leadPaths) r.appendChild(J("path", {
		class: "cx-lead",
		d: e
	}));
	for (let e of n.bodyPaths) r.appendChild(J("path", {
		class: "cx-body",
		d: e
	}));
	let i = e.component === "LED" ? "cx-detail cx-lamp-detail" : "cx-detail";
	for (let e of n.detailPaths) r.appendChild(J("path", {
		class: i,
		d: e
	}));
	if (n.inversionBubble) {
		let { center: e, radius: t } = n.inversionBubble;
		r.appendChild(J("circle", {
			class: "cx-bubble",
			cx: e.x,
			cy: e.y,
			r: t
		}));
	}
	if (e.component === "CONSTANT_0" || e.component === "CONSTANT_1") {
		let t = e.component === "CONSTANT_1" ? "1" : "0", i = J("text", {
			class: "cx-const",
			x: n.width / 2,
			y: n.height / 2
		});
		i.textContent = t, r.appendChild(i);
	}
	if (n.blockTitle) {
		let e = J("text", {
			class: "cx-block-title",
			x: n.width / 2,
			y: n.outputPort.y
		});
		e.textContent = n.blockTitle, r.appendChild(e);
	}
	for (let [e, t] of (n.pinNames ?? []).entries()) {
		let i = n.inputPorts[e];
		if (!i) continue;
		let a = i.x <= 5, o = J("text", {
			class: `cx-pin ${a ? "cx-pin--start" : "cx-pin--below"}`,
			x: a ? 26 : i.x,
			y: a ? i.y : n.outputPort.y * 2 - 14
		});
		o.textContent = t, r.appendChild(o);
	}
	if (Xn(r, e, t.value), t.showPorts) {
		for (let [e, t] of n.inputPorts.entries()) r.appendChild(Zn(`in-${e}`, t, ""));
		e.role !== "output" && r.appendChild(Zn("out", n.outputPort, "cx-port-out"));
	}
	if (t.label) {
		let e = Ke(n, t.labelPlacement ?? "bottom"), i = J("text", {
			class: "cx-label",
			x: e.x,
			y: e.y
		});
		i.textContent = t.label, r.appendChild(i);
	}
	return r;
}
function $n(e, t) {
	let n = C(e, t), r = J("svg", {
		class: "cx-icon",
		viewBox: `0 0 ${n.width} ${n.height}`,
		"aria-hidden": "true",
		focusable: "false"
	}), i = {
		id: "icon",
		role: u(e),
		component: e,
		label: "",
		labelPlacement: "bottom",
		position: {
			x: 0,
			y: 0
		},
		inputCount: t
	};
	return r.appendChild(Qn(i, { showPorts: !1 })), r;
}
function er(e, t) {
	return J("rect", {
		class: "cx-node-hit",
		x: -6,
		y: -6,
		width: e + 12,
		height: t + 12
	});
}
function tr(e, t) {
	let n = C(e.component, e.inputCount), r = J("g", {
		class: [
			"cx-node",
			`cx-role-${e.role}`,
			n.facePath ? "has-face" : "",
			Jn(t.value),
			t.selected ? "is-selected" : "",
			t.interactive ? "is-interactive" : ""
		].filter(Boolean).join(" "),
		transform: `translate(${e.position.x} ${e.position.y})`,
		"data-node-id": e.id
	});
	if (r.appendChild(er(n.width, n.height)), r.appendChild(Qn(e, {
		showPorts: !0,
		label: e.label,
		labelPlacement: e.labelPlacement,
		value: t.value
	})), (e.role === "input" || e.role === "output") && e.component !== "LED" && e.component !== "CONSTANT_0" && e.component !== "CONSTANT_1") {
		let i = J("text", {
			class: "cx-value-text",
			x: e.role === "input" ? 94 : n.width / 2,
			y: n.height / 2
		});
		i.textContent = Yn(t.value), r.appendChild(i);
	}
	return t.interactive && (r.setAttribute("tabindex", "0"), r.setAttribute("role", "button")), r;
}
function nr(e, t, n, r) {
	let i = Kn(Gn(e, t).points), a = J("g", {
		class: [
			"cx-wire",
			Jn(n),
			r ? "is-selected" : ""
		].filter(Boolean).join(" "),
		"data-wire-id": t.id
	});
	return a.appendChild(J("path", {
		class: "cx-wire-hit",
		d: i
	})), a.appendChild(J("path", {
		class: "cx-wire-line",
		d: i
	})), a;
}
function rr(e) {
	let t = J("g", { class: "cx-junctions" }), n = /* @__PURE__ */ new Map();
	for (let t of e.wires) {
		let r = e.nodes.find((e) => e.id === t.source.nodeId);
		if (!r) continue;
		let { center: i } = Ye(r).output, a = `${i.x}:${i.y}`, o = n.get(a) ?? {
			x: i.x,
			y: i.y,
			count: 0
		};
		o.count += 1, n.set(a, o);
	}
	for (let e of n.values()) e.count < 2 || t.appendChild(J("circle", {
		class: "cx-junction",
		cx: e.x,
		cy: e.y,
		r: 4
	}));
	return t;
}
var ir = class {
	constructor(e) {
		this.edgeTimeout = null, this.viewport = {
			x: 0,
			y: 0,
			zoom: 1
		}, this.gesture = null, this.moved = !1, this.pinchDistance = 0, this.selection = {
			nodeIds: [],
			wireIds: []
		}, this.nodes = [], this.armed = null, this.callbacks = e, this.element = document.createElement("div"), this.element.className = "cx-canvas", this.surface = J("svg", {
			class: "cx-surface",
			role: "application"
		}), this.surface.setAttribute("aria-label", "Circuit workspace");
		let t = J("defs"), n = J("pattern", {
			id: "cx-grid",
			width: 200,
			height: 200,
			patternUnits: "userSpaceOnUse"
		}), r = Array.from({ length: 4 }, (e, t) => {
			let n = (t + 1) * 40;
			return `M ${n} 0 V 200 M 0 ${n} H 200`;
		}).join(" ");
		n.appendChild(J("path", {
			class: "cx-grid-line",
			d: r
		})), n.appendChild(J("path", {
			class: "cx-grid-line cx-grid-line--major",
			d: "M 0 0 V 200 M 0 0 H 200"
		})), t.appendChild(n), this.surface.appendChild(t), this.gridPattern = n, this.surface.appendChild(J("rect", {
			class: "cx-grid-bg",
			x: 0,
			y: 0,
			width: "100%",
			height: "100%",
			fill: "url(#cx-grid)"
		})), this.scene = J("g", { class: "cx-scene" }), this.overlay = J("g", { class: "cx-overlay" }), this.surface.appendChild(this.scene), this.element.appendChild(this.surface), this.bindPointer(), this.bindWheel();
	}
	render(e, t, r) {
		this.viewport = e.session.viewport, this.selection = r, this.nodes = e.circuit.nodes;
		let i = new Set(r.nodeIds), a = new Set(r.wireIds);
		this.scene.replaceChildren(), this.scene.appendChild(J("rect", {
			class: "cx-grid-edge",
			x: 0,
			y: 0,
			width: n.width,
			height: n.height
		}));
		let o = J("g", { class: "cx-wires" });
		for (let n of e.circuit.wires) o.appendChild(nr(e.circuit, n, t[n.source.nodeId], a.has(n.id)));
		this.scene.appendChild(o), this.scene.appendChild(rr(e.circuit));
		let s = J("g", { class: "cx-nodes" });
		for (let n of e.circuit.nodes) {
			let e = n.component === "SWITCH" || n.component === "BUTTON";
			s.appendChild(tr(n, {
				value: t[n.id],
				selected: i.has(n.id),
				interactive: e
			}));
		}
		this.scene.appendChild(s), this.scene.appendChild(this.overlay), this.applyViewport();
	}
	setArmedComponent(e) {
		this.armed = e, this.element.classList.toggle("is-placing", e !== null), e || this.clearOverlay();
	}
	cancelGesture() {
		this.gesture = null, this.moved = !1, this.clearOverlay(), this.restoreDraggedNodes(), this.element.classList.remove("is-panning");
	}
	clearOverlay() {
		this.overlay.replaceChildren();
	}
	capturePointer(e) {
		try {
			this.element.setPointerCapture(e);
		} catch {}
	}
	applyViewport() {
		let { x: e, y: t, zoom: n } = this.viewport;
		this.scene.setAttribute("transform", `translate(${-e * n} ${-t * n}) scale(${n})`), this.gridPattern.setAttribute("patternTransform", `translate(${-e * n} ${-t * n}) scale(${n})`);
	}
	commitViewport(e) {
		let t = this.element.getBoundingClientRect();
		this.viewport = t.width > 0 ? On(e, t) : e, this.applyViewport(), this.callbacks.onViewportChange(this.viewport);
	}
	revealEdge() {
		this.element.classList.add("is-at-edge"), this.edgeTimeout && clearTimeout(this.edgeTimeout), this.edgeTimeout = setTimeout(() => {
			this.edgeTimeout = null, this.element.classList.remove("is-at-edge");
		}, 900);
	}
	zoomBy(e) {
		let t = this.element.getBoundingClientRect(), n = {
			x: t.width / 2,
			y: t.height / 2
		};
		this.commitViewport(Dn(this.viewport, n, G(this.viewport.zoom * e)));
	}
	fitTo(e) {
		let t = this.element.getBoundingClientRect();
		if (t.width === 0 || t.height === 0) return;
		let n = e.circuit.nodes;
		if (n.length === 0) {
			this.commitViewport({
				x: 0,
				y: 0,
				zoom: 1
			});
			return;
		}
		let r = Infinity, i = Infinity, a = -Infinity, o = -Infinity;
		for (let e of n) {
			let t = Xe(e);
			r = Math.min(r, t.x), i = Math.min(i, t.y), a = Math.max(a, t.x + t.width), o = Math.max(o, t.y + t.height);
		}
		let s = a - r + 80, c = o - i + 80, l = G(Math.min(t.width / s, t.height / c)), u = r - 40 - (t.width / l - s) / 2, d = i - 40 - (t.height / l - c) / 2;
		this.commitViewport({
			x: u,
			y: d,
			zoom: l
		});
	}
	viewportCenter() {
		let e = this.element.getBoundingClientRect();
		return this.clientToWorld({
			x: e.width / 2,
			y: e.height / 2
		});
	}
	clientToLocal(e) {
		let t = this.element.getBoundingClientRect();
		return {
			x: e.clientX - t.left,
			y: e.clientY - t.top
		};
	}
	clientToWorld(e) {
		return {
			x: e.x / this.viewport.zoom + this.viewport.x,
			y: e.y / this.viewport.zoom + this.viewport.y
		};
	}
	eventWorld(e) {
		return this.clientToWorld(this.clientToLocal(e));
	}
	bindWheel() {
		this.element.addEventListener("wheel", (e) => {
			e.preventDefault();
			let t = this.clientToLocal(e), n = kn(e.deltaY);
			this.commitViewport(Dn(this.viewport, t, G(this.viewport.zoom * n)));
		}, { passive: !1 });
	}
	bindPointer() {
		let e = /* @__PURE__ */ new Map();
		this.element.addEventListener("pointerdown", (t) => {
			let n = t.target, r = n.closest("[data-port-id]"), i = n.closest("[data-node-id]"), a = n.closest("[data-wire-id]"), o = t.shiftKey || t.ctrlKey || t.metaKey;
			if (this.armed) {
				this.callbacks.onPlace(ar(this.eventWorld(t)));
				return;
			}
			if (r && i) {
				this.capturePointer(t.pointerId);
				let e = i.getAttribute("data-node-id"), n = r.getAttribute("data-port-id"), a = this.nodes.find((t) => t.id === e);
				if (!a) return;
				let o = Ye(a), s = n === "out" ? o.output.center : o.inputs[Number(n.slice(3))]?.center ?? o.output.center;
				this.gesture = {
					kind: "wire",
					pointerId: t.pointerId,
					from: {
						nodeId: e,
						portId: n
					},
					fromPoint: s
				}, this.moved = !1, this.drawWirePreview(s, s);
				return;
			}
			if (i) {
				let e = i.getAttribute("data-node-id"), n = this.selection.nodeIds.includes(e), r = n && !o ? [...this.selection.nodeIds] : [e], a = /* @__PURE__ */ new Map();
				for (let e of r) {
					let t = this.nodes.find((t) => t.id === e);
					t && a.set(e, t.position);
				}
				(!n || o) && this.callbacks.onSelect({
					kind: "node",
					nodeId: e,
					additive: o
				}), this.capturePointer(t.pointerId), this.gesture = {
					kind: "drag",
					pointerId: t.pointerId,
					nodeId: e,
					startWorld: this.eventWorld(t),
					origins: a
				}, this.moved = !1;
				return;
			}
			if (a) {
				this.callbacks.onSelect({
					kind: "wire",
					wireId: a.getAttribute("data-wire-id"),
					additive: o
				});
				return;
			}
			if (e.set(t.pointerId, {
				x: t.clientX,
				y: t.clientY
			}), e.size === 2) {
				this.gesture = null, this.pinchDistance = cr(e);
				return;
			}
			if (this.element.setPointerCapture(t.pointerId), this.moved = !1, t.shiftKey) {
				this.gesture = {
					kind: "marquee",
					pointerId: t.pointerId,
					startWorld: this.eventWorld(t)
				};
				return;
			}
			this.gesture = {
				kind: "pan",
				pointerId: t.pointerId,
				startClient: {
					x: t.clientX,
					y: t.clientY
				},
				startViewport: this.viewport
			}, this.element.classList.add("is-panning");
		}), this.element.addEventListener("pointermove", (t) => {
			if (e.has(t.pointerId) && e.set(t.pointerId, {
				x: t.clientX,
				y: t.clientY
			}), e.size === 2 && this.pinchDistance > 0) {
				let n = cr(e), r = this.clientToLocal(t), i = n / this.pinchDistance;
				this.pinchDistance = n, this.commitViewport(Dn(this.viewport, r, G(this.viewport.zoom * i)));
				return;
			}
			if (this.armed) {
				this.drawGhost(ar(this.eventWorld(t)));
				return;
			}
			let n = this.gesture;
			if (!(!n || n.pointerId !== t.pointerId)) {
				if (n.kind === "pan") {
					let e = n.startViewport.zoom, r = {
						x: -(t.clientX - n.startClient.x) / e,
						y: -(t.clientY - n.startClient.y) / e
					};
					(Math.abs(r.x) > 1 || Math.abs(r.y) > 1) && (this.moved = !0);
					let i = Tn(n.startViewport, r), a = this.element.getBoundingClientRect(), o = a.width > 0 ? On(i, a) : i;
					(o.x !== i.x || o.y !== i.y) && this.revealEdge(), this.viewport = o, this.applyViewport();
					return;
				}
				if (n.kind === "drag") {
					let e = this.eventWorld(t), r = {
						x: e.x - n.startWorld.x,
						y: e.y - n.startWorld.y
					};
					(Math.abs(r.x) > 2 || Math.abs(r.y) > 2) && (this.moved = !0);
					for (let [e, t] of n.origins) {
						let n = this.scene.querySelector(`[data-node-id="${sr(e)}"]`);
						if (!n) continue;
						let i = {
							x: t.x + r.x,
							y: t.y + r.y
						}, a = or(this.nodes.find((t) => t.id === e), i);
						(a.x !== i.x || a.y !== i.y) && this.revealEdge(), n.setAttribute("transform", `translate(${a.x} ${a.y})`);
					}
					return;
				}
				if (n.kind === "wire") {
					this.moved = !0, this.drawWirePreview(n.fromPoint, this.eventWorld(t));
					return;
				}
				this.moved = !0, this.drawMarquee(Ze(n.startWorld, this.eventWorld(t)));
			}
		}), this.element.addEventListener("pointerup", (t) => {
			e.delete(t.pointerId), e.size < 2 && (this.pinchDistance = 0);
			let n = this.gesture;
			if (!(!n || n.pointerId !== t.pointerId)) {
				if (this.gesture = null, this.element.classList.remove("is-panning"), n.kind === "pan") {
					this.moved || this.callbacks.onSelect({ kind: "clear" }), this.callbacks.onViewportChange(this.viewport);
					return;
				}
				if (n.kind === "drag") {
					if (!this.moved) {
						this.scene.querySelector(`[data-node-id="${sr(n.nodeId)}"]`)?.classList.contains("is-interactive") && this.callbacks.onToggleInput(n.nodeId);
						return;
					}
					let e = this.eventWorld(t), r = {
						x: e.x - n.startWorld.x,
						y: e.y - n.startWorld.y
					}, i = {};
					for (let [e, t] of n.origins) i[e] = or(this.nodes.find((t) => t.id === e), ar({
						x: t.x + r.x,
						y: t.y + r.y
					}));
					this.callbacks.onMoveNodes(i);
					return;
				}
				if (n.kind === "wire") {
					this.clearOverlay();
					let e = this.endpointAt(t.clientX, t.clientY);
					if (!e) {
						this.callbacks.onRejectConnection();
						return;
					}
					let r = n.from;
					r.portId === "out" && e.portId !== "out" ? this.callbacks.onConnect(r, e) : r.portId !== "out" && e.portId === "out" ? this.callbacks.onConnect(e, r) : this.callbacks.onRejectConnection();
					return;
				}
				this.clearOverlay(), this.callbacks.onSelect({
					kind: "rectangle",
					rectangle: Ze(n.startWorld, this.eventWorld(t)),
					additive: t.shiftKey || t.ctrlKey || t.metaKey
				});
			}
		}), this.element.addEventListener("pointercancel", () => this.cancelGesture());
	}
	endpointAt(e, t) {
		let n = document.elementFromPoint(e, t), r = n?.closest("[data-port-id]"), i = n?.closest("[data-node-id]");
		return !r || !i ? null : {
			nodeId: i.getAttribute("data-node-id"),
			portId: r.getAttribute("data-port-id")
		};
	}
	restoreDraggedNodes() {
		for (let e of this.nodes) this.scene.querySelector(`[data-node-id="${sr(e.id)}"]`)?.setAttribute("transform", `translate(${e.position.x} ${e.position.y})`);
	}
	drawWirePreview(e, t) {
		let n = (e.x + t.x) / 2, r = `M ${e.x} ${e.y} H ${n} V ${t.y} H ${t.x}`;
		this.overlay.replaceChildren(J("path", {
			class: "cx-wire-preview",
			d: r
		}), J("circle", {
			class: "cx-wire-preview-dot",
			cx: t.x,
			cy: t.y,
			r: 5
		}));
	}
	drawMarquee(e) {
		this.overlay.replaceChildren(J("rect", {
			class: "cx-marquee",
			x: e.x,
			y: e.y,
			width: e.width,
			height: e.height
		}));
	}
	drawGhost(e) {
		if (!this.armed) return;
		let t = vn(this.armed), n = J("g", {
			class: "cx-ghost",
			transform: `translate(${e.x} ${e.y})`
		});
		n.appendChild(Qn({
			id: "ghost",
			role: "gate",
			component: this.armed,
			label: "",
			labelPlacement: "bottom",
			position: e,
			inputCount: t
		}, { showPorts: !1 })), this.overlay.replaceChildren(n);
	}
};
function ar(e) {
	return {
		x: Math.round(e.x / 40) * 40,
		y: Math.round(e.y / 40) * 40
	};
}
function or(e, t) {
	let r = C(e.component, e.inputCount);
	return {
		x: Math.min(Math.max(0, t.x), n.width - r.width),
		y: Math.min(Math.max(0, t.y), n.height - r.height)
	};
}
function sr(e) {
	return e.replace(/["\\]/g, "\\$&");
}
function cr(e) {
	let [t, n] = [...e.values()];
	return !t || !n ? 0 : Math.hypot(t.x - n.x, t.y - n.y);
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/evidence/signal-view.ts
function lr(e, t) {
	return e.circuit.nodes.map((e) => ({
		nodeId: e.id,
		label: e.label || e.id,
		role: e.role,
		value: t.values[e.id] ?? "X",
		expression: t.expressions[e.id] ?? "?",
		direction: "ltr"
	}));
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/evidence/truth-table-view.ts
function ur(e) {
	return {
		columns: [...e.inputNodeIds.map((e) => ({
			id: e,
			kind: "input",
			direction: "ltr"
		})), ...e.outputNodeIds.map((e) => ({
			id: e,
			kind: "output",
			direction: "ltr"
		}))],
		rowCount: e.rows.length,
		table: e
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/evidence/karnaugh-view.ts
function dr(e) {
	return {
		map: e,
		direction: "ltr",
		scrollable: !0,
		canExpand: !0,
		...e.available ? {} : { messageKey: "kmap.algorithmic-only" }
	};
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/app/ai-explain.ts
var fr = "https://gardin-main.xxli50xx.workers.dev", pr = "/api/ai", mr = /* @__PURE__ */ new Set([
	"localhost",
	"127.0.0.1",
	"[::1]",
	""
]);
function hr() {
	return mr.has(location.hostname) ? pr : fr;
}
var gr = (e, t) => `garden_labs_ai_${e}_${t}`, _r = (e, t) => `garden_labs_ai_uses_${e}_${t}`;
function vr() {
	try {
		return localStorage.setItem("garden_labs_probe", "1"), localStorage.removeItem("garden_labs_probe"), localStorage;
	} catch {
		return null;
	}
}
function yr(e, t) {
	return vr()?.getItem(gr(e, t)) ?? null;
}
function br(e, t, n) {
	try {
		vr()?.setItem(gr(e, t), n);
	} catch {}
}
function xr(e, t) {
	let n = vr()?.getItem(_r(e, t)), r = Number(n);
	return Number.isFinite(r) && r > 0 ? Math.min(r, 2) : 0;
}
function Sr(e, t) {
	try {
		vr()?.setItem(_r(e, t), String(xr(e, t) + 1));
	} catch {}
}
function Cr(e, t) {
	let n = [
		`Example: ${e.presetName}`,
		`Textbook chapter: ${e.chapter}`,
		`Inputs: ${e.variableNames.join(", ") || "—"}`,
		`Outputs: ${e.outputNames.join(", ") || "—"}`,
		`Gates used: ${e.gateSummary}`,
		`Simplified expressions: ${e.expressions.join("  |  ") || "—"}`,
		"Truth table:",
		...e.truthRows
	].join("\n");
	return [{
		role: "system",
		content: t === "ar" ? [
			"أنت شارحٌ في «الحديقة الرقمية»، منصّةٍ تعليمية لطلاب حاسب في الجامعة السعودية الإلكترونية.",
			"المقرَّر CS231 (المنطق الرقمي)، والكتابُ المعتمد Mano & Ciletti — Digital Design.",
			"تشرح **دائرةً بعينها** أُعطيت لك ببياناتها الكاملة. لا تخترع بوابةً ولا صفّاً غيرَ ما أُعطيت.",
			"اكتب بالعربية الفصحى، و**أسماءُ البوابات والمتغيّرات تبقى إنجليزيةً كما هي** (AND · XOR · Cin).",
			"الشكل، بهذا الترتيب وبعناوين قصيرة:",
			"## الفكرة — سطران يقولان ما تفعله هذه الدائرة.",
			"## كيف تعمل — تتبّعُ الإشارة من المدخل إلى المخرج عبر بواباتها هي.",
			"## من الواقع — مثالٌ ملموسٌ واحدٌ يستعمل هذه الدائرة فعلاً.",
			"## في الكتاب — أين يقع هذا في المقرَّر وبأي اسمٍ يُذكر.",
			"## تحقّق — سؤالٌ واحدٌ قصيرٌ يجيب عنه الطالب بتشغيل المفاتيح.",
			"لا تتجاوز ٣٥٠ كلمة. لا مقدّمات ولا اعتذارات ولا تكرارٌ لما في الجدول."
		].join("\n") : [
			"You explain circuits on Digital Garden, a learning platform for computer-science students at Saudi Electronic University.",
			"The course is CS231 (Digital Logic); the set textbook is Mano & Ciletti, Digital Design.",
			"You are explaining **one specific circuit** whose full data is given. Never invent a gate or a row you were not given.",
			"Structure, in this order, with short headings:",
			"## The idea — two lines on what this circuit does.",
			"## How it works — trace the signal from input to output through its actual gates.",
			"## In the real world — one concrete use of this exact circuit.",
			"## In the textbook — where this sits in the course and what it is called.",
			"## Check yourself — one short question the student answers by flipping the switches.",
			"Stay under 350 words. No preamble, no apologies, no restating the table."
		].join("\n")
	}, {
		role: "user",
		content: n
	}];
}
async function wr(e, t, n) {
	let r;
	try {
		r = await fetch(hr(), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				messages: e,
				max_tokens: 1200,
				stream: !0
			})
		});
	} catch {
		return {
			ok: !1,
			reason: "offline"
		};
	}
	if (!r.ok) return {
		ok: !1,
		reason: "unavailable"
	};
	if (!(r.headers.get("Content-Type") ?? "").includes("text/event-stream") || !r.body) try {
		let e = (await r.json()).choices?.[0]?.message?.content ?? "";
		return e.trim() ? (t(e), {
			ok: !0,
			text: e
		}) : {
			ok: !1,
			reason: "empty"
		};
	} catch {
		return {
			ok: !1,
			reason: "unavailable"
		};
	}
	let i = r.body.getReader(), a = new TextDecoder(), o = "", s = "", c = !1;
	for (;;) {
		let { done: e, value: r } = await i.read();
		if (e) break;
		o += a.decode(r, { stream: !0 });
		let l = o.split("\n\n");
		o = l.pop() ?? "";
		for (let e of l) for (let r of e.split("\n")) {
			if (!r.startsWith("data:")) continue;
			let e = r.slice(5).trim();
			if (!(!e || e === "[DONE]")) try {
				let r = JSON.parse(e).choices?.[0]?.delta;
				if (!r) continue;
				r.reasoning_content && !s && !c && (c = !0, n()), r.content && (s += r.content, t(s));
			} catch {}
		}
	}
	return s.trim() ? {
		ok: !0,
		text: s
	} : {
		ok: !1,
		reason: "empty"
	};
}
function Tr(e) {
	let t = document.createDocumentFragment(), n = null;
	for (let r of e.split("\n")) {
		let e = r.trim();
		if (!e) {
			n = null;
			continue;
		}
		if (e.startsWith("#")) {
			n = null;
			let r = document.createElement("h4");
			r.className = "cx-ai-h", r.textContent = e.replace(/^#+\s*/, ""), t.appendChild(r);
			continue;
		}
		if (/^[-*•]\s+/.test(e)) {
			n || (n = document.createElement("ul"), n.className = "cx-ai-list", t.appendChild(n));
			let r = document.createElement("li");
			Er(r, e.replace(/^[-*•]\s+/, "")), n.appendChild(r);
			continue;
		}
		n = null;
		let i = document.createElement("p");
		i.className = "cx-ai-p", Er(i, e), t.appendChild(i);
	}
	return t;
}
function Er(e, t) {
	for (let [n, r] of t.split("**").entries()) if (r) if (n % 2 == 1) {
		let t = document.createElement("strong");
		t.textContent = r, e.appendChild(t);
	} else e.appendChild(document.createTextNode(r));
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/app/panels.ts
var Dr = {
	essentials: {
		ar: "العناصر الأساسية",
		en: "Essentials"
	},
	gates: {
		ar: "البوابات المشتقة",
		en: "Derived gates"
	},
	combinational: {
		ar: "عناصر توافقية",
		en: "Combinational blocks"
	}
}, Or = [
	"essentials",
	"gates",
	"combinational"
], kr = /* @__PURE__ */ new Set([
	"AND",
	"NAND",
	"OR",
	"NOR",
	"XOR",
	"XNOR",
	"ODD_PARITY",
	"EVEN_PARITY"
]), Ar = {
	MUX: [
		[3, "2:1"],
		[6, "4:1"],
		[11, "8:1"]
	],
	MAJORITY: [
		[3, "3"],
		[5, "5"],
		[7, "7"]
	]
};
function Y(e, t, n) {
	return e === "ar" ? t : n;
}
function jr(e) {
	let t = document.createElement("i");
	return t.className = `fa-solid fa-${e}`, t.setAttribute("aria-hidden", "true"), t;
}
function X(e, t, n) {
	let r = document.createElement(e);
	return t && (r.className = t), n !== void 0 && (r.textContent = n), r;
}
function Mr(e) {
	let t = X("button", "cx-collapse");
	return t.type = "button", t.addEventListener("click", e), t;
}
var Nr = [
	"SWITCH",
	"LED",
	"PROBE",
	"NOT",
	"AND",
	"OR",
	"XOR",
	"NAND"
];
function Pr(e, t, n, r, i) {
	let a = t ? Y(n, `إظهار ${r.ar}`, `Show ${r.en}`) : Y(n, `طيّ ${r.ar}`, `Collapse ${r.en}`);
	e.title = a, e.setAttribute("aria-label", a), e.setAttribute("aria-expanded", String(!t));
	let o = document.documentElement.getAttribute("dir") === "rtl", s = t ? i === "start" : i === "end";
	e.textContent = (o ? !s : s) ? "‹" : "›";
}
var Fr = class {
	constructor(e) {
		this.locale = "ar", this.open = /* @__PURE__ */ new Set(["essentials"]), this.query = "", this.armed = null, this.collapsed = !1, this.callbacks = e, this.element = X("section", "cx-panel cx-library");
		let t = X("header", "cx-panel-head");
		t.appendChild(X("h2", "cx-panel-title", "العناصر")), this.collapseButton = Mr(() => this.setCollapsed(!this.collapsed)), t.appendChild(this.collapseButton), this.element.appendChild(t);
		let n = X("div", "cx-lib-search");
		this.search = document.createElement("input"), this.search.type = "search", this.search.className = "cx-lib-input", this.search.autocomplete = "off", this.search.spellcheck = !1, n.appendChild(this.search), this.element.appendChild(n), this.note = X("p", "cx-lib-note"), this.element.appendChild(this.note), this.list = X("div", "cx-lib-list"), this.element.appendChild(this.list), this.rail = X("div", "cx-lib-rail");
		for (let e of Nr) {
			let t = _n.find((t) => t.kind === e);
			if (!t) continue;
			let n = X("button", "cx-rail-btn");
			n.type = "button", n.dataset.kind = e, n.appendChild($n(e, t.inputCount)), n.addEventListener("click", () => this.callbacks.onPick(e)), this.rail.appendChild(n);
		}
		this.element.appendChild(this.rail), this.search.addEventListener("input", () => {
			this.query = this.search.value.trim(), this.renderList();
		});
	}
	setLocale(e) {
		this.locale = e;
		let t = this.element.querySelector(".cx-panel-title");
		t && (t.textContent = Y(e, "العناصر", "Components")), this.search.placeholder = Y(e, "ابحث باسم العنصر…", "Search components…"), this.search.setAttribute("aria-label", Y(e, "ابحث في العناصر", "Search components")), Pr(this.collapseButton, this.collapsed, e, {
			ar: "العناصر",
			en: "components"
		}, "start"), this.syncRailLabels(), this.renderNote(), this.renderList();
	}
	syncRailLabels() {
		for (let e of this.rail.querySelectorAll(".cx-rail-btn")) {
			let t = e.dataset.kind ?? "", n = Y(this.locale, `ضع ${t}`, `Place ${t}`);
			e.title = n, e.setAttribute("aria-label", n), e.classList.toggle("is-armed", this.armed === t);
		}
	}
	setCollapsed(e) {
		this.collapsed = e, this.element.classList.toggle("is-collapsed", e), Pr(this.collapseButton, e, this.locale, {
			ar: "العناصر",
			en: "components"
		}, "start"), this.syncRailLabels(), this.callbacks.onCollapseChange(e);
	}
	setArmed(e) {
		this.armed = e, this.renderNote();
		for (let t of this.list.querySelectorAll(".cx-lib-item")) t.classList.toggle("is-armed", t.dataset.kind === e), t.setAttribute("aria-pressed", String(t.dataset.kind === e));
		this.syncRailLabels();
	}
	renderNote() {
		this.note.textContent = this.armed ? Y(this.locale, `انقر اللوحة لوضع ${this.armed} · Esc للإلغاء`, `Click the canvas to place ${this.armed} · Esc to cancel`) : Y(this.locale, "اختر عنصراً ثم انقر مكانه على اللوحة.", "Pick a component, then click where it goes."), this.note.classList.toggle("is-armed", this.armed !== null);
	}
	renderList() {
		this.list.replaceChildren();
		let e = this.query.length > 0, t = e ? new Set(yn(this.query).map((e) => e.kind)) : null;
		for (let n of Or) {
			let r = _n.filter((e) => e.category === n).filter((e) => !t || t.has(e.kind));
			if (e && r.length === 0) continue;
			let i = X("div", "cx-lib-group"), a = X("button", "cx-lib-toggle");
			a.type = "button";
			let o = e || this.open.has(n);
			if (a.setAttribute("aria-expanded", String(o)), a.append(X("span", "cx-lib-name", Y(this.locale, Dr[n].ar, Dr[n].en)), X("span", "cx-lib-count", String(r.length))), a.addEventListener("click", () => {
				this.open.has(n) ? this.open.delete(n) : this.open.add(n), this.renderList();
			}), i.appendChild(a), o) {
				let e = X("div", "cx-lib-grid");
				for (let t of r) {
					let n = X("button", "cx-lib-item" + (this.armed === t.kind ? " is-armed" : ""));
					n.type = "button", n.title = t.kind, n.dataset.kind = t.kind, n.setAttribute("aria-pressed", String(this.armed === t.kind)), n.appendChild($n(t.kind, t.inputCount)), n.appendChild(X("span", "cx-lib-label", t.kind)), n.addEventListener("click", () => this.callbacks.onPick(t.kind)), e.appendChild(n);
				}
				i.appendChild(e);
			}
			this.list.appendChild(i);
		}
		this.list.childElementCount === 0 && this.list.appendChild(X("p", "cx-empty", Y(this.locale, "لا عنصر بهذا الاسم.", "No component matches that name.")));
	}
}, Ir = {
	free: {
		ar: "ابدأ من الصفر",
		en: "Start from scratch"
	},
	ch2: {
		ar: "الفصل ٢ · الجبر البولياني والبوابات",
		en: "Ch.2 · Boolean algebra & gates"
	},
	ch3: {
		ar: "الفصل ٣ · التصغير على مستوى البوابات",
		en: "Ch.3 · Gate-level minimization"
	},
	ch4: {
		ar: "الفصل ٤ · المنطق التوافقي",
		en: "Ch.4 · Combinational logic"
	}
}, Lr = [
	"free",
	"ch2",
	"ch3",
	"ch4"
], Rr = class {
	constructor(e, t) {
		this.locale = "ar", this.open = !1, this.current = e, this.onPick = t, this.element = X("div", "cx-menu"), this.button = X("button", "cx-menu-btn"), this.button.type = "button", this.button.setAttribute("aria-haspopup", "listbox"), this.button.addEventListener("click", () => this.setOpen(!this.open)), this.element.appendChild(this.button), this.panel = X("div", "cx-menu-panel"), this.panel.setAttribute("role", "listbox"), this.element.appendChild(this.panel), document.addEventListener("pointerdown", (e) => {
			this.open && !this.element.contains(e.target) && this.setOpen(!1);
		}, !0), document.addEventListener("keydown", (e) => {
			e.key === "Escape" && this.open && (this.setOpen(!1), this.button.focus());
		});
	}
	setLocale(e) {
		this.locale = e, this.render();
	}
	get value() {
		return this.current;
	}
	set value(e) {
		this.current = e, this.render();
	}
	setOpen(e) {
		this.open = e, this.element.classList.toggle("is-open", e), this.button.setAttribute("aria-expanded", String(e)), e && this.render();
	}
	render() {
		let e = xn.find((e) => e.id === this.current);
		this.button.replaceChildren();
		let t = X("span", "cx-menu-value", e?.name ?? "—");
		t.dir = "ltr", this.button.append(X("span", "cx-menu-hint", Y(this.locale, "المثال", "Example")), t, X("span", "cx-menu-caret")), this.panel.replaceChildren();
		for (let e of Lr) {
			let t = xn.filter((t) => wn(t.id) === e);
			if (t.length === 0) continue;
			let n = X("p", "cx-menu-group", Y(this.locale, Ir[e].ar, Ir[e].en));
			this.panel.appendChild(n);
			for (let e of t) {
				let t = X("button", "cx-menu-item" + (e.id === this.current ? " is-on" : ""));
				t.type = "button", t.dir = "ltr", t.setAttribute("role", "option"), t.setAttribute("aria-selected", String(e.id === this.current));
				let n = X("span", "cx-menu-name", e.name);
				n.dir = "ltr", t.append(X("span", "cx-menu-check"), n), t.addEventListener("click", () => {
					this.current = e.id, this.setOpen(!1), this.render(), this.onPick(e.id);
				}), this.panel.appendChild(t);
			}
		}
	}
};
function zr(e) {
	return new Promise((t) => {
		let n = X("div", "cx-modal"), r = X("div", "cx-modal-box");
		r.setAttribute("role", "dialog"), r.setAttribute("aria-modal", "true");
		let i = X("div", "cx-modal-head");
		i.appendChild(X("h3", "cx-modal-title", e.title));
		let a = X("button", "cx-modal-x");
		a.appendChild(jr("xmark")), a.type = "button", a.setAttribute("aria-label", e.cancelText), i.appendChild(a), r.appendChild(i), e.note && r.appendChild(X("p", "cx-modal-note", e.note));
		let o = null;
		if (e.label !== void 0) {
			let t = X("label", "cx-modal-label", e.label), n = X("input", "cx-modal-input");
			n.type = "text", n.maxLength = 60, n.value = e.value ?? "", t.appendChild(n), r.appendChild(t), o = n;
		}
		let s = X("div", "cx-modal-actions"), c = X("button", "cx-btn-ghost", e.cancelText);
		c.type = "button";
		let l = X("button", `cx-btn-primary${e.danger ? " is-danger" : ""}`, e.confirmText);
		l.type = "button", s.append(c, l), r.appendChild(s), n.appendChild(r);
		let u = !1, d = (e) => {
			u || (u = !0, document.removeEventListener("keydown", f, !0), n.remove(), t(e));
		}, f = (e) => {
			e.key === "Escape" && (e.stopPropagation(), d(null)), e.key === "Enter" && o && (e.preventDefault(), d(o.value));
		};
		document.addEventListener("keydown", f, !0), a.addEventListener("click", () => d(null)), c.addEventListener("click", () => d(null)), l.addEventListener("click", () => d(o ? o.value : "")), n.addEventListener("pointerdown", (e) => {
			e.target === n && d(null);
		}), document.body.appendChild(n), (o ?? l).focus(), o?.select();
	});
}
var Br = class {
	constructor(e) {
		this.locale = "ar", this.open = !1, this.callbacks = e, this.element = X("div", "cx-menu cx-slots"), this.button = X("button", "cx-icon-btn"), this.button.type = "button", this.button.setAttribute("aria-haspopup", "menu");
		let t = J("svg", {
			viewBox: "0 0 24 24",
			class: "cx-glyph",
			"aria-hidden": "true",
			focusable: "false"
		});
		t.appendChild(J("path", { d: "M3 5h18v4H3zM5 9v10h14V9M10 13h4" })), this.button.appendChild(t), this.button.addEventListener("click", () => this.setOpen(!this.open)), this.element.appendChild(this.button), this.panel = X("div", "cx-menu-panel cx-slot-panel"), this.panel.setAttribute("role", "menu"), this.element.appendChild(this.panel), document.addEventListener("pointerdown", (e) => {
			this.open && !this.element.contains(e.target) && this.setOpen(!1);
		}, !0), document.addEventListener("keydown", (e) => {
			e.key === "Escape" && this.open && (this.setOpen(!1), this.button.focus());
		}), this.syncButton();
	}
	setLocale(e) {
		this.locale = e, this.syncButton(), this.open && this.render();
	}
	refresh() {
		this.syncButton(), this.open && this.render();
	}
	close() {
		this.setOpen(!1);
	}
	syncButton() {
		let e = this.callbacks.list().length, t = Y(this.locale, `محفوظاتي (${e})`, `My saves (${e})`);
		this.button.title = t, this.button.setAttribute("aria-label", t), this.button.classList.toggle("has-items", e > 0);
	}
	setOpen(e) {
		this.open = e, this.element.classList.toggle("is-open", e), this.button.setAttribute("aria-expanded", String(e)), e && this.render();
	}
	render() {
		this.panel.replaceChildren(), this.panel.appendChild(X("p", "cx-menu-group", Y(this.locale, "محفوظاتي", "My saves")));
		let e = this.callbacks.list();
		e.length === 0 && this.panel.appendChild(X("p", "cx-slot-empty", Y(this.locale, "لا محفوظات بعد. احفظ نسختك الأولى باسمٍ تتذكّره.", "No saves yet. Store your first copy under a name you will recognise.")));
		for (let t of e) {
			let e = X("div", "cx-slot"), n = X("button", "cx-slot-open");
			n.type = "button", n.append(X("span", "cx-slot-name", t.name), X("span", "cx-slot-date", Vr(t.updatedAt, this.locale))), n.addEventListener("click", () => {
				this.setOpen(!1), this.callbacks.onOpen(t.id);
			}), e.appendChild(n);
			let r = X("div", "cx-slot-actions"), i = this.slotAction("floppy-disk", Y(this.locale, "استبدله بعملك الحالي", "Replace with current work"));
			i.addEventListener("click", () => {
				this.callbacks.onOverwrite(t.id), this.refresh();
			});
			let a = this.slotAction("pen", Y(this.locale, "إعادة التسمية", "Rename"));
			a.addEventListener("click", async () => {
				let e = await zr({
					title: Y(this.locale, "إعادة تسمية النسخة", "Rename this copy"),
					label: Y(this.locale, "الاسم الجديد", "New name"),
					value: t.name,
					confirmText: Y(this.locale, "حفظ الاسم", "Save name"),
					cancelText: Y(this.locale, "إلغاء", "Cancel")
				});
				e !== null && (this.callbacks.onRename(t.id, e), this.refresh());
			});
			let o = this.slotAction("trash", Y(this.locale, "حذف", "Delete"));
			o.addEventListener("click", async () => {
				await zr({
					title: Y(this.locale, "حذف النسخة", "Delete this copy"),
					note: Y(this.locale, `ستُحذف «${t.name}» نهائياً ولا يمكن استرجاعها.`, `“${t.name}” will be deleted permanently and cannot be recovered.`),
					confirmText: Y(this.locale, "احذفها", "Delete it"),
					cancelText: Y(this.locale, "إلغاء", "Cancel"),
					danger: !0
				}) !== null && (this.callbacks.onRemove(t.id), this.refresh());
			}), r.append(i, a, o), e.appendChild(r), this.panel.appendChild(e);
		}
		let t = X("button", "cx-slot-add");
		t.type = "button", t.textContent = Y(this.locale, "＋ حفظ نسخة باسم", "＋ Save a copy"), t.addEventListener("click", async () => {
			let t = await zr({
				title: Y(this.locale, "حفظ نسخة باسم", "Save a copy"),
				label: Y(this.locale, "اسم النسخة", "Copy name"),
				value: Y(this.locale, `نسختي ${e.length + 1}`, `My copy ${e.length + 1}`),
				note: Y(this.locale, "تُحفظ على هذا الجهاز، ويبقى حفظُك التلقائي كما هو.", "Stored on this device; your autosave stays as it is."),
				confirmText: Y(this.locale, "احفظ", "Save"),
				cancelText: Y(this.locale, "إلغاء", "Cancel")
			});
			t !== null && (this.setOpen(!1), this.callbacks.onSaveNew(t));
		}), this.panel.appendChild(t);
	}
	slotAction(e, t) {
		let n = X("button", "cx-slot-action");
		return n.appendChild(jr(e)), n.type = "button", n.title = t, n.setAttribute("aria-label", t), n;
	}
};
function Vr(e, t) {
	let n = new Date(e);
	return Number.isNaN(n.getTime()) ? "" : new Intl.DateTimeFormat(t === "ar" ? "ar-SA-u-ca-gregory" : "en-GB", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit"
	}).format(n);
}
var Hr = {
	top: {
		ar: "فوق",
		en: "Top"
	},
	center: {
		ar: "داخل",
		en: "Center"
	},
	bottom: {
		ar: "تحت",
		en: "Bottom"
	}
}, Ur = class {
	constructor(e) {
		this.locale = "ar", this.open = !1, this.node = null, this.callbacks = e, this.element = X("section", "cx-props"), this.toggle = X("button", "cx-props-toggle"), this.toggle.type = "button", this.toggle.setAttribute("aria-expanded", "false"), this.toggle.addEventListener("click", () => {
			this.open = !this.open, this.render();
		}), this.element.appendChild(this.toggle), this.body = X("div", "cx-props-body"), this.element.appendChild(this.body);
	}
	setLocale(e) {
		this.locale = e, this.render();
	}
	update(e) {
		this.node = e, this.render();
	}
	render() {
		let e = Y(this.locale, "الخصائص", "Properties");
		if (this.toggle.replaceChildren(X("span", "cx-props-name", e), X("span", "cx-props-subject", this.node ? this.node.label || this.node.id : "—")), this.toggle.setAttribute("aria-expanded", String(this.open)), this.element.classList.toggle("is-open", this.open), this.body.replaceChildren(), !this.open) return;
		let t = this.node;
		if (!t) {
			this.body.appendChild(X("p", "cx-empty", Y(this.locale, "اختر عنصراً على اللوحة.", "Select a component on the canvas.")));
			return;
		}
		let r = X("p", "cx-props-kind", t.component);
		r.dir = "ltr", this.body.appendChild(r);
		let i = X("label", "cx-field");
		i.appendChild(X("span", "cx-field-label", Y(this.locale, "الاسم", "Label")));
		let a = document.createElement("input");
		a.type = "text", a.className = "cx-input", a.maxLength = n.maximumLabelLength, a.value = t.label, a.dir = "ltr", a.addEventListener("change", () => {
			a.value !== t.label && this.callbacks.onUpdateNode(t.id, { label: a.value });
		}), i.appendChild(a), this.body.appendChild(i);
		let o = X("div", "cx-field");
		o.appendChild(X("span", "cx-field-label", Y(this.locale, "موضع الاسم", "Label position")));
		let s = X("div", "cx-segment");
		s.setAttribute("role", "group");
		for (let e of [
			"top",
			"center",
			"bottom"
		]) {
			let n = X("button", "cx-segment-btn" + (t.labelPlacement === e ? " is-on" : ""), Y(this.locale, Hr[e].ar, Hr[e].en));
			n.type = "button", n.setAttribute("aria-pressed", String(t.labelPlacement === e)), n.addEventListener("click", () => this.callbacks.onUpdateNode(t.id, { labelPlacement: e })), s.appendChild(n);
		}
		o.appendChild(s), this.body.appendChild(o);
		let c = Ar[t.component];
		if (c) {
			let e = X("div", "cx-field");
			e.appendChild(X("span", "cx-field-label", Y(this.locale, "السعة", "Capacity")));
			let n = X("div", "cx-segment");
			n.setAttribute("role", "group");
			for (let [e, r] of c) {
				let i = X("button", "cx-segment-btn" + (t.inputCount === e ? " is-on" : ""), r);
				i.type = "button", i.dir = "ltr", i.setAttribute("aria-pressed", String(t.inputCount === e)), i.addEventListener("click", () => {
					t.inputCount !== e && this.callbacks.onUpdateNode(t.id, { inputCount: e });
				}), n.appendChild(i);
			}
			e.appendChild(n), this.body.appendChild(e);
		}
		if (kr.has(t.component)) {
			let e = X("label", "cx-field");
			e.appendChild(X("span", "cx-field-label", Y(this.locale, "عدد المداخل", "Inputs")));
			let n = document.createElement("input");
			n.type = "number", n.className = "cx-input", n.min = "2", n.max = "8", n.step = "1", n.value = String(t.inputCount), n.addEventListener("change", () => {
				let e = Math.min(8, Math.max(2, Math.round(Number(n.value) || t.inputCount)));
				n.value = String(e), e !== t.inputCount && this.callbacks.onUpdateNode(t.id, { inputCount: e });
			}), e.appendChild(n), this.body.appendChild(e);
		}
		if (t.role === "output") {
			let e = X("div", "cx-field");
			e.appendChild(X("span", "cx-field-label", Y(this.locale, "شكل المخرج", "Output shape")));
			let n = X("div", "cx-segment");
			n.setAttribute("role", "group");
			for (let [e, r] of [["PROBE", "probe"], ["LED", "led"]]) {
				let i = X("button", "cx-segment-btn" + (t.component === e ? " is-on" : ""), e);
				i.type = "button", i.dir = "ltr", i.setAttribute("aria-pressed", String(t.component === e)), i.addEventListener("click", () => {
					t.component !== e && this.callbacks.onUpdateNode(t.id, {
						component: e,
						outputDisplay: r
					});
				}), n.appendChild(i);
			}
			e.appendChild(n), this.body.appendChild(e);
		}
	}
}, Wr = {
	truth: {
		ar: "جدول الحقيقة",
		en: "Truth table"
	},
	karnaugh: {
		ar: "كارنو والتبسيط",
		en: "Karnaugh & simplification"
	},
	signals: {
		ar: "الإشارات",
		en: "Signals"
	},
	explain: {
		ar: "اشرح لي",
		en: "Explain"
	}
}, Gr = [
	"truth",
	"karnaugh",
	"signals",
	"explain"
], Kr = class {
	constructor(e, t, n) {
		this.collapsed = !1, this.locale = "ar", this.tab = "truth", this.expanded = !1, this.showInternalSignals = !1, this.latest = null, this.explainContext = null, this.onExpandChange = e, this.onCollapseChange = t, this.onApplyRow = n, this.element = X("section", "cx-panel cx-evidence");
		let r = X("header", "cx-panel-head");
		r.appendChild(X("h2", "cx-panel-title", "التحليل والنتائج")), this.expandButton = X("button", "cx-icon-btn"), this.expandButton.type = "button", this.expandButton.addEventListener("click", () => {
			this.expanded = !this.expanded, this.element.classList.toggle("is-expanded", this.expanded), this.syncExpandButton(), this.onExpandChange(this.expanded);
		}), r.appendChild(this.expandButton), this.collapseButton = Mr(() => this.setCollapsed(!this.collapsed)), r.appendChild(this.collapseButton), this.element.appendChild(r), this.tabsBar = X("div", "cx-tabs"), this.tabsBar.setAttribute("role", "tablist"), this.element.appendChild(this.tabsBar), this.body = X("div", "cx-evidence-body"), this.element.appendChild(this.body);
	}
	setLocale(e) {
		this.locale = e;
		let t = this.element.querySelector(".cx-panel-title");
		t && (t.textContent = Y(e, "التحليل والنتائج", "Analysis & evidence")), this.syncExpandButton(), Pr(this.collapseButton, this.collapsed, e, {
			ar: "التحليل",
			en: "analysis"
		}, "end"), this.renderTabs(), this.renderBody();
	}
	setCollapsed(e) {
		this.collapsed = e, this.element.classList.toggle("is-collapsed", e), Pr(this.collapseButton, e, this.locale, {
			ar: "التحليل",
			en: "analysis"
		}, "end"), this.expandButton.hidden = e, this.onCollapseChange(e);
	}
	syncExpandButton() {
		let e = this.expanded ? Y(this.locale, "تصغير لوحة الدليل", "Collapse evidence") : Y(this.locale, "توسيع لوحة الدليل", "Expand evidence");
		this.expandButton.title = e, this.expandButton.setAttribute("aria-label", e), this.expandButton.setAttribute("aria-pressed", String(this.expanded)), this.expandButton.textContent = this.expanded ? "⤡" : "⤢";
	}
	update(e, t) {
		this.latest = {
			artifact: e,
			snapshot: t
		}, this.renderTabs(), this.renderBody();
	}
	renderTabs() {
		this.tabsBar.replaceChildren();
		for (let e of Gr) {
			let t = X("button", "cx-tab" + (this.tab === e ? " is-active" : ""));
			t.type = "button", t.setAttribute("role", "tab"), t.setAttribute("aria-selected", String(this.tab === e)), t.textContent = Y(this.locale, Wr[e].ar, Wr[e].en), t.addEventListener("click", () => {
				this.tab = e, this.renderTabs(), this.renderBody();
			}), this.tabsBar.appendChild(t);
		}
	}
	renderBody() {
		if (this.body.replaceChildren(), !this.latest) return;
		let { artifact: e, snapshot: t } = this.latest;
		this.tab === "signals" ? this.renderSignals(e, t) : this.tab === "truth" ? this.renderTruthTable(t) : this.tab === "explain" ? this.renderExplain(t) : this.renderKarnaugh(t);
	}
	openExplain() {
		this.tab = "explain", this.renderTabs(), this.renderBody();
	}
	renderExplain(e) {
		let t = this.explainContext?.(e);
		if (!t) {
			this.body.appendChild(X("p", "cx-empty", Y(this.locale, "لا دائرة لتُشرح بعد.", "Nothing to explain yet.")));
			return;
		}
		let n = X("div", "cx-ai"), r = X("div", "cx-ai-head"), i = X("span", "cx-ai-name", t.presetName);
		i.dir = "ltr", r.appendChild(i), n.appendChild(r);
		let a = X("div", "cx-ai-body");
		n.appendChild(a);
		let o = yr(t.presetId, this.locale), s = 2 - xr(t.presetId, this.locale), c = X("button", "cx-btn-primary cx-ai-go");
		c.type = "button";
		let l = () => {
			let e = 2 - xr(t.presetId, this.locale), n = a.querySelector(".cx-ai-p, .cx-ai-h") !== null;
			c.textContent = n ? Y(this.locale, `اشرح مرّةً أخرى (${e} متبقّية)`, `Explain again (${e} left)`) : Y(this.locale, "اشرح لي هذا المثال", "Explain this example"), c.disabled = n && e <= 0, c.title = c.disabled ? Y(this.locale, "انتهت إعادتاك لهذا المثال.", "You have used both regenerations for this example.") : "";
		};
		o ? a.replaceChildren(Tr(o)) : a.appendChild(X("p", "cx-ai-idle", Y(this.locale, "شرحٌ مكتوبٌ لهذه الدائرة بعينها: فكرتُها · كيف تعمل بواباتُها · مثالٌ من الواقع · موضعُها في الكتاب.", "A written explanation of this exact circuit: the idea, how its gates work, a real-world use, and where it sits in the textbook."))), c.addEventListener("click", async () => {
			let e = 2 - xr(t.presetId, this.locale), n = a.querySelector(".cx-ai-p, .cx-ai-h") !== null;
			if (n && e <= 0) return;
			c.disabled = !0;
			let r = X("p", "cx-ai-status", Y(this.locale, "يقرأ دائرتك…", "Reading your circuit…"));
			a.replaceChildren(r);
			let i = await wr(Cr(t, this.locale), (e) => a.replaceChildren(Tr(e)), () => {
				r.textContent = Y(this.locale, "يفكّر…", "Thinking…");
			});
			if (i.ok) br(t.presetId, this.locale, i.text), n && Sr(t.presetId, this.locale), a.replaceChildren(Tr(i.text));
			else {
				let [e, t] = {
					offline: ["لا اتصال بالشبكة الآن.", "No network connection right now."],
					unavailable: ["خدمةُ الشرح غير متاحة الآن — جرّب بعد قليل.", "The explain service is unavailable — try again shortly."],
					empty: ["لم يصل شرحٌ — أعد المحاولة.", "No explanation came back — try again."]
				}[i.reason] ?? ["تعذّر الشرح.", "Explanation failed."];
				a.replaceChildren(X("p", "cx-ai-error", Y(this.locale, e, t)));
			}
			l(), c.disabled = !1;
		}), l(), o && n.appendChild(X("p", "cx-ai-quota", Y(this.locale, s > 0 ? `لك ${s} إعادةٌ لهذا المثال.` : "انتهت إعادتاك لهذا المثال.", s > 0 ? `${s} regeneration(s) left for this example.` : "No regenerations left for this example."))), n.appendChild(c), this.body.appendChild(n);
	}
	renderSignals(e, t) {
		let n = lr(e, t);
		if (n.length === 0) {
			this.body.appendChild(X("p", "cx-empty", Y(this.locale, "لا عقد بعد.", "No nodes yet.")));
			return;
		}
		let r = n.filter((e) => e.role === "output"), i = n.filter((e) => e.role !== "output");
		if (this.body.appendChild(this.buildSignalList(r.length > 0 ? r : n)), r.length > 0 && i.length > 0) {
			let e = X("button", "cx-more");
			e.type = "button", e.setAttribute("aria-expanded", String(this.showInternalSignals)), e.textContent = this.showInternalSignals ? Y(this.locale, "إخفاء الإشارات الداخلية", "Hide internal signals") : Y(this.locale, `الإشارات الداخلية (${i.length})`, `Internal signals (${i.length})`), e.addEventListener("click", () => {
				this.showInternalSignals = !this.showInternalSignals, this.renderBody();
			}), this.body.appendChild(e), this.showInternalSignals && this.body.appendChild(this.buildSignalList(i));
		}
	}
	buildSignalList(e) {
		let t = X("div", "cx-signals");
		for (let n of e) {
			let e = X("div", `cx-signal is-${n.role}`);
			e.appendChild(X("span", "cx-signal-name", n.label || n.nodeId));
			let r = X("span", `cx-signal-value ${n.value === 1 ? "is-high" : n.value === 0 ? "is-low" : "is-unknown"}`);
			r.textContent = String(n.value), e.appendChild(r);
			let i = X("code", "cx-signal-expr", n.expression);
			i.dir = "ltr", e.appendChild(i), t.appendChild(e);
		}
		return t;
	}
	renderTruthTable(e) {
		let t = ur(e.truthTable);
		if (t.columns.length === 0 || t.rowCount === 0) {
			this.body.appendChild(X("p", "cx-empty", Y(this.locale, "أضف مدخلاً ومخرجاً لتوليد الجدول.", "Add an input and an output to generate the table.")));
			return;
		}
		let n = X("div", "cx-scroll"), r = X("table", "cx-table");
		r.dir = "ltr";
		let i = X("tr");
		for (let e of t.columns) {
			let t = X("th", `cx-col-${e.kind}`, e.id);
			i.appendChild(t);
		}
		let a = X("thead");
		a.appendChild(i), r.appendChild(a);
		let o = X("tbody"), s = Xr(e);
		for (let n of e.truthTable.rows) {
			let e = X("tr", n.index === s ? "is-current" : "");
			e.tabIndex = 0, e.setAttribute("role", "button"), e.setAttribute("aria-label", `Apply row ${n.index}`);
			let r = () => this.onApplyRow(n.inputs);
			e.addEventListener("click", r), e.addEventListener("keydown", (e) => {
				(e.key === "Enter" || e.key === " ") && (e.preventDefault(), r());
			});
			for (let r of t.columns) {
				let t = r.kind === "input" ? n.inputs[r.id] : n.outputs[r.id];
				e.appendChild(X("td", `cx-col-${r.kind} is-${t === 1 ? "high" : t === 0 ? "low" : "unknown"}`, String(t ?? "X")));
			}
			o.appendChild(e);
		}
		r.appendChild(o), n.appendChild(r), this.body.appendChild(n);
	}
	renderKarnaugh(e) {
		let t = e.truthTable.outputNodeIds;
		if (t.length === 0) {
			this.body.appendChild(X("p", "cx-empty", Y(this.locale, "لا مخرج لعرض خريطته.", "No output to map.")));
			return;
		}
		for (let n of t) {
			let t = e.karnaughByOutputId[n], r = e.simplificationByOutputId[n], i = X("div", "cx-kmap-block"), a = X("h3", "cx-kmap-title", e.displayNameByNodeId[n] ?? n);
			a.dir = "ltr", i.appendChild(a);
			let o = r?.selectedImplicants ?? [], s = (e) => o.flatMap((t, n) => t.coveredMinterms.includes(e) ? [n] : []);
			if (t && t.available) {
				let e = dr(t), n = X("div", "cx-scroll"), a = X("table", "cx-kmap");
				a.dir = e.direction;
				let c = X("tr"), l = X("th", "cx-kmap-corner");
				l.appendChild(X("span", "cx-kmap-colvars", t.columnVariables.join(""))), l.appendChild(X("span", "cx-kmap-rowvars", t.rowVariables.join(""))), l.dir = "ltr", c.appendChild(l);
				for (let e of t.columnGrayCodes) c.appendChild(X("th", "cx-kmap-axis", e));
				let u = X("thead");
				u.appendChild(c), a.appendChild(u);
				let d = X("tbody");
				for (let e = 0; e < t.rows; e += 1) {
					let n = X("tr");
					n.appendChild(X("th", "cx-kmap-axis", t.rowGrayCodes[e] ?? ""));
					for (let r = 0; r < t.columns; r += 1) {
						let i = t.cells.find((t) => t.row === e && t.column === r), a = X("td", `is-${i?.value === 1 ? "high" : i?.value === 0 ? "low" : "unknown"}`);
						a.appendChild(X("span", "cx-kmap-index", `m${i?.minterm ?? 0}`)), a.appendChild(X("span", "cx-kmap-bit", String(i?.value ?? "X")));
						for (let e of i ? s(i.minterm) : []) a.appendChild(X("span", `cx-kmap-group cx-kmap-group--${e % 6}`));
						n.appendChild(a);
					}
					d.appendChild(n);
				}
				if (a.appendChild(d), n.appendChild(a), i.appendChild(n), o.length > 0 && r) {
					let e = X("div", "cx-kmap-legend");
					for (let [t, n] of o.entries()) {
						let i = X("span", `cx-legend-item cx-kmap-group--${t % 6}`);
						i.dir = "ltr", i.textContent = Yr(n.pattern, r.variableNames), e.appendChild(i);
					}
					i.appendChild(e);
				}
			} else i.appendChild(X("p", "cx-note", Y(this.locale, "أكثر من ٦ متغيّرات: لا خريطة مرئية، والتبسيط الجبري يستمر.", "More than 6 variables: no visual map; the algebraic derivation continues.")));
			r && i.appendChild(this.buildDerivation(r)), this.body.appendChild(i);
		}
	}
	buildDerivation(e) {
		let t = X("div", "cx-derivation"), n = X("div", "cx-derivation-head");
		n.appendChild(X("span", "cx-derivation-label", Y(this.locale, "التبسيط الجبري — خطوة بخطوة", "Algebraic simplification — step by step"))), n.appendChild(X("span", "cx-derivation-count", Y(this.locale, `${e.minterms.length} صغرى · ${e.literalCount} حرفاً في الناتج`, `${e.minterms.length} minterms · ${e.literalCount} literals`))), t.appendChild(n);
		let r = X("ol", "cx-steps");
		for (let t of e.steps) {
			let e = X("li", `cx-step is-${t.law}`), n = X("span", "cx-step-law", Y(this.locale, qr[t.law].ar, qr[t.law].en));
			e.appendChild(n);
			let i = X("code", "cx-step-expr", t.expression);
			i.dir = "ltr", e.appendChild(i);
			let a = Jr[t.law];
			if (a) {
				let t = X("span", "cx-step-rule", a);
				t.dir = "ltr", e.appendChild(t);
			}
			r.appendChild(e);
		}
		return t.appendChild(r), t;
	}
}, qr = {
	"sum-of-minterms": {
		ar: "مجموع الصغريات من الجدول",
		en: "Sum of minterms from the table"
	},
	"dont-care": {
		ar: "ضمُّ حدود اللامبالاة",
		en: "Include don’t-care terms"
	},
	idempotent: {
		ar: "التكرار",
		en: "Idempotent law"
	},
	combining: {
		ar: "التوحيد",
		en: "Combining"
	},
	minimal: {
		ar: "الصورة الصغرى",
		en: "Minimal form"
	}
}, Jr = {
	idempotent: "x + x = x",
	combining: "xy + xy′ = x",
	"sum-of-minterms": "F = Σm",
	"dont-care": "d → 1"
};
function Yr(e, t) {
	let n = t.every((e) => e.length === 1), r = [...e].flatMap((e, n) => {
		if (e === "-") return [];
		let r = t[n] ?? "?";
		return [e === "1" ? r : `${r}′`];
	});
	return r.length === 0 ? "1" : r.join(n ? "" : " · ");
}
function Xr(e) {
	let t = e.truthTable.inputNodeIds;
	if (t.length === 0) return -1;
	let n = 0;
	for (let r of t) {
		let t = e.values[r];
		if (t !== 0 && t !== 1) return -1;
		n = n * 2 + t;
	}
	return n;
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/app/messages.ts
function Zr(e, t) {
	let n = t === "ar";
	switch (e.code) {
		case "COMBINATIONAL_CYCLE": return n ? "لا يمكن: هذا يُغلق حلقةً على نفسها. الدائرة التوافقية تسير في اتجاه واحد من المدخل إلى المخرج." : "Not allowed: this closes a loop. A combinational circuit flows one way, input to output.";
		case "TARGET_OCCUPIED": return n ? "هذا المدخل موصولٌ أصلاً. احذف سلكه أولاً، أو استخدم مدخلاً آخر." : "That input is already driven. Delete its wire first, or use another input.";
		case "INVALID_SOURCE": return n ? "المصدر يجب أن يكون مخرَجَ عنصر." : "A wire must start at a component output.";
		case "INVALID_TARGET": return n ? "الوجهة يجب أن تكون مدخلاً غير مشغول." : "A wire must end at a free component input.";
		case "LIMIT_REACHED": return n ? `بلغتَ الحدّ: ${e.params.maximum} من نوع ${e.params.kind}.` : `Limit reached: ${e.params.maximum} ${e.params.kind} components.`;
		case "INVALID_ARITY": return n ? `عدد المداخل يجب أن يكون بين ${e.params.minimum} و${e.params.maximum}.` : `Inputs must be between ${e.params.minimum} and ${e.params.maximum}.`;
		case "OUT_OF_BOUNDS": return n ? "خارج مساحة العمل." : "Outside the workspace.";
		case "ROLE_COMPONENT_MISMATCH": return n ? "هذا العنصر لا يصلح في هذا الموضع." : "That component does not fit this role.";
		default: return n ? "تعذّر تنفيذ هذه الخطوة." : "That step could not be applied.";
	}
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/app/lab-view.ts
function Z(e, t, n) {
	let r = document.createElement(e);
	return t && (r.className = t), n !== void 0 && (r.textContent = n), r;
}
function Q(e, t, n) {
	return e === "ar" ? t : n;
}
var $ = {
	undo: "M9 7 4 12l5 5M4 12h9a6 6 0 0 1 0 12h-3",
	redo: "M15 7l5 5-5 5M20 12h-9a6 6 0 0 0 0 12h3",
	duplicate: "M9 9h10v10H9zM5 15V5h10",
	remove: "M6 8h12M10 8V6h4v2M8 8l1 11h6l1-11",
	layout: "M4 6h6v5H4zM4 15h6v3H4zM14 5h6v6h-6zM14 14h6v5h-6zM10 8h4M10 16h4",
	save: "M5 4h11l3 3v13H5zM8 4v6h7V4M8 20v-6h8v6",
	open: "M4 7h6l2 2h8v10H4zM4 7V5h6l2 2",
	explain: "M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM18 16l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z",
	widen: "M4 10V4h6M20 14v6h-6M4 4l6 6M20 20l-6-6",
	narrow: "M10 4v6H4M14 20v-6h6M4 10l6-6M20 14l-6 6",
	share: "M10 14a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-5.7-5.7l-1.7 1.7M14 10a4 4 0 0 0-6-.5l-3 3a4 4 0 0 0 5.7 5.7l1.7-1.7"
};
function Qr(e) {
	let t = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	t.setAttribute("viewBox", "0 0 24 24"), t.setAttribute("class", "cx-glyph"), t.setAttribute("aria-hidden", "true"), t.setAttribute("focusable", "false");
	let n = document.createElementNS("http://www.w3.org/2000/svg", "path");
	return n.setAttribute("d", e), t.appendChild(n), t;
}
var $r = class {
	constructor(e, t, n) {
		this.selection = w, this.armed = null, this.resumeButton = null, this.wideCanvas = !1, this.slotList = [], this.toggleCount = 0, this.hintTimer = null, this.locale = t, this.savedArtifact = n ?? null, this.history = T(Sn(e).artifact), this.saver = ei(), this.slotStore = ti(), this.element = Z("div", "cx-lab");
		let r = Z("header", "cx-bar"), i = Z("div", "cx-bar-title");
		this.taskLine = Z("p", "cx-task"), i.appendChild(this.taskLine), r.appendChild(i);
		let a = Z("div", "cx-bar-tools");
		this.presetSelect = new Rr(Sn(e).id, (e) => this.loadPreset(e)), a.appendChild(this.presetSelect.element);
		let o = Z("div", "cx-group");
		this.undoButton = this.iconButton($.undo, "تراجع (Ctrl+Z)", "Undo (Ctrl+Z)", () => this.undo()), this.redoButton = this.iconButton($.redo, "إعادة (Ctrl+Y)", "Redo (Ctrl+Y)", () => this.redo()), this.duplicateButton = this.iconButton($.duplicate, "تكرار المحدَّد (Ctrl+D)", "Duplicate selection (Ctrl+D)", () => this.duplicateSelection()), this.deleteButton = this.iconButton($.remove, "حذف المحدَّد (Delete)", "Delete selection (Delete)", () => this.deleteSelection()), o.append(this.undoButton, this.redoButton, this.duplicateButton, this.deleteButton), a.appendChild(o), this.slots = new Br({
			list: () => this.slotList,
			onSaveNew: (e) => void this.saveSlot(e),
			onOverwrite: (e) => void this.saveSlot(this.slotList.find((t) => t.id === e)?.name ?? "", e),
			onOpen: (e) => void this.openSlot(e),
			onRename: (e, t) => {
				this.slotStore?.rename(e, t) && this.reloadSlots();
			},
			onRemove: (e) => {
				this.slotStore?.remove(e), this.reloadSlots();
			}
		});
		let s = Z("div", "cx-group");
		s.append(this.iconButton($.layout, "توزيع الرسم تلقائياً", "Tidy layout", () => this.autoLayout()), this.slots.element, this.iconButton($.save, "تصدير الآلة ملفاً", "Export circuit", () => void this.exportArtifact()), this.iconButton($.open, "استيراد آلة من ملف", "Import circuit", () => this.importArtifact()), this.iconButton($.share, "نسخ رابط الدائرة", "Copy circuit link", () => void this.shareLink())), a.appendChild(s);
		let c = Z("div", "cx-group");
		c.appendChild(this.iconButton($.explain, "اشرح لي هذا المثال", "Explain this example", () => this.evidence.openExplain())), a.appendChild(c), this.wideButton = this.iconButton($.widen, "وسّع اللوحة", "Maximise canvas", () => this.toggleWideCanvas());
		let l = Z("div", "cx-group");
		l.appendChild(this.wideButton), l.append(this.textButton("−", "تصغير", "Zoom out", () => this.canvas.zoomBy(1 / 1.2)), this.textButton("+", "تكبير", "Zoom in", () => this.canvas.zoomBy(1.2)), this.textButton("Fit", "ملاءمة الدائرة", "Fit circuit", () => this.canvas.fitTo(this.artifact))), a.appendChild(l), r.appendChild(a), this.element.appendChild(r);
		let u = Z("div", "cx-columns"), d = Z("div", "cx-side");
		this.library = new Fr({
			onPick: (e) => this.armComponent(e),
			onCollapseChange: (e) => this.element.classList.toggle("is-library-collapsed", e)
		}), this.properties = new Ur({ onUpdateNode: (e, t) => this.dispatch({
			type: "node.update",
			nodeId: e,
			patch: t
		}) }), d.append(this.library.element, this.properties.element), u.appendChild(d);
		let f = Z("div", "cx-center");
		this.canvas = new ir({
			onToggleInput: (e) => this.toggleInput(e),
			onSelect: (e) => this.applySelection(e),
			onViewportChange: (e) => this.storeViewport(e),
			onMoveNodes: (e) => this.dispatch({
				type: "node.move-many",
				positions: e
			}),
			onConnect: (e, t) => this.connect(e, t),
			onPlace: (e) => this.placeArmed(e),
			onRejectConnection: () => this.setHint(Q(this.locale, "وصّل من مخرَجِ عنصرٍ إلى مدخلِ آخر.", "Drag from a component output to another component input."), "error")
		}), f.appendChild(this.canvas.element), this.hintLine = Z("p", "cx-hint"), this.hintLine.setAttribute("role", "status"), f.appendChild(this.hintLine), u.appendChild(f), this.evidence = new Kr((e) => this.element.classList.toggle("is-evidence-expanded", e), (e) => this.element.classList.toggle("is-evidence-collapsed", e), (e) => this.applyInputRow(e)), this.evidence.explainContext = (e) => this.buildExplainContext(e), u.appendChild(this.evidence.element), this.element.appendChild(u);
		let p = Z("div", "cx-foot");
		if (this.saveLine = Z("span", "cx-save"), p.appendChild(this.saveLine), this.savedArtifact) {
			let e = Z("button", "cx-resume");
			e.type = "button", this.resumeButton = e, e.addEventListener("click", () => {
				this.history = T(this.savedArtifact), this.selection = w, this.presetSelect.value = this.savedArtifact.sourcePresetId ?? "free-build", e.remove(), this.refresh(!0), requestAnimationFrame(() => this.canvas.fitTo(this.artifact));
			}), p.appendChild(e);
		}
		this.element.appendChild(p), this.onKeyDown = (e) => this.handleKey(e), document.addEventListener("keydown", this.onKeyDown), this.onResize = () => this.syncShellMetrics(), window.addEventListener("resize", this.onResize), this.syncShellMetrics();
		let m = document.querySelector("header[data-gh]");
		m && typeof ResizeObserver < "u" && new ResizeObserver(() => this.syncShellMetrics()).observe(m), this.reloadSlots(), this.setLocale(t), this.refresh(!0), requestAnimationFrame(() => this.canvas.fitTo(this.artifact));
	}
	get artifact() {
		return this.history.present;
	}
	destroy() {
		document.removeEventListener("keydown", this.onKeyDown), window.removeEventListener("resize", this.onResize), this.saver?.cancel();
	}
	syncShellMetrics() {
		let e = document.querySelector("header[data-gh]")?.getBoundingClientRect().height ?? 0;
		e > 0 && document.documentElement.style.setProperty("--cx-shell-h", `${Math.round(e)}px`);
	}
	setLocale(e) {
		this.locale = e, this.presetSelect.setLocale(e), this.slots.setLocale(e), this.library.setLocale(e), this.properties.setLocale(e), this.evidence.setLocale(e), this.taskLine.textContent = Q(e, "شغّل المدخلات وراقب المخرجات، أو ابنِ دائرتك: اختر عنصراً ثم انقر اللوحة، ووصّل بالسحب بين المنافذ.", "Toggle the inputs and watch the outputs, or build your own: pick a component, click the canvas, and drag between ports to wire."), this.setHint(""), this.syncSaveLine(""), this.syncWideButton(), this.resumeButton && (this.resumeButton.textContent = Q(e, "استئناف عملك المحفوظ", "Resume your saved work"));
		for (let t of this.element.querySelectorAll("[data-ar-title]")) {
			let n = e === "ar" ? t.dataset.arTitle : t.dataset.enTitle;
			t.title = n, t.setAttribute("aria-label", n);
		}
	}
	dispatch(e) {
		let t = Bt(this.artifact, e, { updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
		if (!t.ok) {
			let e = t.issues[0];
			return e && this.setHint(Zr(e, this.locale), "error"), !1;
		}
		return this.history = ct(this.history, t.artifact), this.pruneSelection(), this.refresh(!1), this.scheduleSave(), !0;
	}
	armComponent(e) {
		this.armed = this.armed === e ? null : e, this.library.setArmed(this.armed), this.canvas.setArmedComponent(this.armed), this.setHint(this.armed ? Q(this.locale, `انقر اللوحة لوضع ${this.armed}.`, `Click the canvas to place ${this.armed}.`) : "");
	}
	placeArmed(e) {
		let t = this.armed;
		if (!t) return;
		let n = {
			id: this.nextNodeId(t),
			role: u(t),
			component: t,
			label: "",
			labelPlacement: "bottom",
			position: e,
			inputCount: vn(t),
			...t === "CONSTANT_0" ? { constantValue: 0 } : {},
			...t === "CONSTANT_1" ? { constantValue: 1 } : {},
			...t === "PROBE" ? { outputDisplay: "probe" } : {},
			...t === "LED" ? { outputDisplay: "led" } : {}
		};
		this.dispatch({
			type: "node.add",
			node: n
		}) && (n.role === "input" && (this.history = ct(this.history, {
			...this.artifact,
			session: {
				...this.artifact.session,
				inputValues: {
					...this.artifact.session.inputValues,
					[n.id]: 0
				}
			}
		})), this.selection = et(n.id), this.armed = null, this.library.setArmed(null), this.canvas.setArmedComponent(null), this.setHint(Q(this.locale, "وُضع. وصّل بالسحب من منفذٍ إلى منفذ.", "Placed. Drag from one port to another to wire.")), this.refresh(!1));
	}
	connect(e, t) {
		let n = {
			id: this.nextWireId(),
			source: e,
			target: t,
			label: "",
			route: {
				mode: "orthogonal-auto",
				waypoints: []
			}
		};
		this.dispatch({
			type: "wire.connect",
			wire: n
		}) && (this.selection = tt(n.id), this.refresh(!1));
	}
	deleteSelection() {
		let { nodeIds: e, wireIds: t } = this.selection;
		if (e.length === 0 && t.length === 0) {
			this.setHint(Q(this.locale, "لا شيء محدَّد.", "Nothing is selected."));
			return;
		}
		t.length > 0 && !this.dispatch({
			type: "wire.delete-many",
			wireIds: t
		}) || e.length > 0 && !this.dispatch({
			type: "node.delete-many",
			nodeIds: e
		}) || (this.selection = w, this.refresh(!1));
	}
	duplicateSelection() {
		if (this.selection.nodeIds.length === 0) {
			this.setHint(Q(this.locale, "اختر عنصراً أو أكثر أولاً.", "Select one or more components first."));
			return;
		}
		this.dispatch({
			type: "node.duplicate-many",
			nodeIds: this.selection.nodeIds,
			offset: {
				x: 40,
				y: 60
			}
		});
	}
	undo() {
		let e = lt(this.history);
		if (e === this.history) {
			this.setHint(Q(this.locale, "لا خطوة سابقة.", "Nothing to undo."));
			return;
		}
		this.history = e, this.pruneSelection(), this.refresh(!1), this.scheduleSave();
	}
	redo() {
		let e = ut(this.history);
		if (e === this.history) {
			this.setHint(Q(this.locale, "لا خطوة تالية.", "Nothing to redo."));
			return;
		}
		this.history = e, this.pruneSelection(), this.refresh(!1), this.scheduleSave();
	}
	handleKey(e) {
		let t = e.target;
		if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) {
			e.key === "Escape" && t.blur();
			return;
		}
		if (!this.element.isConnected) return;
		let n = e.ctrlKey || e.metaKey;
		if (e.key === "Escape") {
			this.armed = null, this.library.setArmed(null), this.canvas.setArmedComponent(null), this.canvas.cancelGesture(), this.selection = w, this.setHint(""), this.refresh(!1);
			return;
		}
		if (n && e.key.toLowerCase() === "z") {
			e.preventDefault(), e.shiftKey ? this.redo() : this.undo();
			return;
		}
		if (n && e.key.toLowerCase() === "y") {
			e.preventDefault(), this.redo();
			return;
		}
		if (n && e.key.toLowerCase() === "d") {
			e.preventDefault(), this.duplicateSelection();
			return;
		}
		if (e.key === "Delete" || e.key === "Backspace") {
			if (this.selection.nodeIds.length === 0 && this.selection.wireIds.length === 0) return;
			e.preventDefault(), this.deleteSelection();
		}
	}
	applySelection(e) {
		if (e.kind === "clear") this.selection = w;
		else if (e.kind === "node") this.selection = e.additive ? nt(this.selection, e.nodeId) : et(e.nodeId);
		else if (e.kind === "wire") this.selection = e.additive ? rt(this.selection, e.wireId) : tt(e.wireId);
		else {
			let t = $e(this.artifact.circuit.nodes, e.rectangle);
			this.selection = it(this.selection, t, e.additive);
		}
		this.refresh(!1);
	}
	pruneSelection() {
		let e = new Set(this.artifact.circuit.nodes.map((e) => e.id)), t = new Set(this.artifact.circuit.wires.map((e) => e.id));
		this.selection = {
			nodeIds: this.selection.nodeIds.filter((t) => e.has(t)),
			wireIds: this.selection.wireIds.filter((e) => t.has(e))
		};
	}
	loadPreset(e) {
		this.history = T(Sn(e).artifact), this.selection = w, this.toggleCount = 0, this.armed = null, this.library.setArmed(null), this.canvas.setArmedComponent(null), this.setHint(e === "free-build" ? Q(this.locale, "لوحةٌ فارغة. ابدأ بمفتاحٍ من المكتبة.", "Empty canvas. Start with a SWITCH from the library.") : ""), this.refresh(!0), this.scheduleSave(), requestAnimationFrame(() => this.canvas.fitTo(this.artifact));
	}
	toggleInput(e) {
		let t = this.artifact.session.inputValues[e] === 1 ? 0 : 1;
		this.history = {
			...this.history,
			present: {
				...this.artifact,
				session: {
					...this.artifact.session,
					inputValues: {
						...this.artifact.session.inputValues,
						[e]: t
					}
				}
			}
		}, this.toggleCount += 1, this.toggleCount <= 2 ? this.setHint(Q(this.locale, "الصفُّ المطابق في جدول الحقيقة مُعلَّم الآن.", "The matching truth-table row is highlighted now.")) : this.setHint(""), this.refresh(!1), this.scheduleSave();
	}
	applyInputRow(e) {
		this.history = {
			...this.history,
			present: {
				...this.artifact,
				session: {
					...this.artifact.session,
					inputValues: {
						...this.artifact.session.inputValues,
						...e
					}
				}
			}
		}, this.toggleCount = 3, this.setHint(""), this.refresh(!1), this.scheduleSave();
	}
	autoLayout() {
		if (this.artifact.circuit.nodes.length === 0) {
			this.setHint(Q(this.locale, "اللوحة فارغة.", "The canvas is empty."));
			return;
		}
		let e = Wt(this.artifact.circuit);
		this.dispatch({
			type: "node.move-many",
			positions: e
		}) && (this.setHint(Q(this.locale, "أُعيد التوزيع. تراجعٌ واحد يعيده كما كان.", "Tidied. One undo restores your layout.")), requestAnimationFrame(() => this.canvas.fitTo(this.artifact)));
	}
	buildExplainContext(e) {
		let t = xn.find((e) => e.id === this.presetSelect.value), { truthTable: n } = e;
		if (n.outputNodeIds.length === 0) return null;
		let r = n.inputNodeIds.map((t) => e.displayNameByNodeId[t] ?? t), i = n.outputNodeIds.map((t) => e.displayNameByNodeId[t] ?? t), a = n.rows.slice(0, 32).map((e) => `${n.inputNodeIds.map((t) => e.inputs[t]).join("")} → ${n.outputNodeIds.map((t) => e.outputs[t] ?? "X").join(" ")}`), o = n.outputNodeIds.map((t, n) => `${i[n]} = ${e.simplificationByOutputId[t]?.expression ?? "?"}`), s = /* @__PURE__ */ new Map();
		for (let e of this.artifact.circuit.nodes) e.role === "gate" && s.set(e.component, (s.get(e.component) ?? 0) + 1);
		return {
			presetId: t?.id ?? "free-build",
			presetName: t?.name ?? "Free build",
			chapter: t ? wn(t.id) : "free build",
			variableNames: r,
			outputNames: i,
			truthRows: a,
			expressions: o,
			gateSummary: [...s.entries()].map(([e, t]) => `${t}× ${e}`).join(", ") || "none"
		};
	}
	reloadSlots() {
		this.slotList = this.slotStore?.list() ?? [], this.slots.refresh();
	}
	async saveSlot(e, t) {
		if (!this.slotStore) return;
		let n = await this.slotStore.save(e, this.artifact, t);
		if (this.reloadSlots(), n.ok) {
			this.setHint(Q(this.locale, `حُفظت باسم «${n.slot.name}».`, `Saved as “${n.slot.name}”.`));
			return;
		}
		let [r, i] = {
			"empty-name": ["اكتب اسماً للحفظة.", "Give the save a name."],
			"limit-reached": ["بلغتَ 12 محفوظات. احذف واحدةً أو استبدلها.", "You have 12 saves. Delete one or replace it."],
			"quota-or-storage-failure": ["امتلأ تخزينُ المتصفّح — احذف محفوظةً قديمة.", "Browser storage is full — delete an older save."]
		}[n.reason] ?? ["تعذّر الحفظ.", "Save failed."];
		this.setHint(Q(this.locale, r, i), "error");
	}
	async openSlot(e) {
		let t = await this.slotStore?.load(e);
		if (!t) {
			this.setHint(Q(this.locale, "تعذّرت قراءةُ هذه المحفوظة.", "That save could not be read."), "error");
			return;
		}
		this.history = T(t), this.selection = w, this.presetSelect.value = t.sourcePresetId ?? "free-build", this.refresh(!0), this.scheduleSave(), requestAnimationFrame(() => this.canvas.fitTo(this.artifact)), this.setHint(Q(this.locale, "فُتحت المحفوظة.", "Save opened."));
	}
	toggleWideCanvas() {
		this.wideCanvas = !this.wideCanvas, this.library.setCollapsed(this.wideCanvas), this.evidence.setCollapsed(this.wideCanvas), this.syncWideButton(), requestAnimationFrame(() => this.canvas.fitTo(this.artifact));
	}
	syncWideButton() {
		let e = this.wideCanvas ? Q(this.locale, "أعِد الحجم الطبيعي", "Restore panels") : Q(this.locale, "وسّع اللوحة", "Maximise canvas");
		this.wideButton.replaceChildren(Qr(this.wideCanvas ? $.narrow : $.widen)), this.wideButton.title = e, this.wideButton.setAttribute("aria-label", e), this.wideButton.setAttribute("aria-pressed", String(this.wideCanvas)), this.wideButton.dataset.arTitle = this.wideCanvas ? "أعِد الحجم الطبيعي" : "وسّع اللوحة", this.wideButton.dataset.enTitle = this.wideCanvas ? "Restore panels" : "Maximise canvas";
	}
	adoptSharedArtifact(e) {
		this.history = T(e), this.selection = w, this.presetSelect.value = e.sourcePresetId ?? "free-build", this.refresh(!0), requestAnimationFrame(() => this.canvas.fitTo(this.artifact)), this.setHint(Q(this.locale, "فُتحت دائرةٌ مشارَكة. عدّلها كما تشاء، واحفظها باسمٍ لتبقى عندك.", "Opened a shared circuit. Edit it freely, and save a named copy to keep it."));
	}
	async shareLink() {
		let e = await un(this.artifact);
		if (e.mode !== "fragment") {
			this.setHint(Q(this.locale, "الدائرةُ أكبر من أن تُحمَل في رابط — صدّرها ملفّاً.", "This circuit is too large for a link — export it as a file instead."), "error");
			return;
		}
		let t = `${location.origin}${location.pathname}#${e.fragment}`;
		try {
			await navigator.clipboard.writeText(t), this.setHint(Q(this.locale, "نُسخ رابطُ الدائرة.", "Circuit link copied."));
		} catch {
			await zr({
				title: Q(this.locale, "رابط الدائرة", "Circuit link"),
				label: Q(this.locale, "انسخه من هنا", "Copy it from here"),
				value: t,
				confirmText: Q(this.locale, "تمّ", "Done"),
				cancelText: Q(this.locale, "إغلاق", "Close")
			});
		}
	}
	async exportArtifact() {
		let e = await $t(this.artifact, (/* @__PURE__ */ new Date()).toISOString()), t = new Blob([e], { type: "application/json" }), n = URL.createObjectURL(t), r = document.createElement("a");
		r.href = n, r.download = `${this.artifact.sourcePresetId ?? "circuit"}.garden-lab.json`, r.click(), setTimeout(() => URL.revokeObjectURL(n), 4e3), this.setHint(Q(this.locale, "صُدِّرت الآلة ملفاً.", "Circuit exported."));
	}
	importArtifact() {
		let e = document.createElement("input");
		e.type = "file", e.accept = ".json,application/json", e.addEventListener("change", async () => {
			let t = e.files?.[0];
			if (!t) return;
			let n = await en(await t.text());
			if (!n.ok) {
				let [e, t] = {
					"invalid-json": ["الملفُّ ليس JSON سليماً.", "That file is not valid JSON."],
					"invalid-envelope": ["الملفُّ ليس تصديرَ مختبرٍ من الحديقة.", "That is not a Digital Garden lab export."],
					"checksum-mismatch": ["الملفُّ تغيّر بعد تصديره — البصمةُ لا تطابق.", "The file changed after export — checksum mismatch."],
					"unsupported-or-corrupted": ["نسخةُ الملفّ غير مدعومة أو تالفة.", "Unsupported or corrupted file version."]
				}[n.reason] ?? ["تعذّر الاستيراد.", "Import failed."];
				this.setHint(Q(this.locale, e, t), "error");
				return;
			}
			this.history = T(n.artifact), this.selection = w, this.presetSelect.value = n.artifact.sourcePresetId ?? this.presetSelect.value, this.refresh(!0), this.scheduleSave(), requestAnimationFrame(() => this.canvas.fitTo(this.artifact)), this.setHint(Q(this.locale, "استُوردت الآلة.", "Circuit imported."));
		}), e.click();
	}
	storeViewport(e) {
		this.history = {
			...this.history,
			present: {
				...this.artifact,
				session: {
					...this.artifact.session,
					viewport: e
				}
			}
		};
	}
	setHint(e, t = "info") {
		this.hintTimer &&= (clearTimeout(this.hintTimer), null), this.hintLine.textContent = e, this.hintLine.hidden = e.length === 0, this.hintLine.classList.toggle("is-error", t === "error" && e.length > 0), t === "error" && e.length > 0 && (this.hintTimer = setTimeout(() => this.setHint(""), 6e3));
	}
	scheduleSave() {
		this.saver && this.saver.schedule(this.artifact, (e) => {
			this.syncSaveLine(e.ok ? Q(this.locale, "محفوظ على هذا الجهاز", "Saved on this device") : Q(this.locale, "تعذّر الحفظ المحلي", "Local save failed"));
		});
	}
	syncSaveLine(e) {
		this.saveLine.textContent = e;
	}
	nextNodeId(e) {
		let t = e.toLowerCase().replace(/_/g, "-"), n = new Set(this.artifact.circuit.nodes.map((e) => e.id)), r = 1;
		for (; n.has(`${t}-${r}`);) r += 1;
		return `${t}-${r}`;
	}
	nextWireId() {
		let e = new Set(this.artifact.circuit.wires.map((e) => e.id)), t = 1;
		for (; e.has(`wire-${t}`);) t += 1;
		return `wire-${t}`;
	}
	refresh(e) {
		e && (this.history = {
			...this.history,
			present: {
				...this.artifact,
				session: {
					...this.artifact.session,
					viewport: {
						x: 0,
						y: 0,
						zoom: 1
					}
				}
			}
		});
		let t = Pe(this.artifact);
		this.canvas.render(this.artifact, t.values, this.selection), this.evidence.update(this.artifact, t);
		let n = this.selection.nodeIds.length === 1 ? this.artifact.circuit.nodes.find((e) => e.id === this.selection.nodeIds[0]) ?? null : null;
		this.properties.update(n), this.syncEditButtons();
	}
	syncEditButtons() {
		let e = this.selection.nodeIds.length > 0 || this.selection.wireIds.length > 0;
		this.undoButton.disabled = this.history.past.length === 0, this.redoButton.disabled = this.history.future.length === 0, this.deleteButton.disabled = !e, this.duplicateButton.disabled = this.selection.nodeIds.length === 0;
	}
	iconButton(e, t, n, r) {
		let i = Z("button", "cx-icon-btn");
		return i.type = "button", i.appendChild(Qr(e)), i.dataset.arTitle = t, i.dataset.enTitle = n, i.addEventListener("click", r), i;
	}
	textButton(e, t, n, r) {
		let i = Z("button", "cx-icon-btn cx-icon-btn--text", e);
		return i.type = "button", i.dataset.arTitle = t, i.dataset.enTitle = n, i.addEventListener("click", r), i;
	}
};
function ei() {
	try {
		return localStorage.setItem("garden_labs_probe", "1"), localStorage.removeItem("garden_labs_probe"), new gn(new fn(localStorage));
	} catch {
		return null;
	}
}
function ti() {
	try {
		return localStorage.setItem("garden_labs_probe", "1"), localStorage.removeItem("garden_labs_probe"), new hn(localStorage);
	} catch {
		return null;
	}
}
function ni() {
	try {
		return new fn(localStorage).load().then((e) => e.ok ? d(e.artifact) : null).catch(() => null);
	} catch {
		return Promise.resolve(null);
	}
}
//#endregion
//#region labs/cs231-combinational-circuit-builder/src/main.ts
function ri() {
	try {
		return localStorage.getItem("garden_lang") === "en" ? "en" : "ar";
	} catch {
		return "ar";
	}
}
async function ii() {
	let e = location.hash.replace(/^#/, "");
	if (!e.startsWith("circuit=")) return null;
	let t = await dn(e, () => `artifact:shared.${Date.now().toString(36)}`);
	return history.replaceState(null, "", `${location.pathname}${location.search}`), t.ok ? t.artifact : null;
}
async function ai() {
	let e = document.querySelector("[data-lab-root]");
	if (!e) return;
	let t = new URLSearchParams(location.search).get("preset"), n = await ii(), r = n || t ? null : await ni(), i = new $r(t, ri(), r ?? void 0);
	e.replaceChildren(i.element), n && i.adoptSharedArtifact(n), document.addEventListener("garden:languageChanged", () => i.setLocale(ri()));
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => void ai()) : ai();
//#endregion

//# sourceMappingURL=lab-cs231.js.map