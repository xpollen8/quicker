const MyWrap = require('mywrap');

class Quicker extends MyWrap {

	constructor(config = {}) {
		const dbConfig = {
			database: 'stock',
			...config.mysql,
		};
		super(dbConfig);
		this.database = dbConfig.database;
		this.config = config.quicker;
		this.date = config.date;
		this.account = config.account;
	}

	setDate = (date = new Date()) => { this.date = new Date(date).toISOString(); console.log("DATE", date); }
	getDate = () => this.date;
	setAccount = (account) => this.account = account;
	getAccount = () => this.account;
	getDatabase = () => this.database;
	getConfig = () => this.config;

	fetchGoalsByDate = async () => {
		const db = this.getDb();
		const date = this.getDate();
		const res = await db.query(`select * from ${this.getDatabase()}.goal where (date IS NULL OR date <= '${date}') order by name, date`);
		const goal = {};
		for (var { name, percentage } of (Array.isArray(res) ? res : [ res ]) ) {
			goal[name] = percentage;	// keeps most recent percentage
		}
		return goal;
	};

	fetchSecuritiesByDate = async () => {
		const db = this.getDb();
		const date = this.getDate();

		const fetchSectors = async (symbol) => {
			const res = await db.query(`
				select p.* from ${this.getDatabase()}.sectorage p
					inner join (select symbol, max(date) as date from ${this.getDatabase()}.sectorage where (date IS NULL OR date <= '${date}') group by 1) as x
					on x.symbol=p.symbol and x.date=p.date
					where p.symbol='${symbol}'
				`);
			const ret = (Array.isArray(res) ? res : [ res ])?.map(({ name, percent }) => ({ name, percent }));
			if (ret[0]) {
				return ret;
			}
			return [ { name: 'N/A', percent: 100 }];
		};

		const fetchPercents = async (symbol) => {
			const res = await db.query(`
				select p.* from ${this.getDatabase()}.percentage p
					inner join (select symbol, max(date) as date from ${this.getDatabase()}.percentage where (date IS NULL OR date <= '${date}') group by 1) as x
					on x.symbol=p.symbol and x.date=p.date
					where p.symbol='${symbol}'
				`);
			const ret = res && (Array.isArray(res) ? res : [ res ])?.map(({ name, percent, isforeign }) => ({ name, percent, isforeign })) || [];
			if (ret[0]) {
				return ret;
			}
			return [ { name: 'N/A', percent: 100 }];
		};

		const fetchSecurity = async (symbol) => {
			const res = await db.query(`select * from ${this.getDatabase()}.security where (date IS NULL OR date <= '${date}') and symbol='${symbol}'`);
			const ret = (Array.isArray(res) ? res : [ res ])?.map(({ symbol, name, expense }) => ({ symbol, name, expense }));
			if (ret[0]) {
				return ret[0];
			}
			console.log(`ERROR - security found in '${this.getDatabase()}.holding' w/no '${this.getDatabase()}.security' row`, symbol, `on date ${this.getDate()}`);
			return {};
		};

		const res = await db.query(`select distinct(symbol) as symbol from ${this.getDatabase()}.holding where date <= '${date}' group by 1 having sum(shares) > 0`);
		return await Promise.all((Array.isArray(res) ? res : [ res ])?.map(async ({ symbol }) => ({
			symbol,
			security: await fetchSecurity(symbol),
			sectors: await fetchSectors(symbol),
			percents: await fetchPercents(symbol),
		})));
	};

	fetchHoldingsByDate = async () => {
		const db = this.getDb();
		const date = this.getDate();
		let account = "";
		if (this.getAccount()) {
			account = ` and account='${this.getAccount()}'`;
		}
		const res = await db.query(`select h.account, q.symbol, sum(h.shares) as shares, q.close, sum(h.shares) * q.close as value, sum(h.commission) as fees, q.date, sum(h.shares * h.price) as basis
			from ${this.getDatabase()}.holding h, ${this.getDatabase()}.quote q
			inner join (select symbol, max(date) as date from ${this.getDatabase()}.quote where date <= '${date}' group by 1) as x
			on x.symbol=q.symbol and x.date=q.date
			where h.symbol=q.symbol
			and date(h.date) <= '${date}'
			and date(q.date) <= '${date}'
			and date(x.date) <= '${date}'
			${account}
			group by 1, 2
			having shares > 0
			`);
		return (Array.isArray(res) ? res : [ res ])?.map(({ account, symbol, shares, close, value, basis, fees }) =>
			({ account, symbol, shares, quote: close, value, basis, fees }));
	};

	fetchValuesByDate = async (date) => {
		if (!this.getDate()) {
			this.setDate(date);
		}
		const securities = await this.fetchSecuritiesByDate();
		const holdings = await this.fetchHoldingsByDate();

		const sums = {
			value: 0,
			fees: 0,
			classes: {},
			sectors: {}
		};
		const results = [];
		
		for (var holding of holdings) {
			const  { account, symbol, percents, sectors, security } = securities.find(f => f.symbol === holding.symbol) || {};
			if (!symbol) {
				console.log(`ERROR - security found in '${this.getDatabase()}.holding' w/no '${this.getDatabase()}.security' row`, holding.symbol, `on date ${this.getDate()}`);
			} else {
				const value = holding.value || 0;
				sums.fees += holding.fees;
				sums.value += value;
				let tsum = 0;
				let ssum = 0;
				results.push({
					account,
					...security,
					...holding,
					sectors: sectors?.map(({ name, percent }) => {
						if (!sums.sectors[name]) { sums.sectors[name] = 0; }
						ssum += percent;
						const part = value * percent / 100;
						sums.sectors[name] += part; 
						return { name, percent, value: part };
					}),
					classes: percents?.map(({ name, percent, isforeign }) => {
						if (!sums.classes[name]) { sums.classes[name] = 0; }
						tsum += percent;
						const part = value * percent / 100;
						sums.classes[name] += part; 
						return { name, percent, isforeign, value: part };
					}),
					sums: {
						sectors: ssum,
						classes: tsum,
					}
				});
			}
		}
		return { sums, results };
	};
};

module.exports = Quicker;
