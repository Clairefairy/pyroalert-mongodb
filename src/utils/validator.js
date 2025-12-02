const isISODate = (s) => { const d = Date.parse(s); return !isNaN(d); };
module.exports = { isISODate };
